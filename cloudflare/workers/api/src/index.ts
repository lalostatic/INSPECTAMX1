import { canReadCompany, folioScopeSql, readActor } from "./access";
import type { FullEnv } from "./types";
export type { Env, FullEnv } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const ARCHIVE_AFTER_DAYS = 180;

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function listHistory(env: FullEnv, request: Request): Promise<Response> {
  const actor = readActor(request);
  if (!actor) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "d1_not_bound" }, 503);

  const url = new URL(request.url);
  const companyFilter = Number.parseInt(url.searchParams.get("company_id") ?? "", 10);
  if (Number.isFinite(companyFilter) && !canReadCompany(actor, companyFilter)) {
    return json({ error: "forbidden" }, 403);
  }

  const scope = folioScopeSql(actor);
  const extra =
    Number.isFinite(companyFilter) && actor.platformRole === "developer"
      ? { sql: " AND f.company_id = ?", params: [companyFilter] }
      : { sql: "", params: [] };

  const sql = `
    SELECT f.id, f.company_id, f.branch_id, f.folio_code, f.unit_no, f.unit_kind,
           f.status, f.inspected_at,
           p.id AS photo_id, p.r2_key, p.thumb_r2_key, p.storage_tier, p.created_at AS photo_at
    FROM folios f
    LEFT JOIN folio_photos p ON p.folio_id = f.id AND p.company_id = f.company_id
    WHERE ${scope.sql}${extra.sql}
    ORDER BY f.inspected_at DESC
    LIMIT 200
  `;
  const rs = await env.DB.prepare(sql)
    .bind(...scope.params, ...extra.params)
    .all();
  return json({ ok: true, actor: { role: actor.role, platformRole: actor.platformRole }, rows: rs.results ?? [] });
}

async function archiveHotPhotos(env: FullEnv): Promise<{ moved: number }> {
  if (!env.DB) return { moved: 0 };
  const cutoff = new Date(Date.now() - ARCHIVE_AFTER_DAYS * DAY_MS).toISOString();
  const hot = await env.DB.prepare(
    `SELECT id, company_id, r2_key FROM folio_photos
     WHERE storage_tier = 'hot' AND created_at <= ? LIMIT 100`,
  )
    .bind(cutoff)
    .all();

  let moved = 0;
  for (const row of hot.results ?? []) {
    const rec = row as { id: number; company_id: number; r2_key: string };
    if (env.PHOTOS) {
      const obj = await env.PHOTOS.get(rec.r2_key);
      if (obj) {
        const histKey = rec.r2_key.startsWith("hist/") ? rec.r2_key : `hist/${rec.r2_key}`;
        await env.PHOTOS.put(histKey, obj.body, { httpMetadata: obj.httpMetadata });
      }
    }
    await env.DB.prepare(
      `UPDATE folio_photos SET storage_tier = 'historical', archived_at = ? WHERE id = ? AND company_id = ?`,
    )
      .bind(new Date().toISOString(), rec.id, rec.company_id)
      .run();
    moved += 1;
  }
  return { moved };
}

export default {
  async fetch(request: Request, env: FullEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" || url.pathname === "/healthz") {
      return json({
        ok: true,
        service: "inspectamx-api",
        d1: Boolean(env.DB),
        r2: Boolean(env.PHOTOS),
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/folios/history" && request.method === "GET") {
      return listHistory(env, request);
    }

    if (url.pathname === "/api/photos/archive" && request.method === "POST") {
      const actor = readActor(request);
      if (!actor || actor.platformRole !== "developer") {
        return json({ error: "forbidden" }, 403);
      }
      return json(await archiveHotPhotos(env));
    }

    if (url.pathname.startsWith("/api/")) {
      return json(
        {
          error: "not_implemented",
          hint: "Patio login//chasis: origin Node. Este Worker: health, history D1, archivo R2.",
        },
        501,
      );
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_event: ScheduledEvent, env: FullEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(archiveHotPhotos(env).then(() => undefined));
  },
} satisfies ExportedHandler<FullEnv>;
