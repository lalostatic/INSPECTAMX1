import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { listPlatformSettings, savePlatformSetting } from "@/lib/server/platform";

export const Route = createFileRoute("/super/configuracion")({ component: Page });

const KEYS = [
  { key: "app_name", label: "Nombre" },
  { key: "domain", label: "Dominio" },
  { key: "timezone", label: "Zona horaria" },
  { key: "locale", label: "Idioma" },
];

function Page() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["psettings"], queryFn: () => listPlatformSettings() });
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    if (q.data) setVals(q.data);
  }, [q.data]);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Configuración global</h1>
      <p className="text-sm text-steel">
        Afecta a la plataforma. El SMTP y WhatsApp se configuran por empresa (nunca una cuenta global).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {KEYS.map((k) => (
          <Field key={k.key} label={k.label}>
            <Input
              value={vals[k.key] ?? ""}
              onChange={(e) => setVals({ ...vals, [k.key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <Button
        variant="navy"
        onClick={() => {
          void Promise.all(KEYS.map((k) => savePlatformSetting({ data: { key: k.key, value: vals[k.key] ?? "" } }))).then(
            () => {
              toast.success("Guardado");
              void qc.invalidateQueries({ queryKey: ["psettings"] });
            },
          );
        }}
      >
        Guardar
      </Button>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <Row k="Correo" v="SMTP por empresa (nunca global)" />
        <Row k="WhatsApp" v="wa.me (sin API de cobro)" />
        <Row k="Fotos" v="JPEG 1600 px · calidad 0.85" />
        <Row k="Sesiones" v="Better Auth · correo y contraseña" />
      </dl>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <dt className="text-[10px] uppercase text-steel">{k}</dt>
      <dd className="text-navy">{v}</dd>
    </div>
  );
}
