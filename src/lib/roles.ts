/**
 * INSPECTAMX — permisos por rol.
 *
 * Cómo evita un inspector ver lo que no debe:
 *  - En el menú: canSeeModule / canManageUsers / canSeeReports.
 *  - En el servidor: cada consulta filtra por empresa (esquema t_<uuid>)
 *    y, si el rol es inspector, también por user_id (solo sus folios).
 * Nunca confiar solo en ocultar botones: la regla está en el servidor.
 *
 * MODIFICAR: agregar un rol nuevo aquí y en catalog.ts (ALL_ROLES).
 */
import type { ModuleKey, Role } from "./catalog";

export function canCreateInspection(role: Role) {
  return role === "inspector" || role === "admin";
}

export function canViewArchive(role: Role) {
  return role === "office" || role === "admin" || role === "repair" || role === "supervisor" || role === "painter";
}

export function canWorkMr(role: Role) {
  return role === "repair" || role === "admin" || role === "supervisor";
}

export function canWorkPaint(role: Role) {
  return role === "painter" || role === "admin" || role === "supervisor";
}

/** 9. Solo el administrador da de alta y cambia roles. */
export function canManageUsers(role: Role) {
  return role === "admin";
}

/** 6 y 8. SMTP, respaldos y dominio: solo administrador. */
export function canManageConfig(role: Role) {
  return role === "admin";
}

/** 7. Reportes para administradores (y oficina). */
export function canSeeReports(role: Role) {
  return role === "admin" || role === "office" || role === "supervisor";
}

export function canArchiveInspection(role: Role) {
  return role === "admin" || role === "office";
}

export function canSeeModule(role: Role, module: ModuleKey) {
  if (role === "admin" || role === "office") return true;
  if (module === "inspeccion") return role === "inspector" || role === "supervisor";
  if (module === "mr") return role === "repair" || role === "supervisor";
  if (module === "pintura") return role === "painter" || role === "supervisor";
  return false;
}
