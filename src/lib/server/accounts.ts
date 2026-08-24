import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";

export async function createCredentialUser(opts: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; created: boolean }> {
  const sql = await getSql();
  const email = opts.email.trim().toLowerCase();
  const existing = await sql<{ id: string }>`
    select id from "user" where email = ${email} limit 1
  `;
  if (existing[0]) return { id: existing[0].id, created: false };
  const map = await ensureUsersWithPassword([{ name: opts.name, email }], opts.password);
  const id = map.get(email);
  if (!id) throw new Error("No se pudo crear el usuario");
  return { id, created: true };
}

/** One password hash shared by every new row — demo accounts all use the same secret. */
export async function ensureUsersWithPassword(
  users: { name: string; email: string }[],
  password: string,
): Promise<Map<string, string>> {
  const sql = await getSql();
  const unique: { name: string; email: string }[] = [];
  const seen = new Set<string>();
  for (const u of users) {
    const email = u.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    unique.push({ name: u.name, email });
  }
  const ids = new Map<string, string>();
  if (unique.length === 0) return ids;

  const placeholders = unique.map((_, i) => `$${i + 1}`).join(",");
  const existing = await sql.query<{ id: string; email: string }>(
    `select id, email from "user" where email in (${placeholders})`,
    unique.map((u) => u.email),
  );
  for (const row of existing) ids.set(row.email, row.id);

  const missing = unique.filter((u) => !ids.has(u.email));
  if (missing.length === 0) return ids;

  const hashed = await hashPassword(password);
  const now = new Date().toISOString();
  const userValues: string[] = [];
  const userParams: unknown[] = [];
  const accValues: string[] = [];
  const accParams: unknown[] = [];
  let uN = 1;
  let aN = 1;
  for (const person of missing) {
    const id = crypto.randomUUID();
    ids.set(person.email, id);
    userValues.push(`($${uN}, $${uN + 1}, $${uN + 2}, true, $${uN + 3}, $${uN + 3})`);
    userParams.push(id, person.name, person.email, now);
    uN += 4;
    accValues.push(`($${aN}, $${aN + 1}, 'credential', $${aN + 2}, $${aN + 3}, $${aN + 4}, $${aN + 4})`);
    accParams.push(crypto.randomUUID(), id, id, hashed, now);
    aN += 5;
  }
  await sql.query(
    `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ${userValues.join(",")}`,
    userParams,
  );
  await sql.query(
    `insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") values ${accValues.join(",")}`,
    accParams,
  );
  return ids;
}
