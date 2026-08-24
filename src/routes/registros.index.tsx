import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { listRecords } from "@/lib/server/engine";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/registros/")({ component: Page });

function tone(status: string, score: number | null): "ok" | "warn" | "rust" | "steel" | "teal" {
  if (status === "aprobado" || status === "cerrado") return "ok";
  if (status === "rechazado") return "rust";
  if (score !== null && score < 70) return "rust";
  if (status === "revision" || status === "correccion") return "warn";
  if (status === "en_proceso") return "teal";
  return "steel";
}

function Page() {
  const q = useQuery({ queryKey: ["records"], queryFn: () => listRecords(), refetchInterval: 4000 });
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl text-navy">Folios</h1>
          <p className="text-sm text-steel">Levantamientos de las plantillas de esta empresa.</p>
        </div>
        <Link to="/inspecciones" className="text-sm text-teal-dark">
          Folios de mapa
        </Link>
      </div>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {(q.data ?? []).length === 0 ? <li className="p-4 text-sm text-steel">Sin folios todavía.</li> : null}
        {(q.data ?? []).map((r) => (
          <li key={r.id}>
            <Link to="/registros/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper">
              <div>
                <p className="font-mono text-sm">{r.folio}</p>
                <p className="text-xs text-steel">
                  {r.templateName} · {r.inspectorName} · {formatDate(r.createdAt)}
                  {r.tags ? ` · #${r.tags}` : ""}
                </p>
              </div>
              <Badge tone={tone(r.status, r.score)}>{r.scoreLabel || r.status}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
