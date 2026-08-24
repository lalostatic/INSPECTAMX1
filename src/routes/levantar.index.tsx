import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listTemplates } from "@/lib/server/engine";
import { canCreateInspection } from "@/lib/roles";
import { getSession } from "@/lib/server/tenant";

export const Route = createFileRoute("/levantar/")({ component: Page });

function templateHref(kind: string, id: string): { to: string; params?: { templateId: string } } {
  if (kind === "container_map") return { to: "/nueva" };
  if (kind === "chassis_map") return { to: "/chasis" };
  return { to: "/levantar/$templateId", params: { templateId: id } };
}

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
        {(q.data ?? []).filter((t) => t.active).map((t) => {
          const href = templateHref(t.kind, t.id);
          return (
            <li key={t.id}>
              <Link
                to={href.to as "/nueva" | "/chasis" | "/levantar/$templateId"}
                params={href.params as { templateId: string } | undefined}
                className="block rounded-lg border border-line bg-card p-5 shadow-card hover:border-teal/40"
              >
                <p className="text-[10px] uppercase text-steel">{t.category}</p>
                <h2 className="font-display text-2xl text-navy">{t.name}</h2>
                <p className="text-sm text-steel">{t.description}</p>
                <p className="mt-3 text-sm font-medium text-teal-dark">{can ? "Comenzar" : "Solo lectura"}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
