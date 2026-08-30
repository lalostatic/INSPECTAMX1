import type { Actor, MembershipRole, PlatformRole } from "./types";

function header(request: Request, name: string): string | null {
  const raw = request.headers.get(name);
  return raw && raw.trim() ? raw.trim() : null;
}

function asInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function readActor(request: Request): Actor | null {
  const userId = asInt(header(request, "x-inspectamx-user"));
  if (userId == null) return null;
  const platformRole = (header(request, "x-inspectamx-platform") ??
    "none") as PlatformRole;
  const role = header(request, "x-inspectamx-role") as MembershipRole | null;
  return {
    userId,
    platformRole: platformRole === "developer" ? "developer" : "none",
    companyId: asInt(header(request, "x-inspectamx-company")),
    branchId: asInt(header(request, "x-inspectamx-branch")),
    role: role || null,
  };
}

export function canReadCompany(actor: Actor, companyId: number): boolean {
  if (actor.platformRole === "developer") return true;
  return actor.companyId === companyId;
}

export function folioScopeSql(actor: Actor): { sql: string; params: unknown[] } {
  if (actor.platformRole === "developer") {
    return { sql: "1 = 1", params: [] };
  }
  if (actor.companyId == null) {
    return { sql: "1 = 0", params: [] };
  }
  if (actor.role === "inspector") {
    return {
      sql: "company_id = ? AND (inspector_user_id = ? OR branch_id = ?)",
      params: [actor.companyId, actor.userId, actor.branchId ?? -1],
    };
  }
  return { sql: "company_id = ?", params: [actor.companyId] };
}
