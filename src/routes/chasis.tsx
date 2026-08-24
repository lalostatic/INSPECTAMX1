import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Trash2, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ChassisMap, type ChassisCapture } from "@/components/chassis-map";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { DAMAGES, NAVIERAS } from "@/lib/catalog";
import { CHASSIS_SIZES, chassisPointById, type ChassisPoint } from "@/lib/chassis-points";
import { compressImage } from "@/lib/compress-image";
import { createInspection } from "@/lib/server/inspections";

export const Route = createFileRoute("/chasis")({
  component: ChasisPage,
});

function ChasisPage() {
  return (
    <Protected>
      <ChasisForm />
    </Protected>
  );
}

type DraftFinding = {
  id: string;
  pointId: string;
  component: string;
  damage: string;
  ok: boolean;
  photos: { id: string; dataUrl: string; caption: string }[];
};

function ChasisForm() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [chassisNo, setChassisNo] = useState("");
  const [naviera, setNaviera] = useState("Hapag-Lloyd");
  const [size, setSize] = useState("40");
  const [findings, setFindings] = useState<DraftFinding[]>([]);
  const [busy, setBusy] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const camRef = useRef<HTMLInputElement>(null);
  const pendingPoint = useRef<ChassisPoint | null>(null);

  const sheet = findings.find((f) => f.id === sheetId) ?? null;
  const captured: Record<string, ChassisCapture> = Object.fromEntries(
    findings.map((f) => [
      f.pointId,
      {
        ok: f.ok || f.photos.length > 0,
        thumb: f.photos[0]?.dataUrl,
        note: f.damage,
      },
    ]),
  );

  function pickPoint(point: ChassisPoint) {
    setSelectedId(point.id);
    const existing = findings.find((f) => f.pointId === point.id);
    if (existing) {
      setSheetId(existing.id);
      return;
    }
    // Abrir hoja: marcar OK o tomar foto
    const created: DraftFinding = {
      id: crypto.randomUUID(),
      pointId: point.id,
      component: point.label,
      damage: "",
      ok: false,
      photos: [],
    };
    setFindings((fs) => [...fs, created]);
    setSheetId(created.id);
  }

  function markOk(findingId: string) {
    setFindings((fs) =>
      fs.map((f) => (f.id === findingId ? { ...f, ok: true } : f)),
    );
    setSheetId(null);
  }

  function openCamera(point: ChassisPoint) {
    pendingPoint.current = point;
    camRef.current?.click();
  }

  async function onCamChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const point = pendingPoint.current;
    if (!file || !file.type.startsWith("image/") || !point) return;
    let dataUrl: string;
    try {
      dataUrl = await compressImage(file);
    } catch {
      toast.error("No se pudo leer la foto");
      return;
    }
    const photo = {
      id: crypto.randomUUID(),
      dataUrl,
      caption: point.label,
    };
    setFindings((fs) => {
      const existing = fs.find((f) => f.pointId === point.id);
      if (existing) {
        return fs.map((f) =>
          f.id === existing.id
            ? { ...f, ok: true, photos: [...f.photos, photo].slice(0, 6) }
            : f,
        );
      }
      return [
        ...fs,
        {
          id: crypto.randomUUID(),
          pointId: point.id,
          component: point.label,
          damage: "",
          ok: true,
          photos: [photo],
        },
      ];
    });
    const found = findings.find((f) => f.pointId === point.id);
    if (found) setSheetId(found.id);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (chassisNo.trim().length < 3) {
      toast.error("Capture el número de chasis");
      return;
    }
    const reviewed = findings.filter((f) => f.ok || f.photos.length > 0);
    if (reviewed.length === 0) {
      toast.error("Revise al menos un componente (OK o foto)");
      return;
    }
    setBusy(true);
    try {
      const res = await createInspection({
        data: {
          containerNo: chassisNo.trim().toUpperCase(),
          naviera,
          sizeCode: `${size}CH`,
          classCode: "F",
          ownership: "unknown",
          inspectionType: "Estado de chasis",
          locationName: "Patio",
          workOrder: "",
          notes: `Formato de estado de chasis · tamaño ${size}'`,
          missingLabel: false,
          findings: reviewed.map((f) => ({
            pointId: f.pointId,
            side: "",
            component: f.component,
            damage: f.damage || (f.ok && f.photos.length === 0 ? "OK" : ""),
            repair: "",
            locCode: "CHASIS",
            photos: f.photos.map((p) => ({ caption: p.caption, dataUrl: p.dataUrl })),
          })),
        },
      });
      await qc.invalidateQueries({ queryKey: ["inspections"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Estado de chasis registrado");
      await nav({ to: "/inspecciones/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mx-auto max-w-3xl space-y-6" onSubmit={(e) => void onSubmit(e)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-steel">Patio</p>
        <h1 className="font-display text-4xl tracking-wide text-navy">Estado de chasis</h1>
        <p className="mt-1 text-sm text-steel">
          Formato de intercambio de chasis. Toque un punto: marque OK o tome foto.
        </p>
      </div>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Chasis No.">
            <Input
              value={chassisNo}
              onChange={(e) => setChassisNo(e.target.value)}
              className="font-mono text-lg tracking-wider"
              autoCapitalize="characters"
              placeholder="Número de unidad"
              required
            />
          </Field>
          <Field label="Naviera / línea">
            <NativeSelect value={naviera} onChange={(e) => setNaviera(e.target.value)}>
              {NAVIERAS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Tamaño">
            <div className="flex flex-wrap gap-2">
              {CHASSIS_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={
                    size === s
                      ? "rounded-md bg-teal px-4 py-2 text-sm font-semibold text-paper"
                      : "rounded-md border border-line bg-card px-4 py-2 text-sm text-steel hover:border-teal/40"
                  }
                >
                  {s}'
                </button>
              ))}
            </div>
          </Field>
          <Field label="Fecha">
            <Input value={new Date().toLocaleDateString("es-MX")} readOnly className="text-steel" />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <h2 className="font-display text-xl tracking-wide text-navy">Mapa de puntos</h2>
        <p className="mt-1 mb-4 text-sm text-steel">
          Vista superior y elevación lateral · alineado al formato M&amp;R Mex.
        </p>
        <ChassisMap captured={captured} selectedId={selectedId} onPick={pickPoint} />
      </section>

      <div className="sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-lg border border-line bg-card/95 p-3 shadow-card backdrop-blur md:bottom-4">
        <div className="text-xs text-steel">
          {findings.filter((f) => f.ok || f.photos.length > 0).length} componente
          {findings.filter((f) => f.ok || f.photos.length > 0).length === 1 ? "" : "s"} revisado
          {findings.filter((f) => f.ok || f.photos.length > 0).length === 1 ? "" : "s"}
        </div>
        <Button type="submit" disabled={busy}>
          <Upload />
          {busy ? "Registrando…" : "Registrar"}
        </Button>
      </div>

      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void onCamChange(e)}
      />

      {sheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-navy-deep/50"
            aria-label="Cerrar"
            onClick={() => setSheetId(null)}
          />
          <div className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-card p-5 shadow-card sm:rounded-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel">
                  Punto {chassisPointById(sheet.pointId)?.n ?? ""}
                </p>
                <h3 className="font-display text-2xl tracking-wide text-navy">{sheet.component}</h3>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSheetId(null)} aria-label="Cerrar">
                <X />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => markOk(sheet.id)}
                className="flex flex-col items-center justify-center gap-1 rounded-md border border-line bg-paper py-6 text-teal-dark hover:border-teal"
              >
                <Check className="size-6" />
                <span className="text-sm font-medium">Marcar OK</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = chassisPointById(sheet.pointId);
                  if (p) openCamera(p);
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-paper py-6 text-steel hover:border-teal hover:text-teal-dark"
              >
                <Camera className="size-6" />
                <span className="text-sm font-medium">Tomar foto</span>
              </button>
            </div>

            {sheet.photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {sheet.photos.map((p) => (
                  <div key={p.id} className="relative">
                    <img src={p.dataUrl} alt="" className="aspect-[4/3] rounded-sm object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 grid size-7 place-items-center rounded-sm bg-navy/80 text-paper"
                      onClick={() =>
                        setFindings((fs) =>
                          fs.map((f) =>
                            f.id === sheet.id
                              ? { ...f, photos: f.photos.filter((x) => x.id !== p.id) }
                              : f,
                          ),
                        )
                      }
                      aria-label="Quitar foto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <Field label="Observación / daño (opcional)">
                <NativeSelect
                  value={sheet.damage}
                  onChange={(e) =>
                    setFindings((fs) =>
                      fs.map((f) => (f.id === sheet.id ? { ...f, damage: e.target.value } : f)),
                    )
                  }
                >
                  <option value="">Sin detalle</option>
                  {DAMAGES.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                className="text-rust"
                onClick={() => {
                  setFindings((fs) => fs.filter((f) => f.id !== sheet.id));
                  setSheetId(null);
                }}
              >
                <Trash2 />
                Quitar
              </Button>
              <Button onClick={() => setSheetId(null)}>Listo</Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
