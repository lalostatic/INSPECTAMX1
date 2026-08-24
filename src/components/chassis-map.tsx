import { Check, Camera } from "lucide-react";
import { useMemo, useState } from "react";
import { CHASSIS_GROUPS, CHASSIS_POINTS, type ChassisPoint } from "@/lib/chassis-points";
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

      <div className="overflow-hidden rounded-md border border-line bg-navy-deep p-3">
        <svg
          viewBox="0 0 100 70"
          className="mx-auto block h-auto w-full max-w-xl text-paper"
          aria-label="Diagrama de chasis"
        >
          <rect
            x="8"
            y="28"
            width="78"
            height="14"
            rx="2"
            fill="#1f8a96"
            opacity="0.35"
            stroke="#8fd0d8"
            strokeWidth="0.4"
          />
          <rect
            x="4"
            y="30"
            width="10"
            height="10"
            rx="1"
            fill="#0e2433"
            stroke="#8fd0d8"
            strokeWidth="0.3"
          />
          <circle cx="72" cy="22" r="5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="72" cy="48" r="5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="82" cy="22" r="5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <circle cx="82" cy="48" r="5" fill="none" stroke="#8fd0d8" strokeWidth="0.5" />
          <line x1="68" y1="35" x2="86" y2="35" stroke="#8fd0d8" strokeWidth="0.4" />
          {CHASSIS_POINTS.map((p) => {
            const cap = captured[p.id];
            const active = selectedId === p.id;
            const marked = Boolean(cap?.ok || cap?.thumb);
            return (
              <g key={p.id} onClick={() => onPick(p)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 2.4 : 1.8}
                  fill={marked ? "#1f8a96" : "#b54a3a"}
                  stroke={active ? "#f3f1ec" : "transparent"}
                  strokeWidth="0.4"
                />
                <title>{`${p.n}. ${p.label}`}</title>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-paper/60">
          Vista superior · frente a la izquierda
        </p>
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
                  <span className="text-[11px] text-steel">
                    {p.side === "centro" ? "Centro" : p.side === "izquierdo" ? "Izquierdo" : "Derecho"}
                  </span>
                </span>
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
