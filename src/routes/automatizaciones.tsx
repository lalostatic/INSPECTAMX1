import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { AUTOMATION_THENS, AUTOMATION_WHENS } from "@/lib/engine-catalog";
import { listAutomations, saveAutomation, toggleAutomation } from "@/lib/server/engine";

export const Route = createFileRoute("/automatizaciones")({ component: Page });

function Page() {
  return (
    <Protected>
      <Reglas />
    </Protected>
  );
}

function Reglas() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["autos"], queryFn: () => listAutomations() });
  const [name, setName] = useState("");
  const [whenEvent, setWhenEvent] = useState("incidencia_critica");
  const [thenAction, setThenAction] = useState("crear_tarea");

  async function create(e: FormEvent) {
    e.preventDefault();
    await saveAutomation({ data: { name, whenEvent, thenAction } });
    toast.success("Regla activa");
    setName("");
    void qc.invalidateQueries({ queryKey: ["autos"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Automatizaciones</h1>
        <p className="text-sm text-steel">Si ocurre X, el motor hace Y. WhatsApp se abre con el enlace de compartir (sin API de cobro).</p>
      </div>
      <form onSubmit={(e) => void create(e)} className="grid gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-3">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Cuando">
          <NativeSelect value={whenEvent} onChange={(e) => setWhenEvent(e.target.value)}>
            {AUTOMATION_WHENS.map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Entonces">
          <NativeSelect value={thenAction} onChange={(e) => setThenAction(e.target.value)}>
            {AUTOMATION_THENS.map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button type="submit">Crear regla</Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {(q.data ?? []).map((a) => (
          <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <span className="text-navy">{a.name}</span>
              <span className="text-steel">
                {" "}
                · {a.whenEvent} → {a.thenAction}
              </span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void toggleAutomation({ data: { id: a.id, active: !a.active } }).then(() => qc.invalidateQueries({ queryKey: ["autos"] }))
              }
            >
              {a.active ? "Activa" : "Pausada"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
