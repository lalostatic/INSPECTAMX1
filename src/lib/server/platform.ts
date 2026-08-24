/**
 * INSPECTAMX — panel superadmin (/super).
 * Solo desarrollo@inspectamx.com (y alias desarrolo@inspectamx.com).
 * MODIFICAR: métricas del dashboard y acciones de empresa en este archivo.
 */
import { hashPassword } from "better-auth/crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addMonths } from "@/lib/billing";
import { ALL_ROLES, MODULES, asRole, type Role } from "@/lib/catalog";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, dbSource } from "@/lib/db";
import { isDeveloperEmail } from "@/lib/developer";
import { isCompanyDomain, parseEmail, slugFromDomain } from "@/lib/email-domain";
import { createCredentialUser } from "@/lib/server/accounts";
import { stampNewOrgBilling } from "@/lib/server/billing";
import { ensureOrgTenant, tenantTables } from "@/lib/server/tenant-schema";
import { schemaNameFromOrgId } from "@/lib/tenant-name";
import { inviteCode, slugify, todayISO } from "@/lib/utils";

async function requireDeveloper(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId} limit 1`;
  if (!isDeveloperEmail(rows[0]?.email)) throw new Error("Solo el superadmin de INSPECTAMX");
  return rows[0].email;
}

export async function logPlatform(kind: string, message: string, opts?: { orgId?: string; email?: string; detail?: string }) {
  const sql = await getSql();
  await sql.query(
    `insert into platform_logs (id, kind, org_id, user_email, message, detail) values ($1,$2,$3,$4,$5,$6)`,
    [crypto.randomUUID(), kind, opts?.orgId ?? null, opts?.email ?? "", message, opts?.detail ?? ""],
  );
}

export type SuperDashboard = {
  companies: number;
  active: number;
  suspended: number;
  trial: number;
  users: number;
  usersWithSession: number;
  inspections: number;
  inspectionsToday: number;
  inspectionsMonth: number;
  photos: number;
  storageBytes: number;
  dbOk: boolean;
  uptimeSec: number;
  memoryMb: number;
  recentCompanies: { id: string; name: string; createdAt: string; status: string }[];
  recentLogs: { id: string; at: string; kind: string; message: string }[];
  liveFolios: { id: string; orgName: string; containerNo: string; inspectorName: string; inspectedAt: string }[];
  errorsOpen: number;
  ticketsOpen: number;
  usersActive: number;
  companyUsage: { id: string; name: string; status: string; inspections: number; photos: number; storageBytes: number; members: number }[];
};

async function countTenant(sql: Awaited<ReturnType<typeof getSql>>, tableSql: string) {
  try {
    const [r] = await sql.query<{ c: number }>(`select count(*)::int as c from ${tableSql}`);
    return r?.c ?? 0;
  } catch {
    return 0;
  }
}

export const getSuperDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SuperDashboard> => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const [co] = await sql<{ c: number }>`select count(*)::int as c from organizations`;
    const [active] = await sql<{ c: number }>`select count(*)::int as c from organizations where status = 'activa'`;
    const [susp] = await sql<{ c: number }>`select count(*)::int as c from organizations where status in ('suspendida','bloqueada','vencida')`;
    const [trial] = await sql<{ c: number }>`select count(*)::int as c from organizations where status = 'prueba'`;
    const [users] = await sql<{ c: number }>`select count(*)::int as c from "user"`;
    const [sess] = await sql<{ c: number }>`select count(distinct "userId")::int as c from "session" where "expiresAt" > now()`;
    const [activeUsers] = await sql<{ c: number }>`
      select count(*)::int as c from org_members where coalesce(blocked, false) = false
    `;
    const orgs = await sql<{ id: string; name: string; db_schema: string | null; status: string }>`
      select id, name, db_schema, coalesce(status,'activa') as status from organizations
    `;
    let inspections = 0;
    let inspectionsToday = 0;
    let inspectionsMonth = 0;
    let photos = 0;
    let storageBytes = 0;
    const liveFolios: SuperDashboard["liveFolios"] = [];
    const companyUsage: SuperDashboard["companyUsage"] = [];
    for (const o of orgs) {
      const schema = o.db_schema || schemaNameFromOrgId(o.id);
      const T = tenantTables(schema);
      const insp = await countTenant(sql, T.inspections);
      const ph = await countTenant(sql, T.photos);
      let bytes = 0;
      inspections += insp;
      inspectionsToday += await countTenant(sql, `${T.inspections} where inspected_at >= date_trunc('day', now())`);
      inspectionsMonth += await countTenant(sql, `${T.inspections} where inspected_at >= date_trunc('month', now())`);
      photos += ph;
      try {
        const [sz] = await sql.query<{ b: number }>(`select coalesce(sum(length(data_url)),0)::int as b from ${T.photos}`);
        bytes = sz?.b ?? 0;
        storageBytes += bytes;
      } catch {
        /* patio aún sin fotos */
      }
      const [mem] = await sql<{ c: number }>`select count(*)::int as c from org_members where org_id = ${o.id}`;
      companyUsage.push({
        id: o.id,
        name: o.name,
        status: o.status,
        inspections: insp,
        photos: ph,
        storageBytes: bytes,
        members: mem?.c ?? 0,
      });
      try {
        const rows = await sql.query<{
          id: string;
          container_no: string;
          inspector_name: string;
          inspected_at: string;
        }>(`select id, container_no, inspector_name, inspected_at from ${T.inspections} order by inspected_at desc limit 8`);
        for (const r of rows) {
          liveFolios.push({
            id: r.id,
            orgName: o.name,
            containerNo: r.container_no,
            inspectorName: r.inspector_name,
            inspectedAt: r.inspected_at,
          });
        }
      } catch {
        /* */
      }
    }
    liveFolios.sort((a, b) => (a.inspectedAt < b.inspectedAt ? 1 : -1));
    const recentCompanies = await sql<{ id: string; name: string; created_at: string; status: string }>`
      select id, name, created_at, coalesce(status,'activa') as status
      from organizations order by created_at desc limit 8
    `;
    const recentLogs = await sql<{ id: string; at: string; kind: string; message: string }>`
      select id, at, kind, message from platform_logs order by at desc limit 12
    `;
    const [errOpen] = await sql<{ c: number }>`select count(*)::int as c from platform_errors where status in ('nuevo','investigacion')`;
    const [tkOpen] = await sql<{ c: number }>`select count(*)::int as c from support_tickets where status = 'abierto'`;
    let dbOk = true;
    try {
      await sql`select 1 as ok`;
    } catch {
      dbOk = false;
    }
    return {
      companies: co?.c ?? 0,
      active: active?.c ?? 0,
      suspended: susp?.c ?? 0,
      trial: trial?.c ?? 0,
      users: users?.c ?? 0,
      usersWithSession: sess?.c ?? 0,
      inspections,
      inspectionsToday,
      inspectionsMonth,
      photos,
      storageBytes,
      dbOk,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      recentCompanies: recentCompanies.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: String(r.created_at),
        status: r.status,
      })),
      recentLogs: recentLogs.map((r) => ({
        id: r.id,
        at: String(r.at),
        kind: r.kind,
        message: r.message,
      })),
      liveFolios: liveFolios.slice(0, 12),
      errorsOpen: errOpen?.c ?? 0,
      ticketsOpen: tkOpen?.c ?? 0,
      usersActive: activeUsers?.c ?? 0,
      companyUsage,
    };
  });

export type SuperCompany = {
  id: string;
  name: string;
  legalName: string;
  rfc: string;
  domain: string;
  city: string;
  depot: string;
  phone: string;
  contactName: string;
  contactEmail: string;
  address: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxInspectors: number;
  storageMb: number;
  members: number;
  authorized: boolean;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  inspections: number;
  photos: number;
  storageBytes: number;
};

export const listSuperCompanies = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SuperCompany[]> => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      legal_name: string;
      rfc: string;
      email_domain: string | null;
      city: string;
      depot: string;
      phone: string;
      contact_name: string;
      contact_email: string;
      address: string;
      plan: string;
      status: string;
      max_users: number;
      max_inspectors: number;
      storage_mb: number;
      authorized: boolean;
      created_at: string;
      period_start: string | null;
      period_end: string | null;
      db_schema: string | null;
      members: number;
    }>`
      select o.id, o.name, o.depot, o.city, o.email_domain, o.authorized, o.created_at, o.db_schema,
             o.period_start, o.period_end,
             coalesce(o.legal_name,'') as legal_name,
             coalesce(o.rfc,'') as rfc,
             coalesce(o.phone,'') as phone,
             coalesce(o.contact_name,'') as contact_name,
             coalesce(o.contact_email,'') as contact_email,
             coalesce(o.address,'') as address,
             coalesce(o.plan,'mensual') as plan,
             coalesce(o.status,'activa') as status,
             coalesce(o.max_users,25) as max_users,
             coalesce(o.max_inspectors,10) as max_inspectors,
             coalesce(o.storage_mb,2048) as storage_mb,
             (select count(*)::int from org_members m where m.org_id = o.id) as members
      from organizations o
      order by o.created_at desc
    `;
    const out: SuperCompany[] = [];
    for (const r of rows) {
      const schema = r.db_schema || schemaNameFromOrgId(r.id);
      const T = tenantTables(schema);
      const inspections = await countTenant(sql, T.inspections);
      const photos = await countTenant(sql, T.photos);
      let storageBytes = 0;
      try {
        const [sz] = await sql.query<{ b: number }>(`select coalesce(sum(length(data_url)),0)::int as b from ${T.photos}`);
        storageBytes = sz?.b ?? 0;
      } catch {
        /* */
      }
      out.push({
        id: r.id,
        name: r.name,
        legalName: r.legal_name,
        rfc: r.rfc,
        domain: r.email_domain ?? "",
        city: r.city,
        depot: r.depot,
        phone: r.phone,
        contactName: r.contact_name,
        contactEmail: r.contact_email,
        address: r.address,
        plan: r.plan,
        status: r.status,
        maxUsers: Number(r.max_users) || 25,
        maxInspectors: Number(r.max_inspectors) || 10,
        storageMb: Number(r.storage_mb) || 2048,
        members: Number(r.members) || 0,
        authorized: Boolean(r.authorized),
        createdAt: String(r.created_at),
        periodStart: r.period_start ? String(r.period_start).slice(0, 10) : "",
        periodEnd: r.period_end ? String(r.period_end).slice(0, 10) : "",
        inspections,
        photos,
        storageBytes,
      });
    }
    return out;
  });

export const setCompanyStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({
      orgId: z.string(),
      status: z.enum(["activa", "prueba", "por_vencer", "vencida", "suspendida", "bloqueada"]),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const email = await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`update organizations set status = ${data.status} where id = ${data.orgId}`;
    const authorized = data.status === "activa" || data.status === "prueba" || data.status === "por_vencer";
    await sql`update organizations set authorized = ${authorized} where id = ${data.orgId}`;
    await logPlatform("config", `Empresa ${data.status}`, { orgId: data.orgId, email });
    return { ok: true };
  });

export const updateCompanyLimits = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({
      orgId: z.string(),
      plan: z.string().max(40),
      maxUsers: z.number().int().min(1).max(500),
      maxInspectors: z.number().int().min(1).max(200),
      storageMb: z.number().int().min(100).max(100000),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`
      update organizations
      set plan = ${data.plan}, max_users = ${data.maxUsers},
          max_inspectors = ${data.maxInspectors}, storage_mb = ${data.storageMb}
      where id = ${data.orgId}
    `;
    return { ok: true };
  });

export const impersonateCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ orgId: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    const email = await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`
      insert into impersonation (developer_user_id, org_id, started_at)
      values (${context.userId}, ${data.orgId}, now())
      on conflict (developer_user_id) do update set org_id = excluded.org_id, started_at = now()
    `;
    await logPlatform("permissions", "Impersonar empresa", { orgId: data.orgId, email });
    return { ok: true };
  });

export const stopImpersonation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from impersonation where developer_user_id = ${context.userId}`;
    return { ok: true };
  });

