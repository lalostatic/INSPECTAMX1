import { DEMO_ORGS, DEMO_PASSWORD, demoEmail, type DemoOrg } from "@/lib/demo-accounts";
import { DEVELOPER_EMAIL, DEVELOPER_EMAILS } from "@/lib/developer";
import { addDays, addMonths } from "@/lib/billing";
import { MODULES, type Role } from "@/lib/catalog";
import { getSql } from "@/lib/db";
import { ensureUsersWithPassword } from "@/lib/server/accounts";
import { stampNewOrgBilling } from "@/lib/server/billing";
import { seedOrgIfEmpty } from "@/lib/server/seed";
import { seedEngine } from "@/lib/server/seed-engine";
import { ensureOrgTenant, schemaNameFromOrgId } from "@/lib/server/tenant-schema";
import { todayISO } from "@/lib/utils";

const globalRef = globalThis as typeof globalThis & {
  __inspectamxAuth_v4__?: Promise<void>;
  __inspectamxOps_v4__?: Promise<void>;
};

async function enableModules(orgId: string) {
  const sql = await getSql();
  const values = MODULES.map((_, i) => `($1, $${i + 2}, true)`).join(", ");
  await sql.query(
    `insert into org_modules (org_id, module_key, enabled) values ${values}
     on conflict (org_id, module_key) do nothing`,
    [orgId, ...MODULES.map((m) => m.key)],
  );
}

async function ensureDemoOrg(org: DemoOrg, adminUserId: string): Promise<string> {
  const sql = await getSql();
  const found = await sql<{ id: string }>`
    select id from organizations
    where email_domain = ${org.domain} or slug = ${org.slug}
    order by created_at
    limit 1
  `;
  if (found[0]) {
    await sql`
      update organizations
      set email_domain = ${org.domain},
          name = ${org.name},
          depot = ${org.depot},
          city = ${org.city},
          invite_code = ${org.inviteCode},
          authorized = ${true},
          authorized_by = coalesce(nullif(authorized_by, ''), ${"seed"}),
          db_schema = coalesce(nullif(db_schema, ''), ${schemaNameFromOrgId(found[0].id)}),
          status = ${org.status},
          plan = ${org.plan},
          legal_name = ${org.legalName},
          rfc = ${org.rfc},
          phone = ${org.phone},
          address = ${org.address},
          contact_email = ${"admin@" + org.domain},
          contact_name = ${org.accounts[0]?.name ?? "Admin"},
          max_users = ${org.maxUsers},
          max_inspectors = ${org.maxInspectors},
          storage_mb = ${org.storageMb}
      where id = ${found[0].id}
    `;
    await enableModules(found[0].id);
    return found[0].id;
  }

  const id = crypto.randomUUID();
  await sql`
    insert into organizations (
      id, slug, name, depot, city, invite_code, email_domain, created_by, authorized, authorized_by, db_schema
    )
    values (
      ${id}, ${org.slug}, ${org.name}, ${org.depot}, ${org.city},
      ${org.inviteCode}, ${org.domain}, ${adminUserId}, ${true}, ${"seed"}, ${schemaNameFromOrgId(id)}
    )
    on conflict (slug) do nothing
  `;
  const again = await sql<{ id: string }>`
    select id from organizations where slug = ${org.slug} or email_domain = ${org.domain} limit 1
  `;
  const orgId = again[0]?.id ?? id;
  await sql`
    update organizations
    set authorized = ${true},
        authorized_by = ${"seed"},
        db_schema = coalesce(nullif(db_schema, ''), ${schemaNameFromOrgId(orgId)})
    where id = ${orgId}
  `;
  await enableModules(orgId);
  return orgId;
}

async function applyDemoBilling(orgId: string, billing: "active" | "due") {
  const today = todayISO();
  const periodEnd = billing === "due" ? addDays(today, -1) : addMonths(today, 1);
  const sql = await getSql();
  const start = addMonths(periodEnd, -1);
  await sql`
    update organizations
    set period_start = ${start},
        period_end = ${periodEnd}
    where id = ${orgId}
  `;
  await stampNewOrgBilling(orgId);
}

async function ensureMember(orgId: string, userId: string, name: string, role: Role) {
  const sql = await getSql();
  await sql`
    insert into org_members (org_id, user_id, display_name, role)
    values (${orgId}, ${userId}, ${name}, ${role})
    on conflict (org_id, user_id) do update
      set display_name = excluded.display_name, role = excluded.role
  `;
}

