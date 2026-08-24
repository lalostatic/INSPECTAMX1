import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listTemplates } from "@/lib/server/engine";
import { canCreateInspection } from "@/lib/roles";
import { getSession } from "@/lib/server/tenant";

export const Route = createFileRoute("/levantar/")({ component: Page });

function Page() {
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const q = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates() });
  const role = session.data?.membership?.role;
  const can = role ? canCreateInspection(role) : false;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Móvil / patio</p>
        <h1 className="font-display text-4xl text-navy">Nueva inspección</h1>
        <p className="mt-1 text-sm text-steel">Elija la plantilla. Foto, GPS y firma van en el formulario.</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {(q.data ?? []).filter((t) => t.active).map((t) => (
          <li key={t.id}>
            <Link
              to={t.kind === "container_map" ? "/nueva" : "/levantar/$templateId"}
              params={t.kind === "container_map" ? undefined : { templateId: t.id }}
              className="block rounded-lg border border-line bg-card p-5 shadow-card hover:border-teal/40"
            >
              <p className="text-[10px] uppercase text-steel">{t.category}</p>
              <h2 className="font-display text-2xl text-navy">{t.name}</h2>
              <p className="text-sm text-steel">{t.description}</p>
              <p className="mt-3 text-sm font-medium text-teal-dark">{can ? "Comenzar" : "Solo lectura"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
