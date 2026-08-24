import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { TEMPLATE_CATEGORIES } from "@/lib/engine-catalog";
import { listTemplates, saveTemplate } from "@/lib/server/engine";
import { getSession } from "@/lib/server/tenant";
import { canManageTemplates } from "@/lib/roles";

export const Route = createFileRoute("/plantillas/")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const q = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Otro");
  const admin = session.data?.membership ? canManageTemplates(session.data.membership.role) : false;

  async function create(e: FormEvent) {
    e.preventDefault();
    const r = await saveTemplate({ data: { name, description, category, kind: "form", scoringEnabled: true } });
    toast.success("Plantilla creada");
    setOpen(false);
    setName("");
    setDescription("");
    void qc.invalidateQueries({ queryKey: ["templates"] });
    window.location.assign(`/plantillas/${r.id}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Constructor</p>
          <h1 className="font-display text-4xl text-navy">Plantillas de inspección</h1>
          <p className="mt-1 max-w-xl text-sm text-steel">
            Cada empresa arma sus propios formularios. El motor es el mismo: campos, evidencias, incidencias y puntaje.
          </p>
        </div>
        {admin ? (
          <Button variant="navy" onClick={() => setOpen((v) => !v)}>
            Nueva plantilla
          </Button>
        ) : null}
      </div>
      {open ? (
        <form onSubmit={(e) => void create(e)} className="grid gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-2">
          <Field label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Categoría">
            <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <div className="md:col-span-2">
            <Field label="Descripción">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
          <Button type="submit">Crear y diseñar</Button>
        </form>
      ) : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {(q.data ?? []).map((t) => (
          <li key={t.id} className="rounded-lg border border-line bg-card p-5 shadow-card">
            <p className="text-[10px] uppercase text-steel">{t.category}</p>
            <h2 className="font-display text-2xl text-navy">{t.name}</h2>
            <p className="text-sm text-steel">{t.description}</p>
            <p className="mt-2 text-xs text-steel">
              {t.kind === "container_map" ? "Mapa de unidad" : `${t.fieldCount} campos`}
              {t.scoringEnabled ? " · con puntuación" : ""}
            </p>
            <Link to="/plantillas/$id" params={{ id: t.id }} className="mt-3 inline-block text-sm text-teal-dark">
              {admin ? "Diseñar" : "Ver"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
