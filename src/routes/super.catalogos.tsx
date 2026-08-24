import { createFileRoute } from "@tanstack/react-router";
import { DAMAGES, NAVIERAS, SIZE_CODES } from "@/lib/catalog";
import { DEFAULT_STATUSES, FIELD_TYPES, INCIDENT_KINDS } from "@/lib/engine-catalog";

export const Route = createFileRoute("/super/catalogos")({ component: Page });

function Page() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Catálogos globales</h1>
      <p className="text-sm text-steel">
        El motor es único. Cada empresa arma plantillas, campos y estados sobre estos catálogos.
      </p>
      <Block title="Tipos de campo" items={FIELD_TYPES.map((f) => f.label)} />
      <Block title="Estados por defecto" items={DEFAULT_STATUSES.map((s) => s.label)} />
      <Block title="Tipos de incidencia" items={[...INCIDENT_KINDS]} />
      <Block title="Tamaños de contenedor (plantilla de patio)" items={[...SIZE_CODES]} />
      <Block title="Navieras" items={[...NAVIERAS]} />
      <Block title="Daños de patio" items={[...DAMAGES]} />
    </div>
  );
}
function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-line bg-card p-4">
      <h2 className="font-medium text-navy">{title}</h2>
      <p className="mt-2 text-sm text-steel">{items.join(" · ")}</p>
    </section>
  );
}