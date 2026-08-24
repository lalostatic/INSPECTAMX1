/**
 * INSPECTAMX — SMTP por empresa.
 *
 * Cada patio guarda su propio host/usuario/contraseña en t_<uuid>.smtp_settings.
 * Nunca se lee el SMTP de otro patio. No hay un correo “global” de INSPECTAMX.
 *
 * MODIFICAR columnas en migrations/tenant/0002_ops_ext.sql
 * y los campos de este archivo.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { canManageConfig } from "@/lib/roles";
import { requireMembership } from "@/lib/server/tenant";
import { tenantTables } from "@/lib/server/tenant-schema";

export type SmtpSettings = {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
};

const smtpIn = z.object({
  host: z.string().max(120).default(""),
  port: z.number().int().min(1).max(65535).default(587),
  username: z.string().max(120).default(""),
  password: z.string().max(200).default(""),
  fromEmail: z.string().max(120).default(""),
  fromName: z.string().max(80).default(""),
  secure: z.boolean().default(false),
});

export const getSmtpSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SmtpSettings> => {
    const m = await requireMembership(context.userId);
    if (!canManageConfig(m.role)) throw new Error("Solo el administrador configura el correo");
    const T = tenantTables(m.dbSchema);
    const sql = await getSql();
    const rows = await sql.query<{
      host: string;
      port: number;
      username: string;
      password: string;
      from_email: string;
      from_name: string;
      secure: boolean;
    }>(`select host, port, username, password, from_email, from_name, secure from ${T.smtp_settings} where id = 'default'`);
    const r = rows[0];
    return {
      host: r?.host ?? "",
      port: r?.port ?? 587,
      username: r?.username ?? "",
      password: r?.password ?? "",
      fromEmail: r?.from_email ?? "",
      fromName: r?.from_name ?? "",
      secure: Boolean(r?.secure),
    };
  });

export const saveSmtpSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => smtpIn.parse(input))
  .handler(async ({ context, data }) => {
    const m = await requireMembership(context.userId);
    if (!canManageConfig(m.role)) throw new Error("Solo el administrador configura el correo");
    const T = tenantTables(m.dbSchema);
    const sql = await getSql();
    await sql.query(
      `insert into ${T.smtp_settings} (id, host, port, username, password, from_email, from_name, secure, updated_at)
       values ('default', $1, $2, $3, $4, $5, $6, $7, now())
       on conflict (id) do update set
         host = excluded.host,
         port = excluded.port,
         username = excluded.username,
         password = excluded.password,
         from_email = excluded.from_email,
         from_name = excluded.from_name,
         secure = excluded.secure,
         updated_at = now()`,
      [data.host.trim(), data.port, data.username.trim(), data.password, data.fromEmail.trim(), data.fromName.trim(), data.secure],
    );
    return { ok: true };
  });
