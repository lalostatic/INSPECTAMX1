/**
 * INSPECTAMX — reportes para administradores.
 *
 * 7. Cómo generar reportes: el administrador (u oficina) abre /reportes.
 * Los totales salen solo del esquema de SU empresa.
 *
 * MODIFICAR las consultas SQL de este archivo para agregar columnas al CSV.
 */
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { canSeeReports } from "@/lib/roles";
import { requireMembership } from "@/lib/server/tenant";
import { tenantTables } from "@/lib/server/tenant-schema";

export type ReportSummary = {
  inspections: number;
  archived: number;
  photos: number;
  workReports: number;
  warehouse: number;
  byInspector: { name: string; count: number }[];
};

export const getReportSummary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ReportSummary> => {
    const m = await requireMembership(context.userId);
    if (!canSeeReports(m.role)) throw new Error("Su perfil no ve reportes");
    const T = tenantTables(m.dbSchema);
    const sql = await getSql();
    const [insp] = await sql.query<{ c: number }>(
      `select count(*)::int as c from ${T.inspections} where archived_at is null`,
    );
    const [arch] = await sql.query<{ c: number }>(
      `select count(*)::int as c from ${T.inspections} where archived_at is not null`,
    );
    const [photos] = await sql.query<{ c: number }>(`select count(*)::int as c from ${T.photos}`);
    const [wr] = await sql.query<{ c: number }>(`select count(*)::int as c from ${T.work_reports}`);
    const [wh] = await sql.query<{ c: number }>(`select count(*)::int as c from ${T.warehouse_entries}`);
    const by = await sql.query<{ name: string; count: number }>(
      `select inspector_name as name, count(*)::int as count
       from ${T.inspections} where archived_at is null
       group by inspector_name order by count desc limit 20`,
    );
    return {
      inspections: insp?.c ?? 0,
      archived: arch?.c ?? 0,
      photos: photos?.c ?? 0,
      workReports: wr?.c ?? 0,
      warehouse: wh?.c ?? 0,
      byInspector: by,
    };
  });

export const exportInspectionsCsv = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ csv: string }> => {
    const m = await requireMembership(context.userId);
    if (!canSeeReports(m.role)) throw new Error("Su perfil no exporta reportes");
    const T = tenantTables(m.dbSchema);
    const sql = await getSql();
    const rows = await sql.query<{
      container_no: string;
      naviera: string;
      inspector_name: string;
      status: string;
      inspected_at: string;
      damage: string | null;
    }>(
      `select i.container_no, i.naviera, i.inspector_name, i.status, i.inspected_at,
              (select f.damage from ${T.findings} f where f.inspection_id = i.id order by f.sort_order limit 1) as damage
       from ${T.inspections} i
       where i.archived_at is null
       order by i.inspected_at desc
       limit 2000`,
    );
    const header = "unidad,naviera,inspector,estado,fecha,dano";
    const lines = rows.map((r) =>
      [r.container_no, r.naviera, r.inspector_name, r.status, r.inspected_at, r.damage ?? ""]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    );
    return { csv: [header, ...lines].join("\n") };
  });