async function seedPlatformSamples(orgIds: { id: string; name: string }[]) {
  const sql = await getSql();
  const [tk] = await sql<{ c: number }>`select count(*)::int as c from support_tickets`;
  if ((tk?.c ?? 0) === 0 && orgIds[0]) {
    await sql`
      insert into support_tickets (id, org_id, priority, status, title, body)
      values
        (${crypto.randomUUID()}, ${orgIds[0].id}, ${"alta"}, ${"abierto"},
         ${"Inspector no puede subir fotografías"},
         ${"Luis Mora reporta que la cámara del mapa no abre en el celular."}),
        (${crypto.randomUUID()}, ${orgIds[1]?.id ?? orgIds[0].id}, ${"media"}, ${"abierto"},
         ${"Renovación de plan mensual"},
         ${"Quieren pasar de prueba a mensual y ampliar inspectores."})
    `;
  }
  const [er] = await sql<{ c: number }>`select count(*)::int as c from platform_errors`;
  if ((er?.c ?? 0) === 0) {
    await sql`
      insert into platform_errors (id, status, source, message, org_id)
      values
        (${crypto.randomUUID()}, ${"nuevo"}, ${"fotos"}, ${"JPEG rechazado: archivo mayor a 8 MB"}, ${orgIds[0]?.id ?? null}),
        (${crypto.randomUUID()}, ${"investigacion"}, ${"smtp"}, ${"Fallo de envío SMTP en un patio de prueba"}, ${orgIds[2]?.id ?? null})
    `;
  }
  const [nt] = await sql<{ c: number }>`select count(*)::int as c from platform_notices`;
  if ((nt?.c ?? 0) === 0) {
    await sql`
      insert into platform_notices (id, scope, title, body, active)
      values (
        ${crypto.randomUUID()}, ${"global"},
        ${"Mantenimiento programado"},
        ${"Domingo 02:00 AM — ventana de 20 minutos. Los patios siguen operando en lectura."},
        ${true}
      )
    `;
  }
  await sql.query(
    `insert into platform_logs (id, kind, org_id, user_email, message) values ($1,$2,$3,$4,$5)`,
    [crypto.randomUUID(), "login", null, DEVELOPER_EMAIL, "Semilla de demostración lista"],
  );
}

async function demoAlreadySeeded(): Promise<boolean> {
  try {
    const sql = await getSql();
    const [row] = await sql<{ c: number }>`
      select count(*)::int as c from "user"
      where email = ${DEVELOPER_EMAIL}
         or email = ${"admin@cerlan.mx"}
         or email = ${"admin@contri.mx"}
         or email = ${"admin@istmo.mx"}
    `;
    return (row?.c ?? 0) >= 4;
  } catch {
    return false;
  }
}

function allDemoUsers(): { name: string; email: string }[] {
  const users: { name: string; email: string }[] = DEVELOPER_EMAILS.map((email) => ({
    name: "Desarrollador INSPECTAMX",
    email,
  }));
  for (const org of DEMO_ORGS) {
    for (const account of org.accounts) {
      users.push({ name: account.name, email: demoEmail(account.local, org.domain) });
    }
  }
  return users;
}

async function runAuthSeed() {
  const t0 = Date.now();
  if (await demoAlreadySeeded()) {
    console.info("[inspectamx] auth seed skip", Date.now() - t0, "ms");
    return;
  }
  const ids = await ensureUsersWithPassword(allDemoUsers(), DEMO_PASSWORD);
  const sql = await getSql();
  for (const org of DEMO_ORGS) {
    const adminEmail = demoEmail("admin", org.domain);
    const adminId = ids.get(adminEmail);
    if (!adminId) throw new Error(`No se pudo crear el administrador de ${org.name}`);
    const orgId = await ensureDemoOrg(org, adminId);
    await sql`
      update organizations
      set status = ${org.status},
          plan = ${org.plan},
          legal_name = ${org.legalName},
          rfc = ${org.rfc},
          phone = ${org.phone},
          address = ${org.address},
          contact_email = ${`admin@${org.domain}`},
          contact_name = ${org.accounts[0]?.name ?? "Admin"},
          city = ${org.city},
          max_users = ${org.maxUsers},
          max_inspectors = ${org.maxInspectors},
          storage_mb = ${org.storageMb}
      where id = ${orgId}
    `;
    await applyDemoBilling(orgId, org.billing);
    for (const account of org.accounts) {
      const email = demoEmail(account.local, org.domain);
      const userId = ids.get(email);
      if (!userId) continue;
      await ensureMember(orgId, userId, account.name, account.role);
    }
  }
  console.info("[inspectamx] auth seed", Date.now() - t0, "ms");
}

async function runOpsSeed() {
  const t0 = Date.now();
  const sql = await getSql();
  const orgs = await sql<{ id: string; slug: string; name: string }>`
    select id, slug, name from organizations order by created_at
  `;
  for (const o of orgs) {
    const pack: "cerlan" | "contri" | "istmo" =
      o.slug === "contri" || o.slug === "istmo" ? o.slug : "cerlan";
    const sample: "cerlan" | "contri" = o.slug === "contri" ? "contri" : "cerlan";
    const [mem] = await sql<{ user_id: string; display_name: string }>`
      select user_id, display_name from org_members where org_id = ${o.id} and role = ${"inspector"} limit 1
    `;
    if (!mem) continue;
    await seedOrgIfEmpty(o.id, mem.user_id, mem.display_name, sample);
    await seedEngine(o.id, pack, mem.user_id, mem.display_name);
  }
  await seedPlatformSamples(orgs);
  console.info("[inspectamx] ops seed", Date.now() - t0, "ms");
}

export async function waitAuthSeed() {
  if (!globalRef.__inspectamxAuth_v4__) {
    globalRef.__inspectamxAuth_v4__ = runAuthSeed().catch((err) => {
      globalRef.__inspectamxAuth_v4__ = undefined;
      throw err;
    });
  }
  await globalRef.__inspectamxAuth_v4__;
}

async function waitOpsSeed() {
  await waitAuthSeed();
  if (!globalRef.__inspectamxOps_v4__) {
    globalRef.__inspectamxOps_v4__ = runOpsSeed().catch((err) => {
      globalRef.__inspectamxOps_v4__ = undefined;
      throw err;
    });
  }
  await globalRef.__inspectamxOps_v4__;
}

/** Fire auth then patio data. Does not await — login only waits on waitAuthSeed. */
export function startDemoSeed() {
  void waitOpsSeed().catch((err) => {
    console.error("[inspectamx] demo seed failed", err);
  });
}

export async function seedDemoAccounts() {
  await waitOpsSeed();
}
