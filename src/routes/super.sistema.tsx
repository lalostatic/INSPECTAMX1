import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getPlatformHealth, listPlatformErrors, listPlatformLogs, setErrorStatus } from "@/lib/server/platform";

export const Route = createFileRoute("/super/sistema")({ component: Sistema });

function Sistema() {
  const qc = useQueryClient();
  const health = useQuery({ queryKey: ["health"], queryFn: () => getPlatformHealth(), refetchInterval: 8000 });
  const logs = useQuery({ queryKey: ["plog"], queryFn: () => listPlatformLogs() });
  const errors = useQuery({ queryKey: ["perr"], queryFn: () => listPlatformErrors() });
  const h = health.data;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-navy">Estado y logs</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <Box k="Motor BD" v={h?.db ?? "—"} />
        <Box k="Uptime" v={h ? `${Math.floor(h.uptimeSec / 60)} min` : "—"} />
        <Box k="RAM" v={h ? `${h.rssMb} MB` : "—"} />
        <Box k="Versión" v={h?.version ?? "—"} />
      </div>
      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <h2 className="font-display text-2xl text-navy">Centro de errores</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {(errors.data ?? []).length === 0 ? <li className="py-2 text-steel">Sin errores registrados.</li> : null}
          {(errors.data ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <span>
                <span className="text-navy">{e.status}</span> · {e.message}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void setErrorStatus({ data: { id: e.id, status: "resuelto" } }).then(() => qc.invalidateQueries({ queryKey: ["perr"] }))}
              >
                Resolver
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <h2 className="font-display text-2xl text-navy">Logs</h2>
        <ul className="mt-3 max-h-80 space-y-1 overflow-auto font-mono text-xs text-steel">
          {(logs.data ?? []).map((l) => (
            <li key={l.id}>
              {l.at.slice(0, 19)} [{l.kind}] {l.message} {l.email}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
function Box({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <p className="text-[10px] uppercase text-steel">{k}</p>
      <p className="font-display text-2xl text-navy">{v}</p>
    </div>
  );
}
