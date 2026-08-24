import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { DEFAULT_STATUSES, FIELD_TYPES, type FieldType } from "@/lib/engine-catalog";
import { getTemplate, saveTemplate, saveTemplateFields, saveTemplateStatuses, type TemplateField, type TemplateStatus } from "@/lib/server/engine";
import { getSession } from "@/lib/server/tenant";
import { canManageTemplates } from "@/lib/roles";

export const Route = createFileRoute("/plantillas/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const q = useQuery({ queryKey: ["template", id], queryFn: () => getTemplate({ data: { id } }) });
  const t = q.data;
  const admin = session.data?.membership ? canManageTemplates(session.data.membership.role) : false;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [statuses, setStatuses] = useState<TemplateStatus[]>([]);
  const [loaded, setLoaded] = useState("");

  useEffect(() => {
    if (!t || loaded === t.id) return;
    setName(t.name);
    setDescription(t.description);
    setFields(t.fields);
    setStatuses(t.statuses.length ? t.statuses : DEFAULT_STATUSES.map((s, i) => ({
      id: crypto.randomUUID(),
      key: s.key,
      label: s.label,
      color: s.color,
      sortOrder: i,
      isInitial: Boolean(s.initial),
      isFinal: Boolean(s.final),
    })));
    setLoaded(t.id);
  }, [t, loaded]);

  if (!t) return <p className="text-steel">Cargando plantilla…</p>;

  function addField(type: FieldType) {
    setFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sortOrder: prev.length,
        type,
        label: FIELD_TYPES.find((f) => f.type === type)?.label ?? type,
        required: false,
        options: type === "select" ? "OK|Falla" : "",
        weight: 0,
        help: "",
      },
    ]);
  }

  function move(i: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return next.map((f, idx) => ({ ...f, sortOrder: idx }));
    });
  }

  async function save() {
    if (!t) return;
    await saveTemplate({
      data: { id, name, description, category: t.category, kind: t.kind as "form" | "container_map", scoringEnabled: t.scoringEnabled },
    });
    await saveTemplateFields({
      data: {
        templateId: id,
        fields: fields.map((f, i) => ({ ...f, sortOrder: i })),
      },
    });
    await saveTemplateStatuses({
      data: {
        templateId: id,
        statuses: statuses.map((s, i) => ({ ...s, sortOrder: i })),
      },
    });
    toast.success("Plantilla guardada");
    void qc.invalidateQueries({ queryKey: ["template", id] });
    void qc.invalidateQueries({ queryKey: ["templates"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-steel">{t.category}</p>
        {admin ? (
          <Input className="font-display text-3xl" value={name} onChange={(e) => setName(e.target.value)} />
        ) : (
          <h1 className="font-display text-4xl text-navy">{t.name}</h1>
        )}
        <Input className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!admin} />
      </div>

      {t.kind === "container_map" ? (
        <p className="rounded-lg border border-line bg-card p-4 text-sm text-steel">
          Esta plantilla usa el mapa de contenedor (puertas, interior, laterales). El levantamiento se hace en Inspección de patio.
        </p>
      ) : (
        <>
          {admin ? (
            <section>
              <p className="text-xs uppercase tracking-wider text-steel">Agregar campo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FIELD_TYPES.map((f) => (
                  <button
                    key={f.type}
                    type="button"
                    onClick={() => addField(f.type)}
                    className="rounded-sm border border-line bg-card px-3 py-2 text-sm hover:border-teal"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <ol className="space-y-3">
            {fields.map((f, i) => (
              <li key={f.id} className="rounded-lg border border-line bg-card p-4">
                <div className="grid gap-2 md:grid-cols-4">
                  <Field label="Etiqueta">
                    <Input value={f.label} disabled={!admin} onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)))} />
                  </Field>
                  <Field label="Tipo">
                    <p className="flex h-11 items-center text-sm">{FIELD_TYPES.find((x) => x.type === f.type)?.label}</p>
                  </Field>
                  <Field label="Peso (puntaje)">
                    <Input
                      type="number"
                      value={f.weight}
                      disabled={!admin}
                      onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, weight: Number(e.target.value) || 0 } : x)))}
                    />
                  </Field>
                  <Field label=" ">
                    <label className="flex h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.required}
                        disabled={!admin}
                        onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, required: e.target.checked } : x)))}
                      />
                      Obligatorio
                    </label>
                  </Field>
                </div>
                {f.type === "select" ? (
                  <Field label="Opciones (separe con |)">
                    <Input
                      className="mt-2"
                      value={f.options}
                      disabled={!admin}
                      onChange={(e) => setFields((p) => p.map((x) => (x.id === f.id ? { ...x, options: e.target.value } : x)))}
                    />
                  </Field>
                ) : null}
                {admin ? (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => move(i, -1)}>
                      Subir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, 1)}>
                      Bajar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))}>
                      Quitar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      )}

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-2xl text-navy">Estados del flujo</h2>
        <ul className="mt-3 space-y-2">
          {statuses.map((s) => (
            <li key={s.id} className="grid gap-2 md:grid-cols-3">
              <Input value={s.label} disabled={!admin} onChange={(e) => setStatuses((p) => p.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))} />
              <Input value={s.key} disabled={!admin} onChange={(e) => setStatuses((p) => p.map((x) => (x.id === s.id ? { ...x, key: e.target.value } : x)))} />
              <NativeSelect value={s.color} disabled={!admin} onChange={(e) => setStatuses((p) => p.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))}>
                <option value="steel">gris</option>
                <option value="teal">azul</option>
                <option value="ok">verde</option>
                <option value="warn">ámbar</option>
                <option value="rust">rojo</option>
                <option value="navy">navy</option>
              </NativeSelect>
            </li>
          ))}
        </ul>
      </section>

      {admin ? (
        <Button variant="navy" onClick={() => void save()}>
          Guardar plantilla
        </Button>
      ) : null}
    </div>
  );
}
