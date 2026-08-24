/**
 * INSPECTAMX — compresión de fotografías al tomarlas.
 *
 * Dónde se guardan: el JPEG comprimido (data URL) se envía al servidor y
 * queda en la tabla `photos` del esquema de la empresa (t_<uuid>.photos).
 * No se mezcla con fotos de otro patio.
 *
 * Formato: se mantiene JPEG (image/jpeg). No se convierte a WebP ni PNG.
 * Calidad: 0.85 — baja un poco el peso sin que se note en patio.
 * Tamaño: el lado más largo a 1600 px.
 *
 * MODIFICAR: `MAX_EDGE` y `JPEG_QUALITY` si necesita más o menos detalle.
 */

/** Lado máximo en píxeles. Subir a 1920 para más detalle; bajar a 1280 para menos peso. */
export const MAX_EDGE = 1600;
/** Calidad JPEG 0–1. 0.85 conserva nitidez de golpes/óxido. */
export const JPEG_QUALITY = 0.85;

export async function compressImage(
  file: File,
  maxEdge = MAX_EDGE,
  quality = JPEG_QUALITY,
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la foto"));
      el.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sin canvas");
    ctx.drawImage(img, 0, 0, w, h);
    // Siempre JPEG para no cambiar el formato de captura.
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
