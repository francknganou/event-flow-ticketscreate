import bcrypt from "bcryptjs";

interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ success: boolean; results?: T[] }>;
  run<T = Record<string, unknown>>(): Promise<{ success: boolean; meta: { last_row_id?: number; changes?: number }; results?: T[] }>;
}
interface Database { prepare(query: string): Statement; batch<T = unknown>(statements: Statement[]): Promise<T[]> }
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: Database;
  API_ORIGIN?: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
}
type UserRow = { id: number; first_name: string; last_name: string; email: string; password_hash: string; role: string; account_status?: string };

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);

async function sendVerificationEmail(request: Request, env: Env, user: Pick<UserRow, "id" | "first_name" | "last_name" | "email">): Promise<boolean> {
  const token = newToken();
  await env.DB.prepare(`INSERT INTO email_verifications(user_id,token_hash,expires_at,verified_at)
    VALUES(?,?,datetime('now','+24 hours'),NULL)
    ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at,verified_at=NULL,created_at=CURRENT_TIMESTAMP`)
    .bind(user.id, await digest(token)).run();
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) return false;
  const link = new URL(`/verify-email?token=${encodeURIComponent(token)}`, request.url).toString();
  const name = escapeHtml(`${user.first_name} ${user.last_name}`.trim());
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || "EventFlow" },
        to: [{ email: user.email, name: `${user.first_name} ${user.last_name}`.trim() }],
        subject: "Confirmez votre adresse e-mail — EventFlow",
        textContent: `Bonjour ${user.first_name}, confirmez votre adresse e-mail pour activer votre compte EventFlow : ${link}\n\nCe lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#17152a"><h1 style="color:#6d3ce8">Bienvenue sur EventFlow</h1><p>Bonjour ${name},</p><p>Confirmez votre adresse e-mail pour activer votre compte.</p><p style="margin:28px 0"><a href="${link}" style="background:#6d3ce8;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Confirmer mon adresse e-mail</a></p><p>Ce lien est valable 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p></div>`,
        tags: ["eventflow-email-verification"],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (response.ok) return true;
    const failure = await response.json().catch(() => ({})) as { code?: string };
    console.error("Brevo rejected verification email", response.status, failure.code || "provider_error");
    return false;
  } catch (error) {
    console.error("Could not send verification email", error instanceof Error ? error.name : "network_error");
    return false;
  }
}

