import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { archiveInspection, getInspection } from "@/lib/server/inspections";
import { getSession } from "@/lib/server/tenant";
import { inspectionShareText, telegramShareUrl, whatsappShareUrl } from "@/lib/share";
import { pointById, withLateralSide, type LateralSide } from "@/lib/inspect-points";
import { formatContainer } from "@/lib/iso6346";
import { canArchiveInspection } from "@/lib/roles";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/inspecciones/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const q = useQuery({ queryKey: ["inspection", id], queryFn: () => getInspection({ data: { id } }) });
  const d = q.data;
  if (q.isPending) return <p className="text-sm text-steel">Cargando…</p>;
  if (!d) return <p className="text-sm text-steel">Folio no encontrado.</p>;

  const share = inspectionShareText({
    containerNo: formatContainer(d.containerNo),
    inspectorName: d.inspectorName,
    inspectedAt: formatDate(d.inspectedAt),
    damage: d.primaryDamage,
  });
  const role = session.data?.membership?.role;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-steel">Inspección</p>
        <h1 className="font-display text-4xl tracking-wide text-navy">{formatContainer(d.containerNo)}</h1>
        <p className="mt-1 text-sm text-steel">
          {d.sizeCode} · clase {d.classCode} · {d.naviera} · {d.inspectorName} · {formatDate(d.inspectedAt)}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={d.ownership === "unknown" ? "warn" : "teal"}>
            {d.ownership === "unknown" ? "No indica merchant/carrier" : d.ownership}
          </Badge>
          {d.missingLabel ? <Badge tone="warn">Sin etiqueta</Badge> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={whatsappShareUrl(share)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-sm border border-line bg-card px-3 text-sm"
          >
            WhatsApp
          </a>
          <a
            href={telegramShareUrl(share)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-sm border border-line bg-card px-3 text-sm"
          >
            Telegram
          </a>
          {role && canArchiveInspection(role) ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void archiveInspection({ data: { id } })
                  .then(() => {
                    toast.success("Folio archivado. Se recupera en Configuración.");
                    void qc.invalidateQueries({ queryKey: ["inspections"] });
                    void nav({ to: "/inspecciones" });
                  })
                  .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo archivar"));
              }}
            >
              Archivar
            </Button>
          ) : null}
        </div>
        <Link to="/unidad/$no" params={{ no: d.containerNo }} className="mt-2 inline-block text-sm text-teal-dark">
          Ver unidad
        </Link>
      </div>
      {d.findings.map((f) => {
        const point = f.pointId ? pointById(f.pointId) : undefined;
        const title = point
          ? `${point.n}. ${f.side ? withLateralSide(point, f.side as LateralSide).label : point.label}`
          : f.component || "Hallazgo";
        return (
          <section key={f.id} className="rounded-lg border border-line bg-card p-4 shadow-card">
            <p className="font-medium text-navy">{title}</p>
            <p className="text-sm text-steel">
              {f.damage || "Sin detalle de daño"}
              {f.locCode ? ` · ${f.locCode}` : ""}
            </p>
            {f.photos.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {f.photos.map((p) => (
                  <img key={p.id} src={p.dataUrl} alt={p.caption} className="aspect-[4/3] rounded-sm object-cover" />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
      {d.notes ? <p className="text-sm text-steel">{d.notes}</p> : null}
    </div>
  );
}
