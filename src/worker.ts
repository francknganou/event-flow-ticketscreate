import bcrypt from "bcryptjs";

interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ success: boolean; results?: T[] }>;
  run<T = Record<string, unknown>>(): Promise<{ success: boolean; meta: { last_row_id?: number }; results?: T[] }>;
}
interface Database { prepare(query: string): Statement }
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: Database;
  API_ORIGIN?: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
}
type UserRow = { id: number; first_name: string; last_name: string; email: string; password_hash: string; role: string };

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");

async function currentUser(request: Request, env: Env): Promise<UserRow | null> {
  const raw = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!raw) return null;
  return env.DB.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.password_hash,u.role
    FROM api_tokens t JOIN users u ON u.id=t.user_id
    WHERE t.token_hash=? AND datetime(t.expires_at)>datetime('now')`)
    .bind(await digest(raw)).first<UserRow>();
}

function noStoreJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function eventsApi(request: Request, env: Env, user: UserRow | null): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET") return json({ error: "La gestion des événements n’est pas encore activée sur cette version D1." }, 501);
  const where = user?.role === "admin"
    ? "1=1"
    : user?.role === "organizer"
      ? "((e.status='published' AND e.visibility='public') OR e.organizer_id=?)"
      : "e.status='published' AND e.visibility='public'";
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
  if (action !== "login" && action !== "signup") return json({ error: "Action inconnue." }, 404);
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
  if ((counter?.hits || 0) > (action === "signup" ? 5 : 10)) return json({ error: "Trop de tentatives. Réessayez dans une minute." }, 429);

  const email = String(data.email || "").trim().toLowerCase();
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
  } else {
    user = await env.DB.prepare("SELECT id,first_name,last_name,email,password_hash,role FROM users WHERE email=?").bind(email).first<UserRow>();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return json({ error: "E-mail ou mot de passe incorrect." }, 401);
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
};
