/**
 * Mapa de puntos del chasis — alineado al FORMATO DE ESTADO DE CHASIS (M&R Mex).
 * Izquierdo / derecho / centro: el inspector marca OK o daño por componente.
 * El flujo diario depende del ingreso de unidades al patio (gate-in), no de un pipeline fijo.
 */
export type ChassisSide = "izquierdo" | "derecho" | "centro";

export type ChassisPoint = {
  id: string;
  n: string;
  label: string;
  group: string;
  side: ChassisSide;
  /** Porcentaje sobre el diagrama top-view (0–100). */
  x: number;
  y: number;
};

export const CHASSIS_GROUPS = [
  "Frontal / patín",
  "Estructura",
  "Carro de ejes",
  "Frenos y llantas",
  "Eléctrico / mangueras",
  "Trasero",
] as const;

export const CHASSIS_POINTS: ChassisPoint[] = [
  { id: "c-01", n: "1", label: "Manitas de aire", group: "Frontal / patín", side: "centro", x: 18, y: 28 },
  { id: "c-02", n: "2", label: "Conexión de luz", group: "Eléctrico / mangueras", side: "centro", x: 14, y: 38 },
  { id: "c-03", n: "3", label: "Seguro delantero", group: "Frontal / patín", side: "izquierdo", x: 22, y: 18 },
  { id: "c-04", n: "4", label: "Seguro delantero", group: "Frontal / patín", side: "derecho", x: 22, y: 52 },
  { id: "c-05", n: "5", label: "Travesaños cuello de ganso", group: "Frontal / patín", side: "centro", x: 28, y: 35 },
  { id: "c-06", n: "6", label: "Cabezal cuello de ganso", group: "Frontal / patín", side: "centro", x: 12, y: 35 },
  { id: "c-07", n: "7", label: "Patín con caja", group: "Frontal / patín", side: "derecho", x: 32, y: 48 },
  { id: "c-08", n: "8", label: "Patín sin caja", group: "Frontal / patín", side: "izquierdo", x: 32, y: 22 },
  { id: "c-09", n: "9", label: "Tirante diagonal", group: "Estructura", side: "centro", x: 40, y: 42 },
  { id: "c-10", n: "10", label: "Travesaño frontal del patín", group: "Frontal / patín", side: "centro", x: 36, y: 35 },
  { id: "c-11", n: "11", label: "Base arenera", group: "Estructura", side: "centro", x: 44, y: 35 },
  { id: "c-12", n: "12", label: "Parte central / pedimento", group: "Estructura", side: "centro", x: 50, y: 28 },
  { id: "c-13", n: "13", label: "Travesaños centrales", group: "Estructura", side: "centro", x: 52, y: 40 },
  { id: "c-14", n: "14", label: "Viga estructural", group: "Estructura", side: "centro", x: 58, y: 35 },
  { id: "c-15", n: "15", label: "Rodillo de extensión", group: "Estructura", side: "centro", x: 62, y: 35 },
  { id: "c-16", n: "16", label: "Balancín central", group: "Carro de ejes", side: "centro", x: 68, y: 35 },
  { id: "c-17", n: "17", label: "Percha delantera", group: "Carro de ejes", side: "centro", x: 66, y: 28 },
  { id: "c-18", n: "18", label: "Percha central", group: "Carro de ejes", side: "centro", x: 74, y: 35 },
  { id: "c-19", n: "19", label: "Percha trasera", group: "Carro de ejes", side: "centro", x: 80, y: 35 },
  { id: "c-20", n: "20", label: "Seguro del carro de ejes", group: "Carro de ejes", side: "centro", x: 76, y: 42 },
  { id: "c-21", n: "21", label: "Muelles delanteras", group: "Carro de ejes", side: "izquierdo", x: 68, y: 18 },
  { id: "c-22", n: "22", label: "Muelles traseras", group: "Carro de ejes", side: "derecho", x: 80, y: 52 },
  { id: "c-23", n: "23", label: "Rotochamber delanteros", group: "Frenos y llantas", side: "izquierdo", x: 70, y: 14 },
  { id: "c-24", n: "24", label: "Rotochamber traseros", group: "Frenos y llantas", side: "derecho", x: 82, y: 56 },
  { id: "c-25", n: "25", label: "Alineadores de eje", group: "Carro de ejes", side: "centro", x: 78, y: 42 },
  { id: "c-26", n: "26", label: "Tambores y maza delanteros", group: "Frenos y llantas", side: "izquierdo", x: 70, y: 8 },
  { id: "c-27", n: "27", label: "Tambores y maza traseros", group: "Frenos y llantas", side: "derecho", x: 82, y: 62 },
  { id: "c-28", n: "28", label: "Balatas delanteras", group: "Frenos y llantas", side: "izquierdo", x: 66, y: 10 },
  { id: "c-29", n: "29", label: "Balatas traseras", group: "Frenos y llantas", side: "derecho", x: 84, y: 60 },
  { id: "c-30", n: "30", label: "Llantas eje delantero", group: "Frenos y llantas", side: "izquierdo", x: 72, y: 6 },
  { id: "c-31", n: "31", label: "Llantas eje trasero", group: "Frenos y llantas", side: "derecho", x: 86, y: 64 },
  { id: "c-32", n: "32", label: "Cable 7 vías", group: "Eléctrico / mangueras", side: "centro", x: 20, y: 42 },
  { id: "c-33", n: "33", label: "Válvula de servicio", group: "Eléctrico / mangueras", side: "centro", x: 48, y: 18 },
  { id: "c-34", n: "34", label: "Válvula de emergencia", group: "Eléctrico / mangueras", side: "centro", x: 48, y: 52 },
  { id: "c-35", n: "35", label: "Sistema de mangueras", group: "Eléctrico / mangueras", side: "centro", x: 46, y: 35 },
  { id: "c-36", n: "36", label: "Placa de circulación", group: "Trasero", side: "centro", x: 90, y: 42 },
  { id: "c-37", n: "37", label: "Estribo / defensa", group: "Trasero", side: "centro", x: 92, y: 50 },
  { id: "c-38", n: "38", label: "Calaveras / tope / lodera", group: "Trasero", side: "izquierdo", x: 88, y: 18 },
  { id: "c-39", n: "39", label: "Calaveras / tope / lodera", group: "Trasero", side: "derecho", x: 88, y: 52 },
  { id: "c-40", n: "40", label: "Reflejantes traseros", group: "Trasero", side: "centro", x: 86, y: 35 },
];

export function chassisPointById(id: string) {
  return CHASSIS_POINTS.find((p) => p.id === id);
}

/** Capacidad operativa diaria de referencia (patio). El flujo real lo define el ingreso del día. */
export const DAILY_CAPACITY = {
  painters: { min: 5, max: 7, unit: "contenedores", label: "Pintura / acondicionado" },
  repairers: { min: 12, max: 12, unit: "contenedores o chasis", label: "Taller M&R" },
} as const;
