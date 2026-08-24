import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPlatformHealth, listPlatformSettings, savePlatformSetting } from "@/lib/server/platform";

export const Route = createFileRoute("/super/desarrollo")({ component: Page });

const FLAGS = [
  { key: "debug_mode", label: "Modo debug" },
  { key: "feature_live_folios", label: "Folios en vivo" },
  { key: "feature_telegram", label: "Compartir Telegram" },
];

const VERSIONS = [
  { v: "1.0.0", date: "2026-08-24", notes: "INSPECTAMX · superadmin, 3 patios demo, folios en vivo, consulta." },
  { v: "0.9.0", date: "2026-08-20", notes: "Mapa de inspección, SMTP por empresa, WhatsApp/Telegram sin API de cobro." },
];

function Page() {
  const qc = useQueryClient();
  const h = useQuery({ queryKey: ["health"], queryFn: () => getPlatformHealth() });
  const s = useQuery({ queryKey: ["psettings"], queryFn: () => listPlatformSettings() });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Desarrollo</h1>
        <p className="text-sm text-steel">Solo visible para desarrollo@inspectamx.com.</p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li className="rounded-lg border border-line bg-card p-3">Versión {h.data?.version}</li>
        <li className="rounded-lg border border-line bg-card p-3">Node {h.data?.node}</li>
        <li className="rounded-lg border border-line bg-card p-3">BD {h.data?.db}</li>
        <li className="rounded-lg border border-line bg-card p-3">Migraciones: carpeta migrations/ (solo agregan columnas)</li>
      </ul>
      <section>
        <h2 className="font-display text-2xl text-navy">Feature flags</h2>
        <ul className="mt-2 space-y-2">
          {FLAGS.map((f) => {
            const on = (s.data?.[f.key] ?? "1") !== "0";
            return (
              <li key={f.key} className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-2 text-sm">
                <span>{f.label}</span>
                <Button
                  size="sm"
                  variant={on ? "navy" : "secondary"}
                  onClick={() => {
                    void savePlatformSetting({ data: { key: f.key, value: on ? "0" : "1" } }).then(() => {
                      toast.success(on ? "Apagado" : "Encendido");
                      void qc.invalidateQueries({ queryKey: ["psettings"] });
                    });
                  }}
                >
                  {on ? "ON" : "OFF"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl text-navy">Versiones</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {VERSIONS.map((x) => (
            <li key={x.v} className="rounded-lg border border-line bg-card p-3">
              <p className="font-medium text-navy">
                {x.v} · {x.date}
              </p>
              <p className="text-steel">{x.notes}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
