import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/protected";
import { Badge } from "@/components/ui/badge";
import { listAllIncidents } from "@/lib/server/engine";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/incidencias")({ component: Page });

function Page() {
  return (
    <Protected>
      <Lista />
    </Protected>
  );
}

function Lista() {
  const q = useQuery({ queryKey: ["all-incidents"], queryFn: () => listAllIncidents() });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Incidencias</h1>
      <p className="text-sm text-steel">Daño, falla, no conformidad, riesgo, defecto u observación — lo define cada empresa.</p>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {(q.data ?? []).length === 0 ? <li className="p-4 text-sm text-steel">Sin incidencias.</li> : null}
        {(q.data ?? []).map((i) => (
          <li key={i.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-navy">{i.title}</p>
              <p className="text-xs text-steel">
                {i.folio} · {i.typeName} · {formatDate(i.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={i.severity === "critica" || i.severity === "alta" ? "rust" : "warn"}>{i.severity}</Badge>
              <Link to="/registros/$id" params={{ id: i.recordId }} className="text-sm text-teal-dark">
                Folio
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
