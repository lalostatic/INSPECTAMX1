/**
 * Mapa de puntos del chasis — mismo patrón que el contenedor (vistas + foto).
 * Alineado al FORMATO DE ESTADO DE CHASIS (M&R Mex).
 */
export type ChassisViewId = "frente" | "superior" | "lateral" | "trasera";
export type ChassisLateralSide = "izquierdo" | "derecho";

export type ChassisPoint = {
  id: string;
  view: ChassisViewId;
  n: string;
  label: string;
  component: string;
  /** Posición sobre la imagen (0–100 %). */
  x: number;
  y: number;
};

export const CHASSIS_SIZES = ["20", "40", "45", "48"] as const;

export const CHASSIS_VIEWS: { id: ChassisViewId; title: string; src: string }[] = [
  { id: "frente", title: "Frente", src: "/inspect/chassis-frente.svg" },
  { id: "superior", title: "Superior", src: "/inspect/chassis-superior.svg" },
  { id: "lateral", title: "Lateral", src: "/inspect/chassis-lateral.svg" },
  { id: "trasera", title: "Trasera", src: "/inspect/chassis-trasera.svg" },
];

/** Puntos por vista — toque → foto → campos. */
export const CHASSIS_POINTS: ChassisPoint[] = [
  // ── Frente ──
  { id: "cf-01", view: "frente", n: "1", label: "Manitas de aire", component: "FRONTAL", x: 42, y: 32 },
  { id: "cf-02", view: "frente", n: "2", label: "Conexión de luz", component: "FRONTAL", x: 55, y: 32 },
  { id: "cf-03", view: "frente", n: "3", label: "Seguro delantero izq.", component: "FRONTAL", x: 28, y: 46 },
  { id: "cf-04", view: "frente", n: "4", label: "Seguro delantero der.", component: "FRONTAL", x: 70, y: 46 },
  { id: "cf-05", view: "frente", n: "5", label: "Cabezal cuello de ganso", component: "FRONTAL", x: 40, y: 20 },
  { id: "cf-06", view: "frente", n: "6", label: "Travesaños cuello de ganso", component: "FRONTAL", x: 50, y: 48 },
  { id: "cf-07", view: "frente", n: "7", label: "Patín sin caja (izq.)", component: "FRONTAL", x: 32, y: 78 },
  { id: "cf-08", view: "frente", n: "8", label: "Patín con caja (der.)", component: "FRONTAL", x: 68, y: 78 },

  // ── Superior ──
  { id: "cs-01", view: "superior", n: "1", label: "Cabezal / cuello de ganso", component: "ESTRUCTURA", x: 10, y: 50 },
  { id: "cs-02", view: "superior", n: "2", label: "Travesaño central del patín", component: "ESTRUCTURA", x: 28, y: 50 },
  { id: "cs-03", view: "superior", n: "3", label: "Tirante diagonal", component: "ESTRUCTURA", x: 36, y: 58 },
  { id: "cs-04", view: "superior", n: "4", label: "Base arenera", component: "ESTRUCTURA", x: 40, y: 50 },
  { id: "cs-05", view: "superior", n: "5", label: "Parte central / pedimento", component: "ESTRUCTURA", x: 48, y: 42 },
  { id: "cs-06", view: "superior", n: "6", label: "Travesaños centrales", component: "ESTRUCTURA", x: 52, y: 55 },
  { id: "cs-07", view: "superior", n: "7", label: "Viga estructural", component: "ESTRUCTURA", x: 58, y: 50 },
  { id: "cs-08", view: "superior", n: "8", label: "Rodillo de extensión", component: "ESTRUCTURA", x: 64, y: 50 },
  { id: "cs-09", view: "superior", n: "9", label: "Balancín central", component: "CARRO EJES", x: 72, y: 50 },
  { id: "cs-10", view: "superior", n: "10", label: "Llantas eje delantero", component: "LLANTAS", x: 69, y: 22 },
  { id: "cs-11", view: "superior", n: "11", label: "Llantas eje trasero", component: "LLANTAS", x: 78, y: 78 },
  { id: "cs-12", view: "superior", n: "12", label: "Estribo / defensa", component: "TRASERO", x: 88, y: 50 },

  // ── Lateral ──
  { id: "cl-01", view: "lateral", n: "1", label: "Cabezal cuello de ganso", component: "FRONTAL", x: 10, y: 30 },
  { id: "cl-02", view: "lateral", n: "2", label: "Sistema de mangueras", component: "ELÉCTRICO", x: 30, y: 28 },
  { id: "cl-03", view: "lateral", n: "3", label: "Válvula de servicio", component: "ELÉCTRICO", x: 42, y: 28 },
  { id: "cl-04", view: "lateral", n: "4", label: "Válvula de emergencia", component: "ELÉCTRICO", x: 42, y: 48 },
  { id: "cl-05", view: "lateral", n: "5", label: "Patín / landing gear", component: "FRONTAL", x: 28, y: 72 },
  { id: "cl-06", view: "lateral", n: "6", label: "Tirante longitudinal", component: "ESTRUCTURA", x: 45, y: 42 },
  { id: "cl-07", view: "lateral", n: "7", label: "Muelles", component: "CARRO EJES", x: 60, y: 48 },
  { id: "cl-08", view: "lateral", n: "8", label: "Rotochamber", component: "FRENOS", x: 64, y: 58 },
  { id: "cl-09", view: "lateral", n: "9", label: "Tambores y maza", component: "FRENOS", x: 62, y: 72 },
  { id: "cl-10", view: "lateral", n: "10", label: "Llantas (eje delantero bogie)", component: "LLANTAS", x: 62, y: 78 },
  { id: "cl-11", view: "lateral", n: "11", label: "Llantas (eje trasero bogie)", component: "LLANTAS", x: 74, y: 78 },
  { id: "cl-12", view: "lateral", n: "12", label: "Percha / seguro carro ejes", component: "CARRO EJES", x: 70, y: 42 },
  { id: "cl-13", view: "lateral", n: "13", label: "Placa de circulación", component: "TRASERO", x: 88, y: 45 },
  { id: "cl-14", view: "lateral", n: "14", label: "Cable 7 vías", component: "ELÉCTRICO", x: 16, y: 45 },

  // ── Trasera ──
  { id: "ct-01", view: "trasera", n: "1", label: "Placa de circulación", component: "TRASERO", x: 50, y: 28 },
  { id: "ct-02", view: "trasera", n: "2", label: "Calaveras / luces izq.", component: "TRASERO", x: 28, y: 28 },
  { id: "ct-03", view: "trasera", n: "3", label: "Calaveras / luces der.", component: "TRASERO", x: 72, y: 28 },
  { id: "ct-04", view: "trasera", n: "4", label: "Estribo / defensa", component: "TRASERO", x: 50, y: 42 },
  { id: "ct-05", view: "trasera", n: "5", label: "Lodera izq.", component: "TRASERO", x: 28, y: 58 },
  { id: "ct-06", view: "trasera", n: "6", label: "Lodera der.", component: "TRASERO", x: 72, y: 58 },
  { id: "ct-07", view: "trasera", n: "7", label: "Reflejantes traseros", component: "TRASERO", x: 50, y: 55 },
  { id: "ct-08", view: "trasera", n: "8", label: "Llantas traseras izq.", component: "LLANTAS", x: 35, y: 80 },
  { id: "ct-09", view: "trasera", n: "9", label: "Llantas traseras der.", component: "LLANTAS", x: 65, y: 80 },
  { id: "ct-10", view: "trasera", n: "10", label: "Otros (refacciones)", component: "TRASERO", x: 50, y: 70 },
];

export function chassisPointsForView(view: ChassisViewId) {
  return CHASSIS_POINTS.filter((p) => p.view === view);
}

export function chassisPointById(id: string) {
  return CHASSIS_POINTS.find((p) => p.id === id);
}

export const DAILY_CAPACITY = {
  painters: { min: 5, max: 7, unit: "contenedores", label: "Pintura / acondicionado" },
  repairers: { min: 12, max: 12, unit: "contenedores o chasis", label: "Taller M&R" },
} as const;
