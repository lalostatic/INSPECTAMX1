import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ChassisMap } from "@/components/chassis-map";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { DAMAGES, NAVIERAS } from "@/lib/catalog";
import {
  CHASSIS_SIZES,
  chassisPointById,
  type ChassisLateralSide,
  type ChassisPoint,
  type ChassisViewId,
} from "@/lib/chassis-points";
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

type DraftPhoto = { id: string; dataUrl: string; caption: string };
type DraftFinding = {
  id: string;
  pointId: string;
  side: string;
  component: string;
  damage: string;
  photos: DraftPhoto[];
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
  const [mapView, setMapView] = useState<ChassisViewId>("frente");
  const [lateralSide, setLateralSide] = useState<ChassisLateralSide>("derecho");
  const camRef = useRef<HTMLInputElement>(null);
  const pendingPoint = useRef<ChassisPoint | null>(null);

  const sheet = findings.find((f) => f.id === sheetId) ?? null;
  const captured = Object.fromEntries(
    findings
      .filter((f) => f.pointId && f.photos[0])
      .map((f) => [f.pointId, { thumb: f.photos[0].dataUrl }]),
  );

  function openCamera(point: ChassisPoint) {
    pendingPoint.current = point;
    setMapView(point.view);
    camRef.current?.click();
  }

  function pickPoint(point: ChassisPoint, side: ChassisLateralSide) {
    setLateralSide(side);
    const existing = findings.find((f) => f.pointId === point.id);
    if (existing) {
      setSheetId(existing.id);
      setMapView(point.view);
      return;
    }
    openCamera(point);
  }

  async function onCamChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const point = pendingPoint.current;
    if (!file || !file.type.startsWith("image/")) return;
    let dataUrl: string;
    try {
      dataUrl = await compressImage(file);
    } catch {
      toast.error("No se pudo leer la foto");
      return;
    }
    const photo: DraftPhoto = {
      id: crypto.randomUUID(),
      dataUrl,
      caption: point?.label ?? "",
    };
    if (!point) {
      if (sheetId) {
        setFindings((fs) =>
          fs.map((f) => (f.id === sheetId ? { ...f, photos: [...f.photos, photo].slice(0, 8) } : f)),
        );
      }
      return;
    }
    const existing = findings.find((f) => f.pointId === point.id);
    if (existing) {
      setFindings((fs) =>
        fs.map((f) =>
          f.id === existing.id
            ? { ...f, photos: [...f.photos, { ...photo, caption: point.label }].slice(0, 8) }
            : f,
        ),
      );
      setSheetId(existing.id);
    } else {
      const created: DraftFinding = {
        id: crypto.randomUUID(),
        pointId: point.id,
        side: point.view === "lateral" ? lateralSide : "",
        component: point.component,
        damage: "",
        photos: [photo],
      };
      setFindings((fs) => [...fs, created]);
      setSheetId(created.id);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (chassisNo.trim().length < 3) {
      toast.error("Capture el número de chasis");
      return;
    }
    if (findings.length === 0) {
      toast.error("Tome al menos una foto en el mapa");
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
          findings: findings.map((f) => ({
            pointId: f.pointId,
            side: f.side,
            component: f.component,
            damage: f.damage,
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
          Número de la unidad. Toque un punto en la imagen para fotografiar.
        </p>
      </div>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Chasis No." hint="Número de unidad">
            <Input
              value={chassisNo}
              onChange={(e) => setChassisNo(e.target.value)}
              className="font-mono text-lg tracking-wider"
              autoCapitalize="characters"
              placeholder="Número de chasis"
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
          Frente, superior, lateral y trasera. Toque un punto para abrir la cámara.
        </p>
        <ChassisMap
          captured={captured}
          selectedId={sheet?.pointId}
          view={mapView}
          onViewChange={setMapView}
          side={lateralSide}
          onSideChange={setLateralSide}
          onPick={pickPoint}
        />
      </section>

      {findings.length > 0 ? (
        <section className="space-y-2">
          {findings.map((f) => {
            const point = f.pointId ? chassisPointById(f.pointId) : undefined;
            const title = point ? `${point.n}. ${point.label}` : f.component;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSheetId(f.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-line bg-card p-3 text-left shadow-card hover:border-teal/40"
              >
                {f.photos[0] ? (
                  <img src={f.photos[0].dataUrl} alt="" className="size-14 shrink-0 rounded-sm object-cover" />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-navy">{title}</span>
                  <span className="text-xs text-steel">{f.damage || "Sin detalle de daño"}</span>
                </span>
              </button>
            );
          })}
        </section>
      ) : null}

      <div className="sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-lg border border-line bg-card/95 p-3 shadow-card backdrop-blur md:bottom-4">
        <div className="text-xs text-steel">
          {findings.length} foto{findings.length === 1 ? "" : "s"}
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
        <PointSheet
          finding={sheet}
          onPatch={(patch) => setFindings((fs) => fs.map((f) => (f.id === sheet.id ? { ...f, ...patch } : f)))}
          onCamera={() => {
            const point = sheet.pointId ? chassisPointById(sheet.pointId) : undefined;
            if (point) openCamera(point);
            else {
              pendingPoint.current = null;
              camRef.current?.click();
            }
          }}
          onRemove={() => {
            setFindings((fs) => fs.filter((f) => f.id !== sheet.id));
            setSheetId(null);
          }}
          onClose={() => setSheetId(null)}
        />
      ) : null}
    </form>
  );
}

function PointSheet({
  finding,
  onPatch,
  onCamera,
  onRemove,
  onClose,
}: {
  finding: DraftFinding;
  onPatch: (p: Partial<DraftFinding>) => void;
  onCamera: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const point = finding.pointId ? chassisPointById(finding.pointId) : undefined;
  const title = point ? point.label : finding.component;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-navy-deep/50" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-card p-5 shadow-card sm:rounded-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel">
              {point ? `Punto ${point.n}` : "Foto"}
            </p>
            <h3 className="font-display text-2xl tracking-wide text-navy">{title}</h3>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar">
            <X />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {finding.photos.map((p) => (
            <div key={p.id} className="relative">
              <img src={p.dataUrl} alt="" className="aspect-[4/3] rounded-sm object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 grid size-7 place-items-center rounded-sm bg-navy/80 text-paper"
                onClick={() => onPatch({ photos: finding.photos.filter((x) => x.id !== p.id) })}
                aria-label="Quitar foto"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {finding.photos.length < 8 ? (
            <button
              type="button"
              onClick={onCamera}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-paper text-steel hover:border-teal hover:text-teal-dark"
            >
              <Camera className="size-5" />
              <span className="text-[11px] font-medium">Cámara</span>
            </button>
          ) : null}
        </div>

        <div className="mt-4">
          <Field label="Daño / observación (opcional)">
            <NativeSelect value={finding.damage} onChange={(e) => onPatch({ damage: e.target.value })}>
              <option value="">Sin detalle</option>
              {DAMAGES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" className="text-rust" onClick={onRemove}>
            <Trash2 />
            Quitar
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </div>
      </div>
    </div>
  );
}
