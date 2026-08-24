export const APP_NAME = "INSPECTAMX";
export const APP_TAGLINE =
  "Crea, ejecuta, supervisa y documenta cualquier proceso de inspección desde un solo lugar.";
/** Dominio de producción. MODIFICAR si cambia el hosting. */
export const APP_DOMAIN = "inspectamx.com";
export const APP_URL = "https://inspectamx.com";

export const NAVIERAS = [
  "Hapag-Lloyd", "MSC", "Maersk", "CMA CGM", "ONE", "Evergreen",
  "COSCO", "HMM", "PIL", "Yang Ming", "ZIM", "Textainer", "Seaco", "CAI", "Otra",
] as const;

export const SIZE_CODES = [
  "20DC", "40DC", "40HC", "45HC", "20RF", "40RF", "40RH",
  "20OT", "40OT", "20FR", "40FR", "20TK",
] as const;

export const CLASS_CODES = [
  { code: "C", label: "Dry / general (C)" },
  { code: "R", label: "Reefer (R)" },
  { code: "T", label: "Tanque (T)" },
  { code: "O", label: "Open top (O)" },
  { code: "F", label: "Flat rack (F)" },
] as const;

export const OWNERSHIP = [
  { code: "merchant", label: "Merchant" },
  { code: "carrier", label: "Carrier" },
  { code: "unknown", label: "No indica" },
] as const;

export const INSPECTION_TYPES = [
  "Inspección Express", "Inspección Completa", "Gate-in", "Gate-out",
  "On-hire", "Off-hire", "Pre-trip (PTI)", "In-service",
] as const;

export const LOCATIONS = [
  "Inspección en Bahía", "Patio", "Muelle", "Taller M&R", "Rampa", "Stack", "Gate",
] as const;

export const DAMAGES = [
  "RESTOS DE CARGA", "SUCIO", "ABOLLADO", "AGUJERO", "OXIDADO", "CORTE",
  "FALTANTE", "GOLPE", "CALCAS", "CINTAS EN PANEL", "PISO DAÑADO",
  "GOMA DAÑADA", "LONA / RUBEN", "LLAVES", "SIN ETIQUETA",
] as const;

export const REPAIRS = [
  "BANDA (RESTOS DE CARGA)",
  "LIMPIEZA (SE BARRIÓ PISO COMPLETO)",
  "ENDEREZAR PANEL",
  "RELIMAR CINTAS EN PANEL",
  "RELIMAR LLAVES",
  "CAMBIO DE GOMA DE PUERTA",
  "PARCHE DE ACERO",
  "PINTURA / ACONDICIONADO",
  "SIN REPARACIÓN — SOLO REGISTRO",
] as const;

export const TREATMENTS = ["Acond.", "Pintura táctica", "Lavado", "Solo registro"] as const;
export const MATERIAL_UNITS = ["LTS", "PZ", "KG", "M", "GAL"] as const;

export type Role = "admin" | "office" | "inspector" | "repair" | "painter" | "supervisor" | "consulta";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  office: "Oficina",
  inspector: "Inspector",
  repair: "Taller M&R",
  painter: "Pintura",
  supervisor: "Supervisor",
  consulta: "Consulta",
};

export const ALL_ROLES: Role[] = ["admin", "office", "inspector", "repair", "painter", "supervisor", "consulta"];

export function asRole(r: string): Role {
  if (
    r === "office" ||
    r === "admin" ||
    r === "inspector" ||
    r === "repair" ||
    r === "painter" ||
    r === "supervisor" ||
    r === "consulta"
  ) {
    return r;
  }
  return "inspector";
}

export type ModuleKey = "inspeccion" | "mr" | "pintura";

/** Feature flags per patio. New capabilities are modules — never a custom database per company. */
export const MODULES: {
  key: ModuleKey;
  label: string;
  short: string;
  blurb: string;
}[] = [
  {
    key: "inspeccion",
    label: "Inspecciones y auditorías",
    short: "Inspección",
    blurb: "Plantillas, formularios, evidencias y folios de esta empresa.",
  },
  {
    key: "mr",
    label: "Reporte de trabajo M&R",
    short: "M&R",
    blurb: "Fecha, contenedor y trabajo realizado.",
  },
  {
    key: "pintura",
    label: "Entrada de almacén / pintura",
    short: "Pintura",
    blurb: "Folio, material y unidades acondicionadas.",
  },
];

export function defaultModules(): Record<ModuleKey, boolean> {
  return { inspeccion: true, mr: true, pintura: true };
}
