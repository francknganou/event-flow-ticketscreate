interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  API_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const incoming = new URL(request.url);

    if (incoming.pathname.startsWith("/api/")) {
      if (!env.API_ORIGIN) {
        return Response.json(
          { error: "L’API EventFlow n’est pas encore configurée sur ce domaine." },
          { status: 503 },
        );
      }

      const base = new URL(env.API_ORIGIN.endsWith("/") ? env.API_ORIGIN : `${env.API_ORIGIN}/`);
      const path = incoming.pathname.slice("/api/".length);
      const upstream = new URL(path, base);
      upstream.search = incoming.search;
      return fetch(new Request(upstream, request));
    }

    return env.ASSETS.fetch(request);
  },
};
