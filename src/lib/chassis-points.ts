/**
 * Inspección de chasis — mapa de puntos sobre plano técnico.
 * No es inspección de vehículo/auto.
 */
export type ChassisViewId = "plano" | "frente" | "superior" | "lateral" | "trasera";
export type ChassisLateralSide = "izquierdo" | "derecho";

export type ChassisPoint = {
  id: string;
  view: ChassisViewId;
  n: string;
  label: string;
  component: string;
  x: number;
  y: number;
};

export const CHASSIS_SIZES = ["20", "40", "45", "48"] as const;

export const CHASSIS_VIEWS: { id: ChassisViewId; title: string; src: string }[] = [
  { id: "plano", title: "Plano", src: "/inspect/chassis-plano.svg" },
  { id: "lateral", title: "Lateral", src: "/inspect/chassis-lateral.svg" },
  { id: "superior", title: "Superior", src: "/inspect/chassis-superior.svg" },
  { id: "frente", title: "Frente", src: "/inspect/chassis-frente.svg" },
  { id: "trasera", title: "Trasera", src: "/inspect/chassis-trasera.svg" },
];

export const CHASSIS_POINTS: ChassisPoint[] = [
  // Plano técnico (elevación + planta + frente + trasera)
  { id: "cp-01", view: "plano", n: "1", label: "Cabezal / cuello de ganso", component: "FRONTAL", x: 12, y: 18 },
  { id: "cp-02", view: "plano", n: "2", label: "King pin / seguro delantero", component: "FRONTAL", x: 10, y: 22 },
  { id: "cp-03", view: "plano", n: "3", label: "Patín (landing gear)", component: "FRONTAL", x: 30, y: 28 },
  { id: "cp-04", view: "plano", n: "4", label: "Viga longitudinal", component: "ESTRUCTURA", x: 52, y: 17 },
  { id: "cp-05", view: "plano", n: "5", label: "Llantas eje delantero", component: "LLANTAS", x: 78, y: 27 },
  { id: "cp-06", view: "plano", n: "6", label: "Llantas eje trasero", component: "LLANTAS", x: 86, y: 27 },
  { id: "cp-07", view: "plano", n: "7", label: "Estribo / defensa", component: "TRASERO", x: 93, y: 18 },
  { id: "cp-08", view: "plano", n: "8", label: "Cuello de ganso (planta)", component: "FRONTAL", x: 11, y: 52 },
  { id: "cp-09", view: "plano", n: "9", label: "Travesaños centrales", component: "ESTRUCTURA", x: 48, y: 52 },
  { id: "cp-10", view: "plano", n: "10", label: "Bogie / llantas planta", component: "LLANTAS", x: 78, y: 40 },
  { id: "cp-11", view: "plano", n: "11", label: "Defensa trasera (planta)", component: "TRASERO", x: 90, y: 52 },
  { id: "cp-12", view: "plano", n: "12", label: "Manitas de aire / conexión luz", component: "FRONTAL", x: 28, y: 82 },
  { id: "cp-13", view: "plano", n: "13", label: "Patín frente", component: "FRONTAL", x: 28, y: 90 },
  { id: "cp-14", view: "plano", n: "14", label: "Calaveras / placa", component: "TRASERO", x: 68, y: 78 },
  { id: "cp-15", view: "plano", n: "15", label: "Loderas / llantas traseras", component: "TRASERO", x: 72, y: 90 },

  { id: "cl-01", view: "lateral", n: "1", label: "Cabezal cuello de ganso", component: "FRONTAL", x: 12, y: 28 },
  { id: "cl-02", view: "lateral", n: "2", label: "Manitas de aire / conexión luz", component: "FRONTAL", x: 18, y: 42 },
  { id: "cl-03", view: "lateral", n: "3", label: "King pin / seguro delantero", component: "FRONTAL", x: 14, y: 48 },
  { id: "cl-04", view: "lateral", n: "4", label: "Patín (landing gear)", component: "FRONTAL", x: 28, y: 72 },
  { id: "cl-05", view: "lateral", n: "5", label: "Viga longitudinal", component: "ESTRUCTURA", x: 48, y: 42 },
  { id: "cl-06", view: "lateral", n: "6", label: "Sistema de mangueras", component: "ELÉCTRICO", x: 40, y: 35 },
  { id: "cl-07", view: "lateral", n: "7", label: "Muelles / suspensión", component: "CARRO EJES", x: 75, y: 55 },
  { id: "cl-08", view: "lateral", n: "8", label: "Rotochamber / frenos", component: "FRENOS", x: 78, y: 62 },
  { id: "cl-09", view: "lateral", n: "9", label: "Llantas eje delantero", component: "LLANTAS", x: 77, y: 72 },
  { id: "cl-10", view: "lateral", n: "10", label: "Llantas eje trasero", component: "LLANTAS", x: 87, y: 72 },
  { id: "cl-11", view: "lateral", n: "11", label: "Tambores y maza", component: "FRENOS", x: 82, y: 68 },
  { id: "cl-12", view: "lateral", n: "12", label: "Placa / estribo trasero", component: "TRASERO", x: 93, y: 45 },

  { id: "cs-01", view: "superior", n: "1", label: "Cuello de ganso", component: "FRONTAL", x: 10, y: 50 },
  { id: "cs-02", view: "superior", n: "2", label: "Travesaños frontales", component: "ESTRUCTURA", x: 24, y: 50 },
  { id: "cs-03", view: "superior", n: "3", label: "Patín / manivela", component: "FRONTAL", x: 32, y: 58 },
  { id: "cs-04", view: "superior", n: "4", label: "Tirante diagonal", component: "ESTRUCTURA", x: 36, y: 42 },
  { id: "cs-05", view: "superior", n: "5", label: "Travesaños centrales", component: "ESTRUCTURA", x: 50, y: 50 },
  { id: "cs-06", view: "superior", n: "6", label: "Viga estructural", component: "ESTRUCTURA", x: 62, y: 38 },
  { id: "cs-07", view: "superior", n: "7", label: "Rodillo de extensión", component: "ESTRUCTURA", x: 70, y: 50 },
  { id: "cs-08", view: "superior", n: "8", label: "Llantas bogie izq.", component: "LLANTAS", x: 78, y: 22 },
  { id: "cs-09", view: "superior", n: "9", label: "Llantas bogie der.", component: "LLANTAS", x: 78, y: 78 },
  { id: "cs-10", view: "superior", n: "10", label: "Balancín / perchas", component: "CARRO EJES", x: 82, y: 50 },
  { id: "cs-11", view: "superior", n: "11", label: "Defensa trasera", component: "TRASERO", x: 92, y: 50 },

  { id: "cf-01", view: "frente", n: "1", label: "Cabezal cuello de ganso", component: "FRONTAL", x: 50, y: 18 },
  { id: "cf-02", view: "frente", n: "2", label: "Manitas de aire", component: "FRONTAL", x: 44, y: 32 },
  { id: "cf-03", view: "frente", n: "3", label: "Conexión de luz", component: "ELÉCTRICO", x: 58, y: 32 },
  { id: "cf-04", view: "frente", n: "4", label: "Seguro delantero izq.", component: "FRONTAL", x: 28, y: 45 },
  { id: "cf-05", view: "frente", n: "5", label: "Seguro delantero der.", component: "FRONTAL", x: 72, y: 45 },
  { id: "cf-06", view: "frente", n: "6", label: "Travesaños frontales", component: "ESTRUCTURA", x: 50, y: 48 },
  { id: "cf-07", view: "frente", n: "7", label: "Patín izquierdo", component: "FRONTAL", x: 32, y: 78 },
  { id: "cf-08", view: "frente", n: "8", label: "Patín derecho", component: "FRONTAL", x: 68, y: 78 },

  { id: "ct-01", view: "trasera", n: "1", label: "Placa de circulación", component: "TRASERO", x: 50, y: 16 },
  { id: "ct-02", view: "trasera", n: "2", label: "Calaveras izq.", component: "TRASERO", x: 26, y: 16 },
  { id: "ct-03", view: "trasera", n: "3", label: "Calaveras der.", component: "TRASERO", x: 74, y: 16 },
  { id: "ct-04", view: "trasera", n: "4", label: "Estribo / defensa", component: "TRASERO", x: 50, y: 28 },
  { id: "ct-05", view: "trasera", n: "5", label: "Lodera izq.", component: "TRASERO", x: 28, y: 40 },
  { id: "ct-06", view: "trasera", n: "6", label: "Lodera der.", component: "TRASERO", x: 72, y: 40 },
  { id: "ct-07", view: "trasera", n: "7", label: "Llantas bogie delantero", component: "LLANTAS", x: 32, y: 78 },
  { id: "ct-08", view: "trasera", n: "8", label: "Llantas bogie trasero", component: "LLANTAS", x: 68, y: 78 },
  { id: "ct-09", view: "trasera", n: "9", label: "Tambores / balatas", component: "FRENOS", x: 50, y: 65 },
  { id: "ct-10", view: "trasera", n: "10", label: "Reflejantes", component: "TRASERO", x: 50, y: 48 },
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
