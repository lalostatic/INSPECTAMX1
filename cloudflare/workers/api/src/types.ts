export interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  PHOTOS?: R2Bucket;
  BETTER_AUTH_URL?: string;
  VITE_AUTH_ENABLED?: string;
}

export interface FullEnv extends Env {}

export type PlatformRole = "developer" | "none";
export type MembershipRole =
  | "company_admin"
  | "oficina"
  | "inspector"
  | "taller"
  | "pintura"
  | "consulta";

export type Actor = {
  userId: number;
  platformRole: PlatformRole;
  companyId: number | null;
  branchId: number | null;
  role: MembershipRole | null;
};
