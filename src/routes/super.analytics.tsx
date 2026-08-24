import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { getSuperDashboard, listSuperCompanies } from "@/lib/server/platform";

export const Route = createFileRoute("/super/analytics")({ component: Page });

function Page() {
  const d = useQuery({ queryKey: ["super-dash"], queryFn: () => getSuperDashboard() });
  const c = useQuery({ queryKey: ["super-companies"], queryFn: () => listSuperCompanies() });
  const dash = d.data;
  const usage = [...(dash?.companyUsage ?? [])].sort((a, b) => b.inspections - a.inspections);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-navy">Analytics global</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card k="Empresas" v={dash?.companies} />
        <Card k="Usuarios" v={dash?.users} />
        <Card k="Inspectores / miembros" v={dash?.usersActive} />
        <Card k="Inspecciones" v={dash?.inspections} />
        <Card k="Fotos" v={dash?.photos} />
        <Card k="Almacenamiento" v={dash ? `${(dash.storageBytes / 1024 / 1024).toFixed(1)} MB` : "—"} />
        <Card k="Inspecciones del mes" v={dash?.inspectionsMonth} />
        <Card k="Hoy" v={dash?.inspectionsToday} />
        <Card k="Con sesión" v={dash?.usersWithSession} />
      </div>
      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl text-navy">Empresas más activas</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {usage.map((x) => (
            <li key={x.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="flex items-center gap-2">
                {x.name} <Badge>{x.status}</Badge>
              </span>
              <span className="text-steel">
                {x.inspections} folios · {x.photos} fotos · {(x.storageBytes / 1024 / 1024).toFixed(1)} MB · {x.members} usuarios
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl text-navy">Planes</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {(c.data ?? []).map((x) => (
            <li key={x.id} className="flex justify-between py-2">
              <span>{x.name}</span>
              <span className="text-steel">
                {x.plan} · vence {x.periodEnd || "—"} · {x.members}/{x.maxUsers}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
function Card({ k, v }: { k: string; v?: number | string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <p className="text-[10px] uppercase text-steel">{k}</p>
      <p className="font-display text-3xl text-navy">{v ?? "—"}</p>
    </div>
  );
}