async function currentUser(request: Request, env: Env): Promise<UserRow | null> {
  const raw = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!raw) return null;
  return env.DB.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.password_hash,u.role
    FROM api_tokens t JOIN users u ON u.id=t.user_id
    LEFT JOIN user_account_status s ON s.user_id=u.id
    WHERE t.token_hash=? AND datetime(t.expires_at)>datetime('now') AND COALESCE(s.status,'active')='active'`)
    .bind(await digest(raw)).first<UserRow>();
}

function noStoreJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function eventsApi(request: Request, env: Env, user: UserRow | null): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET") return json({ error: "La gestion des événements n’est pas encore activée sur cette version D1." }, 501);
  // Retain historical event details in D1 for ticket and financial records, but
  // remove them from the catalogue 12 months after their end date.
  const withinRetention = "datetime(COALESCE(NULLIF(e.end_date,''),e.event_date)) >= datetime('now','-12 months')";
  const where = user?.role === "admin"
    ? withinRetention
    : user?.role === "organizer"
      ? `(((e.status IN ('published','completed') AND e.visibility='public') OR e.organizer_id=?) AND ${withinRetention})`
      : `(e.status IN ('published','completed') AND e.visibility='public') AND ${withinRetention}`;
  const stmt = env.DB.prepare(`SELECT e.id,e.organizer_id,e.title,e.event_date AS date,e.end_date AS endDate,
    e.location,e.price,e.image,e.capacity,e.available_tickets AS availableTickets,e.category,
    e.description,e.created_by AS createdBy,e.status,e.visibility
    FROM events e WHERE ${where} ORDER BY e.event_date`);
  const rows = user?.role === "organizer" ? await stmt.bind(user.id).all() : await stmt.all();
  const output = await Promise.all((rows.results || []).map(async (row: any) => {
    const types = await env.DB.prepare(`SELECT id,name,price,quantity,available_quantity AS availableQuantity,
      max_per_order AS maxPerOrder,sales_start AS salesStart,sales_end AS salesEnd,description
      FROM event_ticket_types WHERE event_id=? ORDER BY created_at`).bind(row.id).all();
    return { ...row, id: String(row.id), price: Number(row.price), capacity: Number(row.capacity),
      availableTickets: Number(row.availableTickets), ticketTypes: (types.results || []).map((t: any) => ({
        ...t, price: Number(t.price), quantity: Number(t.quantity), availableQuantity: Number(t.availableQuantity), maxPerOrder: Number(t.maxPerOrder),
      })) };
  }));
  return noStoreJson(output);
}

async function usersApi(request: Request, env: Env, user: UserRow | null): Promise<Response> {
  if (!user) return json({ error: "Connectez-vous pour gérer les utilisateurs." }, 401);
  if (user.role !== 'admin') return json({ error: "Accès réservé à l’administrateur." }, 403);
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const pageSize = 25;
    const page = Math.max(1, Math.min(10_000, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1));
    const query = (url.searchParams.get('q') || '').trim().slice(0, 120);
    const filter = url.searchParams.get('status') || 'all';
    if (!['all','active','disabled','deleted'].includes(filter)) return json({ error: "Filtre de statut invalide." }, 422);
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (query) {
      clauses.push("(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.role LIKE ?)");
      const pattern = `%${query}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (filter !== 'all') { clauses.push("COALESCE(s.status,'active')=?"); params.push(filter); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await env.DB.prepare(`SELECT COUNT(*) AS total FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id ${where}`)
      .bind(...params).first<{ total: number }>();
    const users = await env.DB.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.role,u.created_at,
      COALESCE(s.status,'active') AS status,CASE WHEN v.user_id IS NULL OR v.verified_at IS NOT NULL THEN 1 ELSE 0 END AS email_verified
      FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id LEFT JOIN email_verifications v ON v.user_id=u.id
      ${where} ORDER BY CASE WHEN COALESCE(s.status,'active')='deleted' THEN 1 ELSE 0 END,u.created_at DESC,u.id DESC
      LIMIT ? OFFSET ?`).bind(...params, pageSize, (page - 1) * pageSize).all<any>();
    const totals = await env.DB.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN COALESCE(s.status,'active')='active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN s.status='disabled' THEN 1 ELSE 0 END) AS disabled,
      SUM(CASE WHEN s.status='deleted' THEN 1 ELSE 0 END) AS deleted,
      SUM(CASE WHEN v.user_id IS NOT NULL AND v.verified_at IS NULL THEN 1 ELSE 0 END) AS pending_verification
      FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id LEFT JOIN email_verifications v ON v.user_id=u.id`).first<any>();
    const total = Number(count?.total || 0);
    return noStoreJson({ users: users.results || [], stats: { total: Number(totals?.total || 0), active: Number(totals?.active || 0), disabled: Number(totals?.disabled || 0), deleted: Number(totals?.deleted || 0), pendingVerification: Number(totals?.pending_verification || 0) }, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)), currentUserId: user.id });
  }

  const id = Number(url.searchParams.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) return json({ error: "Identifiant d’utilisateur invalide." }, 422);
  const target = await env.DB.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.role,COALESCE(s.status,'active') AS status
    FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id WHERE u.id=?`).bind(id).first<any>();
  if (!target) return json({ error: "Utilisateur introuvable." }, 404);
  if (request.method === 'DELETE') {
    if (target.id === user.id) return json({ error: "Vous ne pouvez pas supprimer votre propre compte administrateur." }, 409);
    if (target.status === 'deleted') return json({ error: "Ce compte est déjà supprimé." }, 409);
    if (target.role === 'admin' && target.status === 'active') {
      const admins = await env.DB.prepare(`SELECT COUNT(*) AS total FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id
        WHERE u.role='admin' AND COALESCE(s.status,'active')='active'`).first<{ total: number }>();
      if (Number(admins?.total || 0) <= 1) return json({ error: "Impossible de supprimer le dernier administrateur actif." }, 409);
    }
    const erasedEmail = `deleted-${target.id}-${Date.now()}@invalid.eventflow`;
    const replacementPassword = await bcrypt.hash(newToken(), 12);
    const details = JSON.stringify({ status: 'deleted', previous_role: target.role });
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET first_name='Compte',last_name='supprimé',email=?,password_hash=? WHERE id=?").bind(erasedEmail, replacementPassword, target.id),
      env.DB.prepare(`INSERT INTO user_account_status(user_id,status,changed_by) VALUES(?,'deleted',?)
        ON CONFLICT(user_id) DO UPDATE SET status='deleted',changed_by=excluded.changed_by,changed_at=CURRENT_TIMESTAMP`).bind(target.id, user.id),
      env.DB.prepare("DELETE FROM api_tokens WHERE user_id=?").bind(target.id),
      env.DB.prepare("DELETE FROM email_verifications WHERE user_id=?").bind(target.id),
      env.DB.prepare("UPDATE audit_logs SET actor_email='Compte supprimé' WHERE actor_user_id=?").bind(target.id),
      env.DB.prepare(`INSERT INTO audit_logs(actor_user_id,actor_email,action,entity_type,entity_id,details)
        VALUES(?,?,'user.deleted','user',?,?)`).bind(user.id, user.email, String(target.id), details),
    ]);
    return json({ ok: true, message: "Le profil est supprimé et anonymisé. Les historiques liés aux billets et aux ventes sont conservés." });
  }
  if (request.method !== 'POST') return json({ error: "Méthode invalide." }, 405);
  const body = await request.json().catch(() => null) as { status?: string; action?: string } | null;
  if (body?.action === 'confirm-email') {
    if (target.status === 'deleted') return json({ error: "Un compte supprimé ne peut pas être confirmé." }, 409);
    if (target.id === user.id) return json({ error: "Vous ne pouvez pas confirmer vous-même ce compte administrateur." }, 409);
    const pendingEmail = await env.DB.prepare("SELECT verified_at FROM email_verifications WHERE user_id=?").bind(target.id).first<{ verified_at: string | null }>();
    if (!pendingEmail) return json({ error: "Ce compte ne requiert pas de confirmation e-mail." }, 409);
    if (pendingEmail.verified_at) return json({ ok: true, message: "L’adresse e-mail est déjà confirmée." });
    await env.DB.batch([
      env.DB.prepare("UPDATE email_verifications SET verified_at=CURRENT_TIMESTAMP,token_hash=NULL WHERE user_id=? AND verified_at IS NULL").bind(target.id),
      env.DB.prepare(`INSERT INTO audit_logs(actor_user_id,actor_email,action,entity_type,entity_id,details)
        VALUES(?,?,'user.email_confirmed_by_admin','user',?,?)`).bind(user.id,user.email,String(target.id),JSON.stringify({email_confirmation:'admin'})),
    ]);
    return json({ ok: true, message: "Compte confirmé par l’administrateur. Aucune vérification par e-mail n’est désormais requise." });
  }
  if (!body || !['active','disabled'].includes(body.status || '')) return json({ error: "Statut demandé invalide." }, 422);
  if (target.status === 'deleted') return json({ error: "Un compte supprimé ne peut pas être réactivé." }, 409);
  if (target.status === body.status) return json({ ok: true, message: body.status === 'active' ? "Le compte est déjà actif." : "Le compte est déjà désactivé." });
  if (body.status === 'disabled' && target.id === user.id) return json({ error: "Vous ne pouvez pas désactiver votre propre compte administrateur." }, 409);
  if (body.status === 'disabled' && target.role === 'admin') {
    const admins = await env.DB.prepare(`SELECT COUNT(*) AS total FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id
      WHERE u.role='admin' AND COALESCE(s.status,'active')='active'`).first<{ total: number }>();
    if (Number(admins?.total || 0) <= 1) return json({ error: "Impossible de désactiver le dernier administrateur actif." }, 409);
  }
  const action = body.status === 'disabled' ? 'user.disabled' : 'user.activated';
  const details = JSON.stringify({ status: body.status, previous_role: target.role });
  const statements = [
    env.DB.prepare(`INSERT INTO user_account_status(user_id,status,changed_by) VALUES(?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,changed_by=excluded.changed_by,changed_at=CURRENT_TIMESTAMP`).bind(target.id, body.status, user.id),
    env.DB.prepare(`INSERT INTO audit_logs(actor_user_id,actor_email,action,entity_type,entity_id,details)
      VALUES(?,?,?,'user',?,?)`).bind(user.id, user.email, action, String(target.id), details),
  ];
  if (body.status === 'disabled') statements.push(env.DB.prepare("DELETE FROM api_tokens WHERE user_id=?").bind(target.id));
  await env.DB.batch(statements);
  return json({ ok: true, message: body.status === 'disabled' ? "Compte désactivé. Ses sessions ont été fermées." : "Compte réactivé. L’utilisateur peut se reconnecter." });
}

async function subscriptionApi(request: Request, env: Env, user: UserRow | null): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get("plans") === "1" && request.method === "GET") {
    const result = await env.DB.prepare(`SELECT id,name,monthly_price AS monthlyPrice,annual_price AS annualPrice,
      max_events AS maxEvents,max_tickets_per_event AS maxTicketsPerEvent,max_ticket_types AS maxTicketTypes,
      max_controllers AS maxControllers,commission,features FROM plans ORDER BY monthly_price`).all();
    return noStoreJson((result.results || []).map((p: any) => ({ ...p,
      monthlyPrice: Number(p.monthlyPrice), annualPrice: Number(p.annualPrice),
      maxEvents: p.maxEvents == null ? null : Number(p.maxEvents),
      maxTicketsPerEvent: p.maxTicketsPerEvent == null ? null : Number(p.maxTicketsPerEvent),
      maxTicketTypes: p.maxTicketTypes == null ? null : Number(p.maxTicketTypes),
      maxControllers: p.maxControllers == null ? null : Number(p.maxControllers),
      commission: Number(p.commission), features: JSON.parse(p.features || "[]"),
    })));
  }
  if (!user) return json({ error: "Connectez-vous pour consulter votre abonnement." }, 401);
  if (!['organizer', 'admin'].includes(user.role)) return json({ error: "Réservé aux organisateurs." }, 403);
  if (url.searchParams.get("admin") === "1") {
    if (user.role !== "admin") return json({ error: "Accès réservé à l’administrateur." }, 403);
    if (request.method !== "GET") return json({ error: "La gestion des ajustements d’abonnement nécessite encore son service D1." }, 501);
    const result = await env.DB.prepare(`SELECT u.id AS organizer_id,u.first_name,u.last_name,u.email,
      s.id,s.plan_id,s.billing_period,s.status,s.ends_at,s.adjustment_type,s.adjustment_value,
      s.adjustment_reason,p.name AS plan_name,
      CASE WHEN s.id IS NULL THEN 0 WHEN s.billing_period='annual' THEN p.annual_price ELSE p.monthly_price END AS base_price
      FROM users u LEFT JOIN subscriptions s ON s.id=(SELECT s2.id FROM subscriptions s2 WHERE s2.organizer_id=u.id ORDER BY s2.id DESC LIMIT 1)
      LEFT JOIN plans p ON p.id=s.plan_id WHERE u.role='organizer' ORDER BY u.first_name,u.last_name`).all<any>();
    const rows = result.results || [];
    return noStoreJson({ subscriptions: rows.map((row: any) => ({ ...row, id: row.id == null ? null : Number(row.id),
      status: row.status || 'not_subscribed', base_price: Number(row.base_price || 0), adjustment_value: Number(row.adjustment_value || 0) })),
      stats: { organizers: rows.length, total: rows.filter((r: any) => r.id != null).length,
        active: rows.filter((r: any) => ['active','grace'].includes(r.status)).length,
        expired: rows.filter((r: any) => r.status === 'expired').length,
        pending: rows.filter((r: any) => r.status === 'pending_payment').length } });
  }
  if (request.method !== "GET") return json({ error: "Le paiement et la modification d’abonnement nécessitent encore la configuration du service de facturation." }, 501);
  const sub = await env.DB.prepare(`SELECT s.*,p.name AS plan_name,p.monthly_price,p.annual_price,
    p.max_events,p.max_tickets_per_event,p.max_ticket_types,p.max_controllers,p.commission,p.features
    FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.organizer_id=?
    ORDER BY CASE WHEN s.status IN ('active','grace') AND (s.ends_at IS NULL OR datetime(s.ends_at)>=datetime('now')) THEN 0 ELSE 1 END,s.id DESC LIMIT 1`).bind(user.id).first<any>();
  const usage = await env.DB.prepare(`SELECT COUNT(*) AS events FROM events WHERE organizer_id=? AND status IN ('draft','published','ongoing')`).bind(user.id).first<any>();
  const controllers = await env.DB.prepare(`SELECT COUNT(DISTINCT es.user_id) AS controllers FROM event_staff es JOIN events e ON e.id=es.event_id WHERE e.organizer_id=?`).bind(user.id).first<any>();
  const counts = { events: Number(usage?.events || 0), controllers: Number(controllers?.controllers || 0) };
  if (!sub) return noStoreJson({ subscription: null, usage: counts, message: "Choisissez une formule pour activer votre espace organisateur." });
  const payments = await env.DB.prepare(`SELECT id,amount,currency,status,created_at FROM subscription_payments WHERE subscription_id=? ORDER BY id DESC LIMIT 20`).bind(sub.id).all();
  const base = Number(sub.billing_period === 'annual' ? sub.annual_price : sub.monthly_price);
  const delta = sub.adjustment_type === 'percent' ? base * Number(sub.adjustment_value) / 100 : sub.adjustment_type === 'fixed' ? Number(sub.adjustment_value) : 0;
  return noStoreJson({ subscription: { ...sub, features: JSON.parse(sub.features || '[]'), usage: counts,
    payments: payments.results || [], base_price: base, effective_price: Math.max(0, Math.round(base + delta)) }, usage: counts });
}

async function dashboardApi(request: Request, env: Env, user: UserRow | null): Promise<Response> {
  if (!user) return json({ error: "Connectez-vous pour consulter le tableau de bord." }, 401);
  if (!['admin', 'organizer'].includes(user.role)) return json({ error: "Accès réservé aux organisateurs et à l’administrateur." }, 403);
  const filter = user.role === 'admin' ? '' : ' WHERE organizer_id=?';
  const events = await (user.role === 'admin'
    ? env.DB.prepare('SELECT id,title,event_date AS date,location,price,capacity,available_tickets AS availableTickets,category,status,visibility FROM events ORDER BY event_date LIMIT 8').all()
    : env.DB.prepare(`SELECT id,title,event_date AS date,location,price,capacity,available_tickets AS availableTickets,category,status,visibility FROM events${filter} ORDER BY event_date LIMIT 8`).bind(user.id).all());
  const count = await (user.role === 'admin'
    ? env.DB.prepare('SELECT COUNT(*) AS total FROM events').first<any>()
    : env.DB.prepare('SELECT COUNT(*) AS total FROM events WHERE organizer_id=?').bind(user.id).first<any>());
  return noStoreJson({ stats: { events: Number(count?.total || 0), sold: 0, revenue: 0, attendees: 0, reservations: 0, pending: 0, checkedIn: 0 },
    events: (events.results || []).map((event: any) => ({ ...event, id: String(event.id) })), activity: [], salesTrend: [], organizerRequests: [], role: user.role,
    notice: 'Les statistiques de ventes seront disponibles après l’activation des réservations sur le service D1.' });
}

async function emailApi(request: Request, env: Env, user: UserRow | null): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Méthode invalide." }, 405);
  if (!user) return json({ error: "Connectez-vous pour tester la messagerie." }, 401);
  if (user.role !== "admin") return json({ error: "Seul l’administrateur peut lancer le test e-mail." }, 403);
  const body = await request.json().catch(() => null) as { action?: string } | null;
  if (body?.action !== "test") return json({ error: "Action e-mail inconnue." }, 422);
  const bucket = await digest(`brevo-test:${user.id}`);
  const limit = await env.DB.prepare(`INSERT INTO api_rate_limits(bucket_key,hits,window_started) VALUES(?,1,datetime('now'))
    ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN datetime(window_started,'+1 hour')<=datetime('now') THEN 1 ELSE hits+1 END,
    window_started=CASE WHEN datetime(window_started,'+1 hour')<=datetime('now') THEN datetime('now') ELSE window_started END
    RETURNING hits`).bind(bucket).first<{ hits: number }>();
  if ((limit?.hits || 0) > 3) return json({ error: "Limite de tests atteinte. Réessayez dans une heure." }, 429);
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    return json({ error: "Brevo n’est pas encore configuré : ajoutez la clé API et l’adresse expéditeur vérifiée dans les paramètres Worker." }, 503);
  }
  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || "EventFlow" },
        to: [{ email: user.email, name: `${user.first_name} ${user.last_name}`.trim() }],
        subject: "Test de messagerie EventFlow",
        textContent: "La connexion entre EventFlow et Brevo fonctionne. Cet e-mail confirme que le service d’envoi transactionnel répond correctement.",
        htmlContent: "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#17152a\"><h1 style=\"color:#6d3ce8\">EventFlow · Test e-mail</h1><p>La connexion entre EventFlow et Brevo fonctionne.</p><p>Cet e-mail confirme que le service transactionnel répond correctement.</p></div>",
        tags: ["eventflow-connection-test"],
      }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return json({ error: "Brevo n’a pas pu être joint. Vérifiez la connexion réseau puis réessayez." }, 502);
  }
  if (!response.ok) {
    const failure = await response.json().catch(() => ({})) as { message?: string; code?: string };
    console.error("Brevo rejected test email", response.status, failure.code || "provider_error");
    return json({ error: response.status === 401 || response.status === 403
      ? "Brevo a refusé la clé API. Vérifiez sa validité et ses droits."
      : response.status === 400
        ? "Brevo a refusé l’expéditeur ou le destinataire. Vérifiez que l’adresse expéditeur est validée dans Brevo."
        : "Brevo n’a pas accepté le message. Vérifiez les paramètres de messagerie dans Brevo." }, 502);
  }
  const result = await response.json().catch(() => ({})) as { messageId?: string };
  await env.DB.prepare(`INSERT INTO audit_logs(actor_user_id,actor_email,action,entity_type,entity_id,details)
    VALUES(?,?,'email.test_sent','email',?,?)`).bind(user.id,user.email,result.messageId || "brevo",JSON.stringify({provider:"brevo",to:user.email})).run();
  return noStoreJson({ sent: true, recipient: user.email, messageId: result.messageId || null,
    message: "Brevo a accepté l’e-mail de test. Vérifiez la boîte de réception et le dossier indésirables." });
}

async function routeApi(request: Request, env: Env, path: string): Promise<Response> {
  try {
    const user = await currentUser(request, env);
    if (path === '/api/events.php') return eventsApi(request, env, user);
    if (path === '/api/users.php') return usersApi(request, env, user);
    if (path === '/api/subscription.php') return subscriptionApi(request, env, user);
    if (path === '/api/dashboard.php') return dashboardApi(request, env, user);
    if (path === '/api/email.php') return emailApi(request, env, user);
    return json({ error: `Le service « ${path.split('/').pop()} » n’est pas encore migré vers D1.` }, 501);
  } catch (error) {
    console.error('D1 API request failed', path, error);
    return json({ error: "Le service D1 est momentanément indisponible. Vérifiez que les migrations sont appliquées." }, 503);
  }
}

async function authApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Méthode invalide." }, 405);
  const action = url.searchParams.get("action") || "login";
  const auth = request.headers.get("authorization") || "";
  const rawToken = auth.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (action === "logout") {
    if (!rawToken) return json({ error: "Connexion requise." }, 401);
    await env.DB.prepare("DELETE FROM api_tokens WHERE token_hash=?").bind(await digest(rawToken)).run();
    return json({ ok: true });
  }
  if (!['login','signup','verify-email','resend-verification'].includes(action)) return json({ error: "Action inconnue." }, 404);
  let data: Record<string, unknown>;
  try {
    if (Number(request.headers.get("content-length") || 0) > 16_384) return json({ error: "Requête trop volumineuse." }, 413);
    data = await request.json() as Record<string, unknown>;
  } catch { return json({ error: "Requête JSON invalide." }, 400); }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = await digest(`${action}:${ip}`);
  const counter = await env.DB.prepare(`INSERT INTO api_rate_limits(bucket_key,hits,window_started) VALUES(?,1,datetime('now'))
    ON CONFLICT(bucket_key) DO UPDATE SET
      hits=CASE WHEN datetime(window_started,'+1 minute')<=datetime('now') THEN 1 ELSE hits+1 END,
      window_started=CASE WHEN datetime(window_started,'+1 minute')<=datetime('now') THEN datetime('now') ELSE window_started END
    RETURNING hits`).bind(bucket).first<{ hits: number }>();
  const maxAttempts = action === 'signup' ? 5 : action === 'resend-verification' ? 3 : action === 'verify-email' ? 20 : 10;
  if ((counter?.hits || 0) > maxAttempts) return json({ error: "Trop de tentatives. Réessayez dans une minute." }, 429);

  if (action === 'verify-email') {
    const verificationToken = String(data.token || '');
    if (!/^[a-f0-9]{64}$/i.test(verificationToken)) return json({ error: "Lien de confirmation invalide ou expiré." }, 422);
    const verification = await env.DB.prepare(`SELECT user_id FROM email_verifications
      WHERE token_hash=? AND verified_at IS NULL AND datetime(expires_at)>datetime('now')`)
      .bind(await digest(verificationToken)).first<{ user_id: number }>();
    if (!verification) return json({ error: "Ce lien de confirmation est expiré ou a déjà été utilisé. Demandez un nouveau lien." }, 410);
    const confirmed = await env.DB.prepare(`UPDATE email_verifications SET verified_at=CURRENT_TIMESTAMP,token_hash=NULL
      WHERE user_id=? AND verified_at IS NULL AND datetime(expires_at)>datetime('now')`)
      .bind(verification.user_id).run();
    if (!confirmed.meta.changes) return json({ error: "Ce lien de confirmation est expiré ou a déjà été utilisé. Demandez un nouveau lien." }, 410);
    return json({ verified: true, message: "Adresse e-mail confirmée. Votre compte est activé; vous pouvez vous connecter." });
  }

  const email = String(data.email || "").trim().toLowerCase();
  if (action === 'resend-verification') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Saisissez une adresse e-mail valide." }, 422);
    const pending = await env.DB.prepare(`SELECT u.id,u.first_name,u.last_name,u.email FROM users u
      JOIN email_verifications v ON v.user_id=u.id WHERE u.email=? AND v.verified_at IS NULL`)
      .bind(email).first<Pick<UserRow, 'id'|'first_name'|'last_name'|'email'>>();
    if (pending) {
      const sent = await sendVerificationEmail(request, env, pending);
      if (!sent) return json({ error: "L’envoi a échoué. Vérifiez la configuration de l’expéditeur Brevo puis réessayez." }, 502);
    }
    return json({ sent: true, message: "Si cette adresse correspond à un compte en attente, un nouveau lien de confirmation vient d’être envoyé." });
  }

  const password = String(data.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < (action === "signup" ? 8 : 1) || password.length > 200) return json({ error: "Vérifiez l’adresse e-mail et le mot de passe." }, 422);
  let user: UserRow | null;
  if (action === "signup") {
    const firstName = String(data.firstName || "").trim().slice(0, 100);
    const lastName = String(data.lastName || "").trim().slice(0, 100);
    if (!firstName || !lastName || data.acceptTerms !== true) return json({ error: "Le prénom, le nom et l’acceptation des conditions sont obligatoires." }, 422);
    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const inserted = await env.DB.prepare("INSERT INTO users(first_name,last_name,email,password_hash,role) VALUES(?,?,?,?,'user')")
        .bind(firstName, lastName, email, passwordHash).run();
      const id = Number(inserted.meta.last_row_id);
      user = { id, first_name: firstName, last_name: lastName, email, password_hash: passwordHash, role: "user" };
    } catch (error) {
      if (String(error).toLowerCase().includes("unique")) return json({ error: "Cette adresse e-mail est déjà utilisée." }, 409);
      throw error;
    }
    const sent = await sendVerificationEmail(request, env, user);
    if (!sent) return json({ error: "Votre compte est créé mais reste en attente de confirmation. L’e-mail n’a pas pu être envoyé; réessayez avec le bouton de renvoi.", message: "L’envoi a échoué. Vérifiez la configuration Brevo puis utilisez le bouton pour renvoyer le lien.", verificationRequired: true, email }, 502);
    return json({ verificationRequired: true, email, message: "Un lien de confirmation vient d’être envoyé à votre adresse e-mail." }, 201);
  } else {
    user = await env.DB.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.password_hash,u.role,
      COALESCE(s.status,'active') AS account_status FROM users u LEFT JOIN user_account_status s ON s.user_id=u.id WHERE u.email=?`).bind(email).first<UserRow>();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return json({ error: "E-mail ou mot de passe incorrect." }, 401);
    if (user.account_status !== 'active') return json({ error: "Ce compte est désactivé. Contactez l’administrateur." }, 403);
    const verification = await env.DB.prepare("SELECT verified_at FROM email_verifications WHERE user_id=?").bind(user.id).first<{ verified_at: string | null }>();
    if (verification && !verification.verified_at) return json({ error: "Confirmez votre adresse e-mail avant de vous connecter. Vous pouvez renvoyer le lien depuis la page d’inscription.", verificationRequired: true }, 403);
  }

  const token = newToken();
  await env.DB.prepare("INSERT INTO api_tokens(user_id,token_hash,expires_at) VALUES(?,?,datetime('now','+30 days'))")
    .bind(user.id, await digest(token)).run();
  return json({ id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, token });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const incoming = new URL(request.url);
    if (incoming.pathname.startsWith("/api/")) {
      if (env.API_ORIGIN) {
        const base = new URL(env.API_ORIGIN.endsWith("/") ? env.API_ORIGIN : `${env.API_ORIGIN}/`);
        const upstream = new URL(incoming.pathname.slice("/api/".length), base);
        upstream.search = incoming.search;
        return fetch(new Request(upstream, request));
      }
      if (incoming.pathname === "/api/auth.php") {
        try { return await authApi(request, env, incoming); }
        catch { return json({ error: "Le service de comptes est momentanément indisponible. Réessayez." }, 503); }
      }
      return routeApi(request, env, incoming.pathname);
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: { cron: string; scheduledTime: number }, env: Env, _ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
    // Expired events become inactive automatically. Rows remain stored so
    // existing ticket, order, payment and audit records keep their references.
    await env.DB.prepare(`UPDATE events SET status='completed'
      WHERE status IN ('published','ongoing')
      AND datetime(COALESCE(NULLIF(end_date,''),event_date)) < datetime('now')`).run();
  },
};
