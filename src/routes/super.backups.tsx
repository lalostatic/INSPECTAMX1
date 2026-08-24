import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/backups")({ component: Page });

function Page() {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-4xl text-navy">Backups de plataforma</h1>
      <p className="text-sm text-steel">
        El respaldo operativo de cada patio lo descarga el administrador de esa empresa en Configuración.
        Aquí el superadmin no mezcla JSON de varias empresas en un solo archivo a propósito: cada patio tiene
        su esquema t_uuid.
      </p>
      <p className="text-sm">
        Para un dump completo del motor: pg_dump de la base INSPECTAMX (todas las empresas).
      </p>
    </div>
  );
}
