/**
 * INSPECTAMX — respaldos.
 *
 * 6. Cómo hacer respaldos: el administrador entra a /configuracion y descarga
 * un JSON con la operación de SU patio (inspecciones, fotos, M&R, almacén).
 * 10. Antes de actualizar el sistema, descargue este respaldo.
 *
 * Las fotos van dentro del JSON (data URL). El archivo no se mezcla con otro patio.
 *
 * MODIFICAR: agregar tablas nuevas al objeto `payload` de abajo.
 */
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { canManageConfig } from "@/lib/roles";
import { requireMembership } from "@/lib/server/tenant";
import { tenantTables } from "@/lib/server/tenant-schema";

export const exportBackup = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const m = await requireMembership(context.userId);
    if (!canManageConfig(m.role)) throw new Error("Solo el administrador descarga respaldos");
    const T = tenantTables(m.dbSchema);
    const sql = await getSql();
    const inspections = await sql.query(`select * from ${T.inspections}`);
    const findings = await sql.query(`select * from ${T.findings}`);
    const photos = await sql.query(`select * from ${T.photos}`);
    const work_reports = await sql.query(`select * from ${T.work_reports}`);
    const work_report_lines = await sql.query(`select * from ${T.work_report_lines}`);
    const warehouse_entries = await sql.query(`select * from ${T.warehouse_entries}`);
    const warehouse_materials = await sql.query(`select * from ${T.warehouse_materials}`);
    const warehouse_units = await sql.query(`select * from ${T.warehouse_units}`);

    await sql.query(
      `insert into ${T.backup_events} (id, created_by, kind, note) values ($1, $2, 'export', $3)`,
      [crypto.randomUUID(), context.userId, `folios=${inspections.length}`],
    );

    const payload = {
      app: "INSPECTAMX",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      orgId: m.orgId,
      orgName: m.orgName,
      schema: m.dbSchema,
      inspections,
      findings,
      photos,
      work_reports,
      work_report_lines,
      warehouse_entries,
      warehouse_materials,
      warehouse_units,
    };
    return { json: JSON.stringify(payload) };
  });
