import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, PaintBucket, Search, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/lib/catalog";
import { getSession } from "@/lib/server/tenant";
import { getYardStats } from "@/lib/server/stats";
import { getEngineDashboard, listTemplates } from "@/lib/server/engine";
import { canCreateInspection, canManageTemplates, canSeeModule, canViewLiveFolios, canWorkMr, canWorkPaint } from "@/lib/roles";
import { LiveFolios } from "@/components/live-folios";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Protected>
      <Dashboard />
    </Protected>
  );
}

function templateHref(kind: string, id: string): { to: string; params?: { templateId: string } } {
  if (kind === "container_map") return { to: "/nueva" };
  if (kind === "chassis_map") return { to: "/chasis" };
  return { to: "/levantar/$templateId", params: { templateId: id } };
}

function Dashboard() {
  const nav = useNavigate();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => getYardStats() });
  const engine = useQuery({ queryKey: ["engine-dash"], queryFn: () => getEngineDashboard(), refetchInterval: 5000 });
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates() });
  const m = session.data?.membership;
  const [q, setQ] = useState("");

  function lookup(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    void nav({ to: "/buscar", search: { q: q.trim() } });
  }

  if (!m) return null;
  const s = stats.data;
  const d = engine.data;
  const widgets = new Set(d?.widgets ?? ["inspecciones", "incidencias", "estados", "tareas", "score", "vivos"]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-steel">{m.orgName}</p>
        <h1 className="font-display text-4xl tracking-wide text-navy">Operación</h1>
        <p className="mt-1 max-w-2xl text-sm text-steel">
          Crea, ejecuta, supervisa y documenta cualquier proceso de inspección desde un solo lugar.
        </p>
      </div>

      <form onSubmit={lookup} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar folio, activo, incidencia…" />
        <Button type="submit" variant="navy">
          <Search />
          Buscar
        </Button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.has("inspecciones") ? <Stat label="Inspecciones" value={d?.records ?? 0} hint={`${d?.recordsToday ?? 0} hoy`} /> : null}
        {widgets.has("incidencias") ? <Stat label="Incidencias" value={d?.incidents ?? 0} /> : null}
        {widgets.has("tareas") ? <Stat label="Tareas abiertas" value={d?.tasksOpen ?? 0} /> : null}
        {widgets.has("score") ? <Stat label="Puntuación media" value={d?.avgScore ?? "—"} /> : null}
      </section>

      {widgets.has("estados") && (d?.byStatus.length ?? 0) > 0 ? (
        <section className="rounded-lg border border-line bg-card p-5 shadow-card">
          <h2 className="font-display text-2xl text-navy">Inspecciones por estado</h2>
          <ul className="mt-3 space-y-2">
            {(d?.byStatus ?? []).map((row) => (
              <li key={row.status} className="flex items-center gap-3 text-sm">
                <span className="w-28 capitalize text-steel">{row.status.replace("_", " ")}</span>
                <span className="h-2 flex-1 rounded-full bg-paper-2">
                  <span
                    className="block h-2 rounded-full bg-teal"
                    style={{ width: `${Math.min(100, row.c * 12)}%` }}
                  />
                </span>
                <span className="tabular-nums text-navy">{row.c}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {widgets.has("vivos") ? (
        <section className="rounded-lg border border-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-navy">Folios recientes</h2>
            <span className="text-xs text-ok">En vivo</span>
          </div>
          {(d?.live.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-steel">Aún no hay levantamientos de plantilla.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {(d?.live ?? []).map((r) => (
                <li key={r.id}>
                  <Link to="/registros/$id" params={{ id: r.id }} className="flex items-center justify-between py-2 hover:bg-paper">
                    <span>
                      <span className="font-mono text-sm">{r.folio}</span>
                      <span className="text-steel"> · {r.templateName}</span>
                    </span>
                    <Badge tone={r.score !== null && r.score < 70 ? "rust" : "ok"}>{r.scoreLabel || r.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {canViewLiveFolios(m.role) ? <LiveFolios /> : null}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl text-navy">Plantillas</h2>
          {canManageTemplates(m.role) ? (
            <Link to="/plantillas" className="text-sm text-teal-dark">
              Constructor
            </Link>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(templates.data ?? []).filter((t) => t.active).map((t) => {
            const href = templateHref(t.kind, t.id);
            return (
              <Link
                key={t.id}
                to={href.to as "/nueva" | "/chasis" | "/levantar/$templateId"}
                params={href.params as { templateId: string } | undefined}
                className="rounded-lg border border-line bg-card p-5 shadow-card hover:border-teal/40"
              >
                <p className="text-[10px] uppercase tracking-wider text-steel">{t.category}</p>
                <h3 className="font-display text-2xl text-navy">{t.name}</h3>
                <p className="mt-1 text-sm text-steel">{t.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-dark">
                  {canCreateInspection(m.role) ? "Levantar" : "Ver"}
                  <ChevronRight className="size-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {MODULES.filter((mod) => mod.key !== "inspeccion").map((mod) => {
          if (!m.modules[mod.key]) return null;
          const on = canSeeModule(m.role, mod.key);
          const href: "/mr/nuevo" | "/mr" | "/almacen/nuevo" | "/almacen" =
            mod.key === "mr" ? (canWorkMr(m.role) ? "/mr/nuevo" : "/mr") : canWorkPaint(m.role) ? "/almacen/nuevo" : "/almacen";
          const Icon = mod.key === "mr" ? Wrench : PaintBucket;
          return (
            <Link key={mod.key} to={href} className="group rounded-lg border border-line bg-card p-5 shadow-card hover:border-teal/40">
              <Icon className="size-5 text-teal" />
              <h2 className="mt-3 font-display text-2xl tracking-wide text-navy">{mod.label}</h2>
              <p className="mt-1 text-sm text-steel">{mod.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-dark">
                {on ? "Abrir" : "Consulta"}
                <ChevronRight className="size-4" />
              </span>
            </Link>
          );
        })}
      </section>

      {(s?.unknownOwnership ?? 0) > 0 ? (
        <p className="text-sm text-warn">{s?.unknownOwnership} unidades de patio sin merchant/carrier o sin etiqueta.</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wider text-steel">{label}</p>
      <p className="mt-1 font-display text-4xl tabular tracking-wide text-navy">{value}</p>
      {hint ? <p className="text-xs text-steel">{hint}</p> : null}
    </div>
  );
}