export type SuperUser = {
  userId: string;
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  role: Role;
  lastSeen: string | null;
  blocked: boolean;
};

export const listSuperUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SuperUser[]> => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      email: string;
      name: string;
      org_id: string;
      org_name: string;
      role: string;
      last_seen: string | null;
      blocked: boolean;
    }>`
      select m.user_id, coalesce(u.email,'') as email, coalesce(u.name, m.display_name) as name,
             m.org_id, o.name as org_name, m.role, coalesce(m.blocked, false) as blocked,
             (select max(s."updatedAt") from "session" s where s."userId" = m.user_id) as last_seen
      from org_members m
      join organizations o on o.id = m.org_id
      left join "user" u on u.id = m.user_id
      order by o.name, m.role
    `;
    return rows.map((r) => ({
      userId: r.user_id,
      email: r.email,
      name: r.name,
      orgId: r.org_id,
      orgName: r.org_name,
      role: asRole(r.role),
      lastSeen: r.last_seen ? String(r.last_seen) : null,
      blocked: Boolean(r.blocked),
    }));
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ userId: z.string(), password: z.string().min(8).max(80) }).parse(input))
  .handler(async ({ context, data }) => {
    const email = await requireDeveloper(context.userId);
    const hashed = await hashPassword(data.password);
    const sql = await getSql();
    await sql`
      update "account" set password = ${hashed}, "updatedAt" = ${new Date().toISOString()}
      where "userId" = ${data.userId} and "providerId" = ${"credential"}
    `;
    await logPlatform("permissions", "Restablecer contraseña", { email, detail: data.userId });
    return { ok: true };
  });

