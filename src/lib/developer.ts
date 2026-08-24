/**
 * INSPECTAMX — superadmin de la plataforma.
 * Correo canónico: desarrollo@inspectamx.com
 * Alias aceptado: desarrolo@inspectamx.com (el que se usa al entrar).
 * MODIFICAR: DEVELOPER_EMAILS si cambia quién controla /super.
 */
export const DEVELOPER_EMAIL = "desarrollo@inspectamx.com";

export const DEVELOPER_EMAILS = [
  "desarrollo@inspectamx.com",
  "desarrolo@inspectamx.com",
] as const;

export function isDeveloperEmail(email: string | null | undefined) {
  const n = (email ?? "").trim().toLowerCase();
  return (DEVELOPER_EMAILS as readonly string[]).includes(n);
}
