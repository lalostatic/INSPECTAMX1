import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSuperDashboard } from "@/lib/server/platform";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/super/")({ component: SuperHome });

function SuperHome() {
  const q = useQuery({
    queryKey: ["super-dash"],
    queryFn: () => getSuperDashboard(),
    refetchInterval: 5000,
  });
  const d = q.data;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Plataforma</p>
        <h1 className="font-display text-4xl text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-steel">Métricas de todos los patios. Se actualiza cada 5 s.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Empresas" value={d?.companies} />
        <Stat label="Activas" value={d?.active} tone="ok" />
        <Stat label="Suspendidas / vencidas" value={d?.suspended} />
        <Stat label="Prueba" value={d?.trial} />
        <Stat label="Usuarios" value={d?.users} />
        <Stat label="Usuarios activos" value={d?.usersActive} />
        <Stat label="Con sesión" value={d?.usersWithSession} />
        <Stat label="Inspecciones" value={d?.inspections} />
        <Stat label="Hoy" value={d?.inspectionsToday} />
        <Stat label="Este mes" value={d?.inspectionsMonth} />
        <Stat label="Fotografías" value={d?.photos} />
        <Stat label="Almacenamiento" value={d ? `${(d.storageBytes / 1024 / 1024).toFixed(1)} MB` : "—"} />
        <Stat label="Errores abiertos" value={d?.errorsOpen} />
        <Stat label="Tickets abiertos" value={d?.ticketsOpen} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Pill ok={d?.dbOk} label="Base de datos" />
        <Pill ok label="API · operativa" />
        <Pill ok label={`Servidor · ${d ? Math.floor((d.uptimeSec || 0) / 60) : "—"} min · ${d?.memoryMb ?? "—"} MB`} />
      </div>
      {(d?.errorsOpen || 0) > 0 || (d?.ticketsOpen || 0) > 0 || (d?.suspended || 0) > 0 ? (
        <section className="rounded-lg border border-warn bg-warn-soft/40 p-4 text-sm">
          <p className="font-medium text-navy">Alertas</p>
          <ul className="mt-1 list-disc pl-5 text-steel">
            {(d?.errorsOpen || 0) > 0 ? <li>{d?.errorsOpen} errores sin resolver</li> : null}
            {(d?.ticketsOpen || 0) > 0 ? <li>{d?.ticketsOpen} tickets de soporte abiertos</li> : null}
            {(d?.suspended || 0) > 0 ? <li>{d?.suspended} empresas suspendidas, bloqueadas o vencidas</li> : null}
          </ul>
        </section>
      ) : null}
      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-navy">Folios en vivo (todas las empresas)</h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-ok">
            <span className="size-2 rounded-full bg-ok animate-pulse" />
            5 s
          </span>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {(d?.liveFolios ?? []).length === 0 ? (
            <li className="py-2 text-sm text-steel">Sin folios todavía.</li>
          ) : (
            (d?.liveFolios ?? []).map((f) => (
              <li key={f.id + f.orgName} className="flex justify-between py-2 text-sm">
                <span>
                  <span className="font-mono">{f.containerNo}</span>
                  <span className="text-steel"> · {f.orgName}</span>
                </span>
                <span className="text-xs text-steel">{f.inspectorName}</span>
              </li>
            ))
          )}
        </ul>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-line bg-card p-5 shadow-card">
          <h2 className="font-display text-2xl text-navy">Últimas empresas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(d?.recentCompanies ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <Link to="/super/empresas" className="text-teal-dark">
                  {c.name}
                </Link>
                <Status s={c.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-line bg-card p-5 shadow-card">
          <h2 className="font-display text-2xl text-navy">Actividad reciente</h2>
          <ul className="mt-3 space-y-2 text-sm text-steel">
            {(d?.recentLogs ?? []).length === 0 ? <li>Sin eventos.</li> : null}
            {(d?.recentLogs ?? []).map((l) => (
              <li key={l.id}>
                <span className="text-navy">{l.kind}</span> · {l.message}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Status({ s }: { s: string }) {
  const tone =
    s === "activa" ? "ok" : s === "prueba" ? "teal" : s === "por_vencer" ? "warn" : s === "vencida" || s === "bloqueada" ? "rust" : "steel";
  return <Badge tone={tone}>{s}</Badge>;
}

function Stat({ label, value, tone }: { label: string; value?: number | string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-card">
      <p className="text-[10px] uppercase tracking-wider text-steel">{label}</p>
      <p className={`font-display text-3xl ${tone === "ok" ? "text-ok" : "text-navy"}`}>{value ?? "—"}</p>
    </div>
  );
}

function Pill({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-4 py-3 text-sm">
      <span className={ok ? "text-ok" : "text-rust"}>●</span> {label}
    </div>
  );
}
