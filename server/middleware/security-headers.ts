/**
 * Cabeceras de endurecimiento. Se aplican a toda respuesta del origin.
 * CSP deliberadamente permisiva con Google Fonts (ya usadas en __root.tsx)
 * y 'unsafe-inline' de estilos (Tailwind runtime + sonner). Apretar CSP
 * sin romper el mapa de puntos / cámara queda para un ciclo posterior.
 */
interface HeaderEvent {
  url: URL;
}

const DOCUMENT_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(self), microphone=(), geolocation=(self), payment=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy": [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export default async function securityHeadersMiddleware(
  event: HeaderEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  if (!(result instanceof Response)) return result;
  const path = event.url.pathname;
  if (path.startsWith("/api/auth")) {
    const headers = new Headers(result.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("strict-transport-security", DOCUMENT_HEADERS["strict-transport-security"]);
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  }
  const headers = new Headers(result.headers);
  for (const [key, value] of Object.entries(DOCUMENT_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
