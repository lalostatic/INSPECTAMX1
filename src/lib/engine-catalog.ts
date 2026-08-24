/** INSPECTAMX — catálogo del motor de plantillas. Cada empresa elige qué usa. */

export const APP_SLOGAN =
  "Crea, ejecuta, supervisa y documenta cualquier proceso de inspección desde un solo lugar.";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "photo"
  | "video"
  | "audio"
  | "document"
  | "signature"
  | "gps"
  | "comment";

export const FIELD_TYPES: { type: FieldType; label: string; hint: string }[] = [
  { type: "text", label: "Texto", hint: "Una línea" },
  { type: "number", label: "Número", hint: "Kilometraje, cantidad" },
  { type: "textarea", label: "Párrafo", hint: "Observaciones" },
  { type: "select", label: "Selección", hint: "Lista de opciones" },
  { type: "checkbox", label: "Sí / No", hint: "Cumple o no" },
  { type: "date", label: "Fecha", hint: "Día del levantamiento" },
  { type: "photo", label: "Fotografía", hint: "Evidencia visual" },
  { type: "video", label: "Video", hint: "Clip corto" },
  { type: "audio", label: "Audio", hint: "Nota de voz" },
  { type: "document", label: "Documento", hint: "PDF u otro" },
  { type: "signature", label: "Firma", hint: "Aceptación" },
  { type: "gps", label: "GPS", hint: "Dónde se hizo" },
  { type: "comment", label: "Comentario", hint: "Nota libre" },
];

export const DEFAULT_STATUSES: { key: string; label: string; color: string; initial?: boolean; final?: boolean }[] = [
  { key: "borrador", label: "Borrador", color: "steel", initial: true },
  { key: "en_proceso", label: "En proceso", color: "teal" },
  { key: "revision", label: "Revisión", color: "warn" },
  { key: "aprobado", label: "Aprobado", color: "ok", final: true },
  { key: "rechazado", label: "Rechazado", color: "rust" },
  { key: "correccion", label: "Corrección", color: "warn" },
  { key: "cerrado", label: "Cerrado", color: "navy", final: true },
];

export const INCIDENT_KINDS = [
  "Daño",
  "Falla",
  "No conformidad",
  "Riesgo",
  "Defecto",
  "Anomalía",
  "Incumplimiento",
  "Observación",
] as const;

export const SEVERITIES = ["baja", "media", "alta", "critica"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const PRIORITIES = ["baja", "media", "alta"] as const;

export const SCORE_BANDS = [
  { min: 90, label: "Excelente" },
  { min: 80, label: "Bueno" },
  { min: 70, label: "Regular" },
  { min: 0, label: "Crítico" },
] as const;

export function scoreLabel(score: number) {
  for (const b of SCORE_BANDS) if (score >= b.min) return b.label;
  return "Crítico";
}

export const FAIL_VALUES = new Set(
  ["falla", "malo", "no", "critico", "crítico", "rechazado", "0", "false"].map((s) => s.toLowerCase()),
);

export function answerPasses(value: string) {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (v === "si" || v === "sí" || v === "ok" || v === "bueno" || v === "true" || v === "1") return true;
  if (FAIL_VALUES.has(v)) return false;
  return true;
}

export const DASHBOARD_WIDGETS: { key: string; label: string }[] = [
  { key: "inspecciones", label: "Inspecciones" },
  { key: "incidencias", label: "Incidencias" },
  { key: "estados", label: "Por estado" },
  { key: "tareas", label: "Tareas" },
  { key: "score", label: "Puntuación" },
  { key: "vivos", label: "Folios en vivo" },
];

export const AUTOMATION_WHENS = [
  { key: "incidencia_critica", label: "Incidencia crítica" },
  { key: "rechazada", label: "Inspección rechazada" },
  { key: "score_critico", label: "Puntuación menor a 70" },
  { key: "vencida_24h", label: "No finalizada en 24 h" },
] as const;

export const AUTOMATION_THENS = [
  { key: "notificar_supervisor", label: "Notificar al supervisor" },
  { key: "crear_tarea", label: "Crear tarea de corrección" },
  { key: "whatsapp_admin", label: "Aviso WhatsApp al administrador" },
] as const;

export const TEMPLATE_CATEGORIES = [
  "Contenedor",
  "Vehículo",
  "Almacén",
  "Equipo",
  "Seguridad",
  "Calidad",
  "Mantenimiento",
  "Construcción",
  "Otro",
] as const;
