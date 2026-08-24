/**
 * INSPECTAMX — compartir SIN API de pago.
 *
 * WhatsApp y Telegram se abren con el enlace oficial de compartir del teléfono.
 * No se usa WhatsApp Business API ni Telegram Bot API (no hay costo ni token).
 *
 * MODIFICAR textos en `inspectionShareText`.
 * Dominio público: https://inspectamx.com
 */

const SITE = "https://inspectamx.com";

export function inspectionShareText(opts: {
  containerNo: string;
  inspectorName: string;
  inspectedAt: string;
  damage?: string;
}): string {
  const daño = opts.damage ? `Daño: ${opts.damage}` : "Sin detalle de daño";
  return [
    "INSPECTAMX — inspección",
    `Unidad: ${opts.containerNo}`,
    `Inspector: ${opts.inspectorName}`,
    `Fecha: ${opts.inspectedAt}`,
    daño,
    SITE,
  ].join("\n");
}

/** Abre WhatsApp con el texto listo. Funciona en teléfono y WhatsApp Web. */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Abre Telegram con el texto listo. */
export function telegramShareUrl(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(SITE)}&text=${encodeURIComponent(text)}`;
}
