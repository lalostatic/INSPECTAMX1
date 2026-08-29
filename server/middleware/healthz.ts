/**
 * Liveness probe. No toca Postgres a propósito: si el isolate arranca,
 * /healthz debe responder. La readiness real es un query en /api/auth/ok
 * o el primer createServerFn autenticado.
 */
interface HealthEvent {
  url: URL;
  req: { method: string };
}

export default async function healthzMiddleware(
  event: HealthEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const path = event.url.pathname;
  if (path !== "/healthz" && path !== "/api/healthz") return next();
  if ((event.req.method ?? "GET").toUpperCase() !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response(
    JSON.stringify({
      ok: true,
      service: "inspectamx",
      ts: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}
