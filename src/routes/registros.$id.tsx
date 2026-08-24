import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { telegramShareUrl, whatsappShareUrl } from "@/lib/share";
import { addRecordIncident, getRecord, getTemplate, setRecordStatus } from "@/lib/server/engine";
import { getSession } from "@/lib/server/tenant";
import { canAssignWork } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { INCIDENT_KINDS, SEVERITIES } from "@/lib/engine-catalog";

export const Route = createFileRoute("/registros/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const q = useQuery({ queryKey: ["record", id], queryFn: () => getRecord({ data: { id } }) });
  const r = q.data;
  const tpl = useQuery({
    queryKey: ["template", r?.templateId],
    queryFn: () => getTemplate({ data: { id: r!.templateId } }),
    enabled: Boolean(r?.templateId),
  });
  const [title, setTitle] = useState("");
  const [typeName, setTypeName] = useState("Observación");
  const [severity, setSeverity] = useState("media");
  if (!r) return <p className="text-steel">Cargando folio…</p>;
  const share = [
    `INSPECTAMX ${r.folio}`,
    r.templateName,
    r.inspectorName,
    r.scoreLabel ? `Puntaje ${r.score} · ${r.scoreLabel}` : "",
    r.lat && r.lng ? `GPS ${r.lat}, ${r.lng}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const admin = session.data?.membership ? canAssignWork(session.data.membership.role) : false;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="print:pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">{r.templateName}</p>
        <h1 className="font-display text-4xl text-navy">{r.folio}</h1>
        <p className="text-sm text-steel">
          {r.inspectorName} · {formatDate(r.createdAt)}
          {r.assetCode ? ` · ${r.assetCode}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{r.statusLabel}</Badge>
          {r.score !== null ? <Badge tone={r.score < 70 ? "rust" : "ok"}>{r.score}% {r.scoreLabel}</Badge> : null}
          {r.tags
            ? r.tags.split(",").map((t) => (
                <Badge key={t} tone="teal">
                  #{t.trim()}
                </Badge>
              ))
            : null}
        </div>
      </header>

      {r.lat && r.lng ? (
        <p className="text-sm text-steel">
          Dónde se realizó: {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
          {r.gpsAccuracy ? ` · ±${Math.round(r.gpsAccuracy)} m` : ""}
        </p>
      ) : null}

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl text-navy">Resultados</h2>
        <dl className="mt-3 divide-y divide-line">
          {r.answers.map((a) => (
            <div key={a.fieldId} className="flex justify-between gap-3 py-2 text-sm">
              <dt className="text-steel">{a.label}</dt>
              <dd className="max-w-[60%] text-right text-navy">
                {a.value.startsWith("data:image") ? <img src={a.value} alt="" className="ml-auto max-h-24 rounded-sm" /> : a.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl text-navy">Incidencias</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {r.incidents.length === 0 ? <li className="text-steel">Sin incidencias.</li> : null}
          {r.incidents.map((i) => (
            <li key={i.id}>
              <span className="font-medium text-navy">{i.title}</span>
              <span className="text-steel">
                {" "}
                · {i.typeName} · {i.severity}
              </span>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void addRecordIncident({ data: { recordId: id, typeName, severity, title, notes: "" } }).then(() => {
              toast.success("Incidencia");
              setTitle("");
              void qc.invalidateQueries({ queryKey: ["record", id] });
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nueva incidencia" required />
          <div className="grid grid-cols-2 gap-2">
            <NativeSelect value={typeName} onChange={(e) => setTypeName(e.target.value)}>
              {INCIDENT_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </NativeSelect>
            <NativeSelect value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" variant="secondary">
            Registrar incidencia
          </Button>
        </form>
      </section>

      {r.evidence.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl text-navy">Evidencias</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {r.evidence.map((e) =>
              e.dataUrl.startsWith("data:image") ? (
                <img key={e.id} src={e.dataUrl} alt={e.caption} className="rounded-md border border-line" />
              ) : (
                <p key={e.id} className="text-sm">
                  {e.kind} · {e.caption}
                </p>
              ),
            )}
          </div>
        </section>
      ) : null}

      {admin && tpl.data ? (
        <Field label="Estado">
          <NativeSelect
            value={r.status}
            onChange={(e) => {
              void setRecordStatus({ data: { id, status: e.target.value } }).then(() => {
                toast.success("Estado actualizado");
                void qc.invalidateQueries({ queryKey: ["record", id] });
              });
            }}
          >
            {tpl.data.statuses.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl text-navy">Historial</h2>
        <ul className="mt-3 space-y-1 text-sm text-steel">
          {r.events.map((e) => (
            <li key={e.id}>
              {formatDate(e.at)} · {e.actor} · {e.message}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2 no-print">
        <a className="text-sm text-teal-dark underline" href={whatsappShareUrl(share)} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a className="text-sm text-teal-dark underline" href={telegramShareUrl(share)} target="_blank" rel="noreferrer">
          Telegram
        </a>
        <button type="button" className="text-sm text-teal-dark underline" onClick={() => window.print()}>
          PDF / imprimir
        </button>
        <Link to="/registros" className="text-sm text-steel">
          Volver
        </Link>
      </div>
    </article>
  );
}
