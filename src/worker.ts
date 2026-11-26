import bcrypt from "bcryptjs";

interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<{ success: boolean; meta: { last_row_id?: number }; results?: T[] }>;
}
interface Database { prepare(query: string): Statement }
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: Database;
  API_ORIGIN?: string;
}
type UserRow = { id: number; first_name: string; last_name: string; email: string; password_hash: string; role: string };

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");

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
      return json({ error: "Le service EventFlow correspondant n’est pas encore configuré." }, 503);
    }
    return env.ASSETS.fetch(request);
  },
};