export const forceLogout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ userId: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`delete from "session" where "userId" = ${data.userId}`;
    return { ok: true };
  });

export const listPlatformLogs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      at: string;
      kind: string;
      user_email: string;
      message: string;
    }>`select id, at, kind, user_email, message from platform_logs order by at desc limit 80`;
    return rows.map((r) => ({
      id: r.id,
      at: String(r.at),
      kind: r.kind,
      email: r.user_email,
      message: r.message,
    }));
  });

export const listPlatformErrors = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    return sql<{ id: string; at: string; status: string; source: string; message: string }>`
      select id, at, status, source, message from platform_errors order by at desc limit 50
    `.then((rows) =>
      rows.map((r) => ({
        id: r.id,
        at: String(r.at),
        status: r.status,
        source: r.source,
        message: r.message,
      })),
    );
  });

export const setErrorStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string(), status: z.enum(["nuevo", "investigacion", "resuelto", "ignorado"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`update platform_errors set status = ${data.status} where id = ${data.id}`;
    return { ok: true };
  });

export const publishNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ title: z.string().min(2).max(120), body: z.string().min(2).max(2000), orgId: z.string().optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`
      insert into platform_notices (id, scope, org_id, title, body, active)
      values (${crypto.randomUUID()}, ${data.orgId ? "org" : "global"}, ${data.orgId ?? null}, ${data.title}, ${data.body}, ${true})
    `;
    return { ok: true };
  });

