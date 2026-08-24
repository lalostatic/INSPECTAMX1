import { Check, Camera } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CHASSIS_GROUPS,
  CHASSIS_POINTS,
  sideLabel,
  type ChassisPoint,
} from "@/lib/chassis-points";
import { cn } from "@/lib/utils";

export type ChassisCapture = { ok?: boolean; thumb?: string; note?: string };

export function ChassisMap({
  captured = {},
  selectedId,
  onPick,
}: {
  captured?: Record<string, ChassisCapture>;
  selectedId?: string;
  onPick: (point: ChassisPoint) => void;
}) {
  const [group, setGroup] = useState<string>(CHASSIS_GROUPS[0]);
  const points = useMemo(
    () => CHASSIS_POINTS.filter((p) => p.group === group),
    [group],
  );
  const done = CHASSIS_POINTS.filter((p) => captured[p.id]?.ok || captured[p.id]?.thumb).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-steel">
          Formato de estado de chasis · {done}/{CHASSIS_POINTS.length} revisados
        </p>
      </div>

      {/* ── Vista superior (como el diagrama derecho del PDF) ── */}
      <div className="overflow-hidden rounded-md border border-line bg-navy-deep p-3">
        <p className="mb-1 text-center text-[10px] uppercase tracking-wider text-paper/55">
          Vista superior · frente a la izquierda
        </p>
        <svg
          viewBox="0 0 100 70"
          className="mx-auto block h-auto w-full max-w-xl"
          aria-label="Diagrama superior de chasis"
        >
          {/* Cuello de ganso */}
          <rect x="4" y="28" width="12" height="14" rx="1" fill="#0e2433" stroke="#8fd0d8" strokeWidth="0.35" />
          {/* Bastidor principal */}
          <rect x="14" y="26" width="72" height="18" rx="1.5" fill="#1f8a96" opacity="0.3" stroke="#8fd0d8" strokeWidth="0.4" />
          {/* Traviesas */}
          <line x1="28" y1="26" x2="28" y2="44" stroke="#8fd0d8" strokeWidth="0.3" opacity="0.6" />
          <line x1="42" y1="26" x2="42" y2="44" stroke="#8fd0d8" strokeWidth="0.3" opacity="0.6" />
          <line x1="56" y1="26" x2="56" y2="44" stroke="#8fd0d8" strokeWidth="0.3" opacity="0.6" />
          <line x1="70" y1="26" x2="70" y2="44" stroke="#8fd0d8" strokeWidth="0.3" opacity="0.6" />
          {/* Patines (landing gear) */}
          <rect x="24" y="18" width="6" height="8" rx="0.5" fill="none" stroke="#8fd0d8" strokeWidth="0.35" />
          <rect x="24" y="44" width="6" height="8" rx="0.5" fill="none" stroke="#8fd0d8" strokeWidth="0.35" />
          {/* Ejes / ruedas */}
          <circle cx="72" cy="16" r="5.5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="72" cy="54" r="5.5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="84" cy="16" r="5.5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="84" cy="54" r="5.5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <line x1="66" y1="35" x2="90" y2="35" stroke="#8fd0d8" strokeWidth="0.35" />
          {/* Defensa trasera */}
          <rect x="90" y="30" width="4" height="10" rx="0.5" fill="#0e2433" stroke="#8fd0d8" strokeWidth="0.3" />

          {CHASSIS_POINTS.map((p) => {
            const cap = captured[p.id];
            const active = selectedId === p.id;
            const marked = Boolean(cap?.ok || cap?.thumb);
            return (
              <g key={p.id} onClick={() => onPick(p)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 2.6 : 1.9}
                  fill={marked ? "#1f8a96" : "#b54a3a"}
                  stroke={active ? "#f3f1ec" : "transparent"}
                  strokeWidth="0.45"
                />
                <title>{`${p.n}. ${p.label}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Elevación lateral (como el diagrama inferior del PDF) ── */}
      <div className="overflow-hidden rounded-md border border-line bg-navy-deep p-3">
        <p className="mb-1 text-center text-[10px] uppercase tracking-wider text-paper/55">
          Elevación lateral · sistema del carro de ejes
        </p>
        <svg
          viewBox="0 0 100 28"
          className="mx-auto block h-auto w-full max-w-xl"
          aria-label="Elevación lateral de chasis"
        >
          {/* Tirante longitudinal / viga */}
          <rect x="4" y="10" width="88" height="4" rx="0.8" fill="#1f8a96" opacity="0.45" stroke="#8fd0d8" strokeWidth="0.35" />
          {/* Cuello de ganso */}
          <path d="M4 12 L4 8 L12 8 L14 12" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          {/* Patín / landing gear */}
          <line x1="22" y1="14" x2="22" y2="22" stroke="#8fd0d8" strokeWidth="0.4" />
          <line x1="20" y1="22" x2="24" y2="22" stroke="#8fd0d8" strokeWidth="0.4" />
          {/* Ruedas delanteras del bogie */}
          <circle cx="68" cy="20" r="5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="68" cy="20" r="2" fill="#0e2433" stroke="#8fd0d8" strokeWidth="0.25" />
          {/* Ruedas traseras del bogie */}
          <circle cx="80" cy="20" r="5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="80" cy="20" r="2" fill="#0e2433" stroke="#8fd0d8" strokeWidth="0.25" />
          {/* Eje */}
          <line x1="63" y1="20" x2="85" y2="20" stroke="#8fd0d8" strokeWidth="0.3" />
          {/* Estribo / placa */}
          <rect x="90" y="12" width="5" height="6" rx="0.4" fill="none" stroke="#8fd0d8" strokeWidth="0.35" />

          {CHASSIS_POINTS.filter((p) => p.sx != null && p.sy != null).map((p) => {
            const cap = captured[p.id];
            const active = selectedId === p.id;
            const marked = Boolean(cap?.ok || cap?.thumb);
            return (
              <g key={`s-${p.id}`} onClick={() => onPick(p)} className="cursor-pointer">
                <circle
                  cx={p.sx!}
                  cy={p.sy! * 0.28}
                  r={active ? 1.8 : 1.3}
                  fill={marked ? "#1f8a96" : "#b54a3a"}
                  stroke={active ? "#f3f1ec" : "transparent"}
                  strokeWidth="0.35"
                />
                <title>{`${p.n}. ${p.label}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CHASSIS_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              group === g
                ? "bg-teal text-paper"
                : "bg-card text-steel ring-1 ring-line hover:bg-line/40",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line rounded-md border border-line bg-card">
        {points.map((p) => {
          const cap = captured[p.id];
          const marked = Boolean(cap?.ok || cap?.thumb);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-line/30",
                  selectedId === p.id && "bg-teal/10",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    marked ? "bg-teal text-paper" : "bg-rust/15 text-rust",
                  )}
                >
                  {marked ? <Check className="h-3.5 w-3.5" /> : p.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-navy">{p.label}</span>
                  <span className="text-[11px] text-steel">{sideLabel(p.side)}</span>
                </span>
                {cap?.ok && !cap?.thumb ? (
                  <span className="text-[11px] font-medium text-teal-dark">OK</span>
                ) : null}
                {cap?.thumb ? (
                  <img
                    src={cap.thumb}
                    alt=""
                    className="h-9 w-9 rounded object-cover ring-1 ring-line"
                  />
                ) : (
                  <Camera className="h-4 w-4 shrink-0 text-steel" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
