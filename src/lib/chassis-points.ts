/**
 * Mapa de puntos del chasis — alineado al FORMATO DE ESTADO DE CHASIS (M&R Mex).
 * Columnas del papel: IZQUIERDO | PARTE FRONTAL | DERECHO | OBSERVACIONES.
 * El flujo diario depende del ingreso de unidades al patio (gate-in).
 */
export type ChassisSide = "izquierdo" | "derecho" | "ambos" | "centro";

export type ChassisPoint = {
  id: string;
  n: string;
  label: string;
  group: string;
  side: ChassisSide;
  /** Posición en vista superior (0–100). */
  x: number;
  y: number;
  /** Posición opcional en elevación lateral (0–100). */
  sx?: number;
  sy?: number;
};

export const CHASSIS_SIZES = ["20", "40", "45", "48"] as const;

export const CHASSIS_GROUPS = [
  "Frontal / patín",
  "Estructura",
  "Carro de ejes",
  "Frenos y llantas",
  "Eléctrico / mangueras",
  "Trasero",
] as const;

/** Orden y nombres exactos del formato de papel. */
export const CHASSIS_POINTS: ChassisPoint[] = [
  // Frontal / patín
  { id: "c-01", n: "1", label: "Manitas de aire", group: "Frontal / patín", side: "centro", x: 12, y: 28, sx: 8, sy: 35 },
  { id: "c-02", n: "2", label: "Conexión de luz", group: "Eléctrico / mangueras", side: "centro", x: 10, y: 42, sx: 6, sy: 42 },
  { id: "c-03", n: "3", label: "Seguro delantero", group: "Frontal / patín", side: "ambos", x: 18, y: 18, sx: 14, sy: 22 },
  { id: "c-04", n: "4", label: "Travesaños cuello de ganso", group: "Frontal / patín", side: "centro", x: 22, y: 35, sx: 18, sy: 38 },
  { id: "c-05", n: "5", label: "Cabezal cuello de ganso", group: "Frontal / patín", side: "centro", x: 8, y: 35, sx: 4, sy: 38 },
  { id: "c-06", n: "6", label: "Patín con caja", group: "Frontal / patín", side: "derecho", x: 28, y: 50, sx: 24, sy: 55 },
  { id: "c-07", n: "7", label: "Patín sin caja", group: "Frontal / patín", side: "izquierdo", x: 28, y: 20, sx: 24, sy: 55 },
  { id: "c-08", n: "8", label: "Tirante diagonal", group: "Estructura", side: "centro", x: 36, y: 42, sx: 32, sy: 48 },
  { id: "c-09", n: "9", label: "Travesaño central del patín", group: "Frontal / patín", side: "centro", x: 32, y: 35, sx: 28, sy: 42 },
  { id: "c-10", n: "10", label: "Base arenera", group: "Estructura", side: "centro", x: 40, y: 35, sx: 38, sy: 50 },
  // Estructura
  { id: "c-11", n: "11", label: "Parte central", group: "Estructura", side: "centro", x: 48, y: 28, sx: 48, sy: 40 },
  { id: "c-12", n: "12", label: "Pedimento", group: "Estructura", side: "centro", x: 46, y: 22, sx: 44, sy: 32 },
  { id: "c-13", n: "13", label: "Travesaños centrales", group: "Estructura", side: "centro", x: 52, y: 40, sx: 52, sy: 45 },
  { id: "c-14", n: "14", label: "Viga estructural", group: "Estructura", side: "centro", x: 58, y: 35, sx: 58, sy: 42 },
  { id: "c-15", n: "15", label: "Rodillo de extensión", group: "Estructura", side: "centro", x: 62, y: 35, sx: 62, sy: 48 },
  { id: "c-16", n: "16", label: "Parte trasera", group: "Trasero", side: "centro", x: 88, y: 35, sx: 90, sy: 42 },
  // Carro de ejes
  { id: "c-17", n: "17", label: "Balancín central", group: "Carro de ejes", side: "centro", x: 70, y: 35, sx: 72, sy: 48 },
  { id: "c-18", n: "18", label: "Percha delantera", group: "Carro de ejes", side: "centro", x: 66, y: 28, sx: 68, sy: 38 },
  { id: "c-19", n: "19", label: "Percha central", group: "Carro de ejes", side: "centro", x: 74, y: 35, sx: 76, sy: 40 },
  { id: "c-20", n: "20", label: "Percha trasera", group: "Carro de ejes", side: "centro", x: 80, y: 35, sx: 82, sy: 40 },
  { id: "c-21", n: "21", label: "Seguro del carro de ejes", group: "Carro de ejes", side: "centro", x: 76, y: 42, sx: 78, sy: 52 },
  { id: "c-22", n: "22", label: "Muelles delanteras", group: "Carro de ejes", side: "ambos", x: 68, y: 18, sx: 70, sy: 55 },
  { id: "c-23", n: "23", label: "Muelles traseras", group: "Carro de ejes", side: "ambos", x: 80, y: 52, sx: 82, sy: 55 },
  // Frenos y llantas
  { id: "c-24", n: "24", label: "Rotochamber delanteros", group: "Frenos y llantas", side: "ambos", x: 70, y: 12, sx: 70, sy: 58 },
  { id: "c-25", n: "25", label: "Rotochamber traseros", group: "Frenos y llantas", side: "ambos", x: 82, y: 58, sx: 82, sy: 58 },
  { id: "c-26", n: "26", label: "Alineadores de eje", group: "Carro de ejes", side: "centro", x: 78, y: 42, sx: 76, sy: 50 },
  { id: "c-27", n: "27", label: "Ajuste del / fijo del", group: "Carro de ejes", side: "ambos", x: 68, y: 48, sx: 69, sy: 52 },
  { id: "c-28", n: "28", label: "Ajuste tras / fijo tras", group: "Carro de ejes", side: "ambos", x: 82, y: 28, sx: 81, sy: 52 },
  { id: "c-29", n: "29", label: "Tambores y maza delanteros", group: "Frenos y llantas", side: "ambos", x: 70, y: 6, sx: 70, sy: 62 },
  { id: "c-30", n: "30", label: "Tambores y maza traseros", group: "Frenos y llantas", side: "ambos", x: 82, y: 64, sx: 82, sy: 62 },
  { id: "c-31", n: "31", label: "Balatas delanteras", group: "Frenos y llantas", side: "ambos", x: 66, y: 10, sx: 68, sy: 60 },
  { id: "c-32", n: "32", label: "Balatas traseras", group: "Frenos y llantas", side: "ambos", x: 84, y: 60, sx: 84, sy: 60 },
  { id: "c-33", n: "33", label: "Llantas eje delantero", group: "Frenos y llantas", side: "ambos", x: 72, y: 4, sx: 70, sy: 68 },
  { id: "c-34", n: "34", label: "Llantas eje trasero", group: "Frenos y llantas", side: "ambos", x: 86, y: 66, sx: 82, sy: 68 },
  // Eléctrico / mangueras
  { id: "c-35", n: "35", label: "Cable 7 vías", group: "Eléctrico / mangueras", side: "centro", x: 16, y: 48, sx: 12, sy: 30 },
  { id: "c-36", n: "36", label: "Válvula de servicio", group: "Eléctrico / mangueras", side: "centro", x: 44, y: 16, sx: 42, sy: 28 },
  { id: "c-37", n: "37", label: "Válvula de emergencia", group: "Eléctrico / mangueras", side: "centro", x: 44, y: 54, sx: 42, sy: 48 },
  { id: "c-38", n: "38", label: "Sistema de mangueras", group: "Eléctrico / mangueras", side: "centro", x: 42, y: 35, sx: 40, sy: 36 },
  // Trasero
  { id: "c-39", n: "39", label: "Placa de circulación", group: "Trasero", side: "centro", x: 92, y: 42, sx: 94, sy: 48 },
  { id: "c-40", n: "40", label: "Estribo / defensa", group: "Trasero", side: "centro", x: 94, y: 50, sx: 96, sy: 55 },
  { id: "c-41", n: "41", label: "Calaveras / tope / lodera", group: "Trasero", side: "ambos", x: 90, y: 18, sx: 92, sy: 58 },
  { id: "c-42", n: "42", label: "Reflejantes traseros", group: "Trasero", side: "centro", x: 88, y: 35, sx: 90, sy: 52 },
  { id: "c-43", n: "43", label: "Otros (refacciones internas)", group: "Trasero", side: "centro", x: 50, y: 60, sx: 50, sy: 70 },
];

export function chassisPointById(id: string) {
  return CHASSIS_POINTS.find((p) => p.id === id);
}

export function sideLabel(side: ChassisSide) {
  if (side === "izquierdo") return "Izquierdo";
  if (side === "derecho") return "Derecho";
  if (side === "ambos") return "Izq. / Der.";
  return "Centro";
}

/** Capacidad operativa diaria de referencia (patio). */
export const DAILY_CAPACITY = {
  painters: { min: 5, max: 7, unit: "contenedores", label: "Pintura / acondicionado" },
  repairers: { min: 12, max: 12, unit: "contenedores o chasis", label: "Taller M&R" },
} as const;