export const listNotices = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: string; title: string; body: string; scope: string; created_at: string }>`
      select id, title, body, scope, created_at from platform_notices order by created_at desc limit 30
    `;
    return rows.map((r) => ({ id: r.id, title: r.title, body: r.body, scope: r.scope, createdAt: String(r.created_at) }));
  });

export const listTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      org_id: string;
      title: string;
      body: string;
      response: string;
      status: string;
      priority: string;
      created_at: string;
    }>`select id, org_id, title, body, response, status, priority, created_at from support_tickets order by created_at desc limit 40`;
    return rows.map((r) => ({
      id: r.id,
      orgId: r.org_id,
      title: r.title,
      body: r.body,
      response: r.response,
      status: r.status,
      priority: r.priority,
      createdAt: String(r.created_at),
    }));
  });

export const getPlatformHealth = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const mem = process.memoryUsage();
    return {
      db: dbSource,
      uptimeSec: Math.round(process.uptime()),
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapMb: Math.round(mem.heapUsed / 1024 / 1024),
      node: process.version,
      version: "1.1.0",
    };
  });

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: string; name: string; prefix: string; revoked: boolean; created_at: string }>`
      select id, name, prefix, revoked, created_at from api_keys order by created_at desc
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      prefix: r.prefix,
      revoked: Boolean(r.revoked),
      createdAt: String(r.created_at),
    }));
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ name: z.string().min(2).max(40) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const id = crypto.randomUUID();
    const prefix = `imx_${id.slice(0, 8)}`;
    await sql`insert into api_keys (id, name, prefix) values (${id}, ${data.name}, ${prefix})`;
    return { id, prefix };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`update api_keys set revoked = ${true} where id = ${data.id}`;
    return { ok: true };
  });

const companyIn = z.object({
  name: z.string().min(2).max(80),
  legalName: z.string().max(120).default(""),
  rfc: z.string().max(20).default(""),
  domain: z.string().min(4).max(80),
  depot: z.string().max(80).default(""),
  city: z.string().max(80).default(""),
  phone: z.string().max(40).default(""),
  address: z.string().max(200).default(""),
  contactName: z.string().max(80).default(""),
  contactEmail: z.string().max(120).default(""),
  plan: z.string().max(40).default("mensual"),
  status: z.enum(["activa", "prueba", "por_vencer", "vencida", "suspendida", "bloqueada"]).default("prueba"),
  maxUsers: z.number().int().min(1).max(500).default(25),
  maxInspectors: z.number().int().min(1).max(200).default(10),
  storageMb: z.number().int().min(100).max(100000).default(2048),
  adminName: z.string().min(2).max(80),
  adminEmail: z.string().email().max(120),
  adminPassword: z.string().min(8).max(80),
});

export const createCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => companyIn.parse(input))
  .handler(async ({ context, data }) => {
    const devEmail = await requireDeveloper(context.userId);
    const domain = data.domain.trim().toLowerCase().replace(/^@/, "");
    if (!isCompanyDomain(domain)) throw new Error("Use el dominio de la empresa, no Gmail ni Outlook");
    const adminParsed = parseEmail(data.adminEmail);
    if (!adminParsed || adminParsed.domain !== domain) {
      throw new Error(`El administrador debe ser un correo @${domain}`);
    }
    const sql = await getSql();
    const exists = await sql<{ id: string }>`select id from organizations where email_domain = ${domain} limit 1`;
    if (exists[0]) throw new Error("Ese dominio ya tiene patio");
    const { id: adminId } = await createCredentialUser({
      name: data.adminName,
      email: data.adminEmail.trim().toLowerCase(),
      password: data.adminPassword,
    });
    const takenUser = await sql<{ org_id: string }>`select org_id from org_members where user_id = ${adminId} limit 1`;
    if (takenUser[0]) throw new Error("Ese correo de administrador ya pertenece a otro patio");
    const id = crypto.randomUUID();
    const dbSchema = schemaNameFromOrgId(id);
    let slug = slugFromDomain(domain) || slugify(data.name) || "patio";
    const taken = await sql<{ c: number }>`select count(*)::int as c from organizations where slug = ${slug}`;
    if ((taken[0]?.c ?? 0) > 0) slug = `${slug}-${id.slice(0, 4)}`;
    const code = inviteCode();
    const now = new Date().toISOString();
    const authorized = data.status === "activa" || data.status === "prueba" || data.status === "por_vencer";
    await sql`
      insert into organizations (
        id, slug, name, depot, city, invite_code, email_domain, created_by,
        authorized, authorized_at, authorized_by, db_schema,
        legal_name, rfc, phone, address, contact_name, contact_email, plan, status,
        max_users, max_inspectors, storage_mb
      ) values (
        ${id}, ${slug}, ${data.name}, ${data.depot}, ${data.city}, ${code}, ${domain}, ${context.userId},
        ${authorized}, ${now}, ${devEmail}, ${dbSchema},
        ${data.legalName}, ${data.rfc}, ${data.phone}, ${data.address}, ${data.contactName},
        ${data.contactEmail || data.adminEmail}, ${data.plan}, ${data.status},
        ${data.maxUsers}, ${data.maxInspectors}, ${data.storageMb}
      )
    `;
    for (const mod of MODULES) {
      await sql`
        insert into org_modules (org_id, module_key, enabled)
        values (${id}, ${mod.key}, ${true})
        on conflict (org_id, module_key) do nothing
      `;
    }
    await stampNewOrgBilling(id);
    await sql`
      insert into org_members (org_id, user_id, display_name, role)
      values (${id}, ${adminId}, ${data.adminName}, ${"admin"})
    `;
    await ensureOrgTenant(id);
    await logPlatform("config", `Empresa creada ${data.name}`, { orgId: id, email: devEmail });
    return { ok: true, orgId: id };
  });

export const updateCompanyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({
      orgId: z.string(),
      name: z.string().min(2).max(80),
      legalName: z.string().max(120),
      rfc: z.string().max(20),
      phone: z.string().max(40),
      address: z.string().max(200),
      contactName: z.string().max(80),
      contactEmail: z.string().max(120),
      depot: z.string().max(80),
      city: z.string().max(80),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`
      update organizations
      set name = ${data.name}, legal_name = ${data.legalName}, rfc = ${data.rfc},
          phone = ${data.phone}, address = ${data.address}, contact_name = ${data.contactName},
          contact_email = ${data.contactEmail}, depot = ${data.depot}, city = ${data.city}
      where id = ${data.orgId}
    `;
    return { ok: true };
  });

export const renewCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ orgId: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    const email = await requireDeveloper(context.userId);
    const sql = await getSql();
    const end = addMonths(todayISO(), 1);
    await sql`
      update organizations
      set period_end = ${end}, status = ${"activa"}, authorized = ${true}
      where id = ${data.orgId}
    `;
    await logPlatform("config", "Renovación de plan", { orgId: data.orgId, email });
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ userId: z.string(), orgId: z.string(), role: z.enum(ALL_ROLES as [Role, ...Role[]]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`update org_members set role = ${data.role} where user_id = ${data.userId} and org_id = ${data.orgId}`;
    return { ok: true };
  });

export const setMemberBlocked = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ userId: z.string(), orgId: z.string(), blocked: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`update org_members set blocked = ${data.blocked} where user_id = ${data.userId} and org_id = ${data.orgId}`;
    if (data.blocked) {
      await sql`delete from "session" where "userId" = ${data.userId}`;
    }
    return { ok: true };
  });

export const replyTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({
      id: z.string(),
      response: z.string().min(2).max(2000),
      status: z.enum(["abierto", "en_proceso", "resuelto"]).default("en_proceso"),
      priority: z.enum(["baja", "media", "alta"]).optional(),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    if (data.priority) {
      await sql`
        update support_tickets set response = ${data.response}, status = ${data.status}, priority = ${data.priority}
        where id = ${data.id}
      `;
    } else {
      await sql`
        update support_tickets set response = ${data.response}, status = ${data.status} where id = ${data.id}
      `;
    }
    return { ok: true };
  });

export const listPlatformSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    const rows = await sql<{ key: string; value: string }>`select key, value from platform_settings`;
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
  });

export const savePlatformSetting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ key: z.string().min(1).max(60), value: z.string().max(400) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireDeveloper(context.userId);
    const sql = await getSql();
    await sql`
      insert into platform_settings (key, value) values (${data.key}, ${data.value})
      on conflict (key) do update set value = excluded.value
    `;
    return { ok: true };
  });
