export interface Env {
  ASSETS: Fetcher;
  BETTER_AUTH_URL?: string;
  VITE_AUTH_ENABLED?: string;
}

export interface FullEnv extends Env {}

export default {
  async fetch(request: Request, env: FullEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" || url.pathname === "/healthz") {
      return Response.json(
        {
          ok: true,
          service: "inspectamx-api",
          ts: new Date().toISOString(),
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "not_implemented",
          hint: "El patio (login, /chasis, Postgres) corre en origin Node, no en este Worker.",
        },
        { status: 501 },
      );
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<FullEnv>;
