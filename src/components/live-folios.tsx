import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listLiveFolios } from "@/lib/server/inspections";
import { formatContainer } from "@/lib/iso6346";
import { formatDate } from "@/lib/utils";

/** Folios nuevos en vivo. Se refresca cada 4 s. Solo admin/oficina/supervisor. */
export function LiveFolios() {
  const q = useQuery({
    queryKey: ["live-folios"],
    queryFn: () => listLiveFolios(),
    refetchInterval: 4000,
  });
  const rows = q.data ?? [];
  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-steel">En vivo</p>
          <h2 className="font-display text-2xl text-navy">Folios recientes</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-ok">
          <span className="size-2 rounded-full bg-ok animate-pulse" />
          Actualizando
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-steel">Aún no hay inspecciones.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                to="/inspecciones/$id"
                params={{ id: r.id }}
                className="flex items-center justify-between gap-3 py-2 hover:bg-paper"
              >
                <span className="font-mono text-sm">{formatContainer(r.containerNo)}</span>
                <span className="text-xs text-steel">
                  {r.inspectorName} · {formatDate(r.inspectedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
