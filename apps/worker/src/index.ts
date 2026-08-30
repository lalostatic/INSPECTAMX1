import type { Env } from "./types";

/** FullEnv extiende Env por si más adelante se añaden bindings (R2, Hyperdrive). */
export interface FullEnv extends Env {}

export default {
  async fetch(request: Request, env: FullEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/healthz" || url.pathname === "/api/healthz") {
      return Response.json(
        { ok: true, service: "inspectamx-assets", ts: new Date().toISOString() },
        { headers: { "cache-control": "no-store" } },
      );
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<FullEnv>;
