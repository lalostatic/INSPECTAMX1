import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/seguridad")({ component: Page });

function Page() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Seguridad</h1>
      <ul className="list-disc space-y-2 pl-5 text-sm text-steel">
        <li>Este panel solo lo abren desarrollo@inspectamx.com y desarrolo@inspectamx.com.</li>
        <li>Alta de usuarios: administrador de cada patio (Equipo). No hay registro público.</li>
        <li>Inspector: solo sus folios. Consulta: solo lectura. Supervisor: operación asignada.</li>
        <li>Contraseña mínima 8 caracteres. Reset y forzar cierre desde Usuarios.</li>
        <li>Impersonación: queda registrada en logs. El patio ve una barra de soporte.</li>
        <li>Cada empresa vive en su esquema Postgres t_uuid — no se mezclan fotos ni folios.</li>
        <li>SMTP, WhatsApp y respaldos JSON son por empresa, nunca una cuenta global.</li>
      </ul>
    </div>
  );
}
