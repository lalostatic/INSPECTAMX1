import { Camera, Check } from "lucide-react";
import { useState } from "react";
import {
  CHASSIS_VIEWS,
  chassisPointsForView,
  type ChassisPoint,
  type ChassisViewId,
  type ChassisLateralSide,
} from "@/lib/chassis-points";
import { cn } from "@/lib/utils";

export type ChassisCapture = {
  thumb?: string;
};

function capturedCount(view: ChassisViewId, captured: Record<string, ChassisCapture>) {
  return chassisPointsForView(view).filter((p) => captured[p.id]?.thumb).length;
}

export function ChassisMap({
  captured = {},
  selectedId,
  onPick,
  view: viewProp,
  onViewChange,
  initialView,
  side: sideProp,
  onSideChange,
}: {
  captured?: Record<string, ChassisCapture>;
  selectedId?: string;
  onPick: (point: ChassisPoint, side: ChassisLateralSide) => void;
  view?: ChassisViewId;
  onViewChange?: (view: ChassisViewId) => void;
  initialView?: ChassisViewId;
  side?: ChassisLateralSide;
  onSideChange?: (side: ChassisLateralSide) => void;
}) {
  const [inner, setInner] = useState<ChassisViewId>(viewProp ?? initialView ?? "frente");
  const [innerSide, setInnerSide] = useState<ChassisLateralSide>(sideProp ?? "derecho");
  const view = viewProp ?? inner;
  const side = sideProp ?? innerSide;
  const meta = CHASSIS_VIEWS.find((v) => v.id === view) ?? CHASSIS_VIEWS[0];
  const points = chassisPointsForView(view);

  function setView(next: ChassisViewId) {
    setInner(next);
    onViewChange?.(next);
  }

  function setSide(next: ChassisLateralSide) {
    setInnerSide(next);
    onSideChange?.(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-md bg-paper-2 p-1">
        {CHASSIS_VIEWS.map((v) => {
          const n = capturedCount(v.id, captured);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
                view === v.id ? "bg-card text-navy shadow-card" : "text-steel hover:text-navy",
              )}
            >
              {v.title}
              {n > 0 ? (
                <span className="text-[10px] font-semibold text-teal-dark">
                  {n} foto{n === 1 ? "" : "s"}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {view === "lateral" ? (
        <div className="flex gap-1 rounded-md border border-line bg-card p-1">
          {(["izquierdo", "derecho"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={cn(
                "min-h-11 flex-1 rounded-sm text-sm font-medium capitalize",
                side === s ? "bg-navy text-paper" : "text-steel hover:text-navy",
              )}
            >
              Lado {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-line bg-navy-deep">
        <div className="relative mx-auto w-full">
          <img src={meta.src} alt={meta.title} className="block h-auto w-full select-none" />
          {points.map((p) => {
            const cap = captured[p.id];
            const active = selectedId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p, side)}
                title={`${p.n}. ${p.label}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={cn(
                  "absolute z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center touch-manipulation",
                  active && "z-20",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-[11px] font-bold leading-none text-paper shadow-[0_0_0_2px_var(--color-card),0_2px_8px_rgba(8,21,31,0.45)]",
                    cap?.thumb ? "bg-teal" : "bg-rust",
                    active && "size-8 text-xs ring-2 ring-teal ring-offset-2 ring-offset-navy",
                  )}
                >
                  {cap?.thumb ? <Check className="size-3.5" strokeWidth={3} /> : p.n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {points.map((p) => {
          const cap = captured[p.id];
          const active = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p, side)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
                  active
                    ? "border-teal bg-teal-soft"
                    : cap?.thumb
                      ? "border-line bg-ok-soft/40 hover:border-teal/50"
                      : "border-line bg-card hover:border-teal/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-paper",
                    cap?.thumb ? "bg-teal" : "bg-rust",
                  )}
                >
                  {p.n}
                </span>
                {cap?.thumb ? (
                  <img src={cap.thumb} alt="" className="size-8 shrink-0 rounded-sm object-cover" />
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-dashed border-line text-steel">
                    <Camera className="size-3.5" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{p.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
