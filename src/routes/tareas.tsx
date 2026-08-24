import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { PRIORITIES } from "@/lib/engine-catalog";
import { canAssignWork } from "@/lib/roles";
import { createAssignment, listAssignments, listTemplates, setAssignmentStatus } from "@/lib/server/engine";
import { getSession, listTeam } from "@/lib/server/tenant";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/tareas")({ component: Page });

function Page() {
  return (
    <Protected>
      <Tareas />
    </Protected>
  );
}

function Tareas() {
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const q = useQuery({ queryKey: ["tasks"], queryFn: () => listAssignments() });
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates() });
  const team = useQuery({ queryKey: ["team"], queryFn: () => listTeam(), enabled: Boolean(session.data?.membership && canAssignWork(session.data.membership.role)) });
  const admin = session.data?.membership ? canAssignWork(session.data.membership.role) : false;
  const [title, setTitle] = useState("");
  const [assignedName, setAssignedName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [locationName, setLocationName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("alta");
  const [templateId, setTemplateId] = useState("");

  async function create(e: FormEvent) {
    e.preventDefault();
    await createAssignment({ data: { title, assignedName, assignedTo, locationName, dueAt, priority, templateId } });
    toast.success("Tarea asignada");
    setTitle("");
    void qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Tareas</h1>
        <p className="text-sm text-steel">El administrador asigna; el inspector la recibe y levanta la plantilla.</p>
      </div>
      {admin ? (
        <form onSubmit={(e) => void create(e)} className="grid gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-2">
          <Field label="Inspección / tarea">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Plantilla">
            <NativeSelect value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">—</option>
              {(templates.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Responsable">
            <NativeSelect
              value={assignedTo}
              onChange={(e) => {
                const id = e.target.value;
                setAssignedTo(id);
                const u = (team.data ?? []).find((x) => x.userId === id);
                setAssignedName(u?.displayName ?? "");
              }}
            >
              <option value="">—</option>
              {(team.data ?? []).map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.displayName}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Ubicación">
            <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} />
          </Field>
          <Field label="Fecha límite">
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
          <Field label="Prioridad">
            <NativeSelect value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </NativeSelect>
          </Field>
          <Button type="submit" variant="navy">
            Asignar
          </Button>
        </form>
      ) : null}
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {(q.data ?? []).length === 0 ? <li className="p-4 text-sm text-steel">Sin tareas.</li> : null}
        {(q.data ?? []).map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="font-medium text-navy">{t.title}</p>
              <p className="text-xs text-steel">
                {t.assignedName || "Sin asignar"} · {t.locationName} · {t.dueAt ? formatDate(t.dueAt) : "sin fecha"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={t.priority === "alta" ? "rust" : t.priority === "media" ? "warn" : "steel"}>{t.priority}</Badge>
              <Badge>{t.status}</Badge>
              {t.templateId ? (
                <Link to="/levantar/$templateId" params={{ templateId: t.templateId }} className="text-sm text-teal-dark">
                  Levantar
                </Link>
              ) : null}
              {t.status === "abierta" ? (
                <Button size="sm" variant="ghost" onClick={() => void setAssignmentStatus({ data: { id: t.id, status: "hecha" } }).then(() => qc.invalidateQueries({ queryKey: ["tasks"] }))}>
                  Cerrar
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
