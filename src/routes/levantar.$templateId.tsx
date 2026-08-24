import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { EngineField } from "@/components/engine-field";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { INCIDENT_KINDS, SEVERITIES } from "@/lib/engine-catalog";
import { pushQueue } from "@/lib/offline-queue";
import { getTemplate, listAssets, listBranches, saveRecord } from "@/lib/server/engine";

export const Route = createFileRoute("/levantar/$templateId")({ component: Page });

function Page() {
  const { templateId } = Route.useParams();
  const nav = useNavigate();
  const tpl = useQuery({ queryKey: ["template", templateId], queryFn: () => getTemplate({ data: { id: templateId } }) });
  const assets = useQuery({ queryKey: ["assets"], queryFn: () => listAssets() });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => listBranches() });
  const t = tpl.data;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [assetId, setAssetId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [incTitle, setIncTitle] = useState("");
  const [incType, setIncType] = useState("Observación");
  const [incSev, setIncSev] = useState("media");
  const [incidents, setIncidents] = useState<{ typeName: string; severity: string; title: string; notes: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      () => setGps(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  if (!t) return <p className="text-steel">Cargando formulario…</p>;
  if (t.kind === "container_map") {
    void nav({ to: "/nueva" });
    return null;
  }

  async function send(submit: boolean) {
    if (!t) return;
    setBusy(true);
    const payload = {
      templateId,
      assetId,
      branchId,
      tags,
      notes,
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
      gpsAccuracy: gps?.acc ?? null,
      answers: t.fields.map((f) => ({
        fieldId: f.id,
        value: f.type === "gps" && gps ? `${gps.lat.toFixed(5)},${gps.lng.toFixed(5)}` : (answers[f.id] ?? ""),
      })),
      incidents,
      evidence: t.fields
        .filter((f) => ["photo", "signature", "video", "audio", "document"].includes(f.type) && (answers[f.id] ?? "").startsWith("data:"))
        .map((f) => ({ kind: f.type, dataUrl: answers[f.id], caption: f.label })),
      submit,
    };
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        pushQueue({ templateName: t.name, payload });
        toast.success("Guardada en el dispositivo. Se enviará al haber red.");
        return;
      }
      const r = await saveRecord({ data: payload });
      toast.success(submit ? `${r.folio} enviada · ${r.scoreLabel || "sin puntaje"}` : "Borrador");
      await nav({ to: "/registros/$id", params: { id: r.id } });
    } catch (err) {
      pushQueue({ templateName: t.name, payload });
      toast.error(err instanceof Error ? err.message : "Sin red · quedó en el teléfono");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mx-auto max-w-lg space-y-5"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void send(true);
      }}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-steel">{t.category}</p>
        <h1 className="font-display text-4xl text-navy">{t.name}</h1>
        {gps ? (
          <p className="mt-1 text-xs text-steel">
            GPS {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} · ±{Math.round(gps.acc)} m
          </p>
        ) : (
          <p className="mt-1 text-xs text-steel">GPS no disponible en este dispositivo</p>
        )}
      </div>

      {(branches.data ?? []).length > 0 ? (
        <Field label="Sucursal">
          <NativeSelect value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">—</option>
            {(branches.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}

      {(assets.data ?? []).length > 0 ? (
        <Field label="Activo">
          <NativeSelect value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            <option value="">—</option>
            {(assets.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}

      {t.fields.map((f) => (
        <EngineField key={f.id} field={f} value={answers[f.id] ?? ""} onChange={(v) => setAnswers((p) => ({ ...p, [f.id]: v }))} />
      ))}

      <Field label="Etiquetas">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="urgente, calidad, cliente" />
      </Field>
      <Field label="Notas">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <section className="rounded-lg border border-line bg-card p-4">
        <h2 className="font-medium text-navy">Incidencias</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {incidents.map((i, idx) => (
            <li key={idx}>
              {i.title} · {i.typeName} · {i.severity}
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2">
          <Input value={incTitle} onChange={(e) => setIncTitle(e.target.value)} placeholder="Título de la incidencia" />
          <div className="grid grid-cols-2 gap-2">
            <NativeSelect value={incType} onChange={(e) => setIncType(e.target.value)}>
              {INCIDENT_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </NativeSelect>
            <NativeSelect value={incSev} onChange={(e) => setIncSev(e.target.value)}>
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!incTitle.trim()) return;
              setIncidents((p) => [...p, { typeName: incType, severity: incSev, title: incTitle, notes: "" }]);
              setIncTitle("");
            }}
          >
            Agregar incidencia
          </Button>
        </div>
      </section>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void send(false)}>
          Borrador
        </Button>
        <Button type="submit" variant="navy" disabled={busy} className="flex-1">
          {busy ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </form>
  );
}
