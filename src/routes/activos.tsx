import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { assetHistory, listAssets, listBranches, saveAsset } from "@/lib/server/engine";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/activos")({ component: Page });

function Page() {
  return (
    <Protected>
      <Activos />
    </Protected>
  );
}

function Activos() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["assets"], queryFn: () => listAssets() });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => listBranches() });
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("contenedor");
  const [branchId, setBranchId] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const hist = useQuery({
    queryKey: ["asset-hist", open],
    queryFn: () => assetHistory({ data: { assetId: open! } }),
    enabled: Boolean(open),
  });

  async function create(e: FormEvent) {
    e.preventDefault();
    await saveAsset({ data: { code, name, kind, branchId } });
    toast.success("Activo dado de alta");
    setCode("");
    setName("");
    void qc.invalidateQueries({ queryKey: ["assets"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-navy">Activos</h1>
      <p className="text-sm text-steel">Contenedor, vehículo, almacén o equipo. Cada uno tiene historial de inspecciones.</p>
      <form onSubmit={(e) => void create(e)} className="grid gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-4">
        <Field label="Código">
          <Input value={code} onChange={(e) => setCode(e.target.value)} required />
        </Field>
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <NativeSelect value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="contenedor">Contenedor</option>
            <option value="vehiculo">Vehículo</option>
            <option value="almacen">Almacén</option>
            <option value="equipo">Equipo</option>
            <option value="otro">Otro</option>
          </NativeSelect>
        </Field>
        <Field label="Sucursal">
          <NativeSelect value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">—</option>
            {(branches.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button type="submit">Alta</Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {(q.data ?? []).map((a) => (
          <li key={a.id} className="px-4 py-3">
            <button type="button" className="w-full text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <p className="font-mono text-sm text-navy">{a.code}</p>
              <p className="text-xs text-steel">
                {a.kind} · {a.name}
              </p>
            </button>
            {open === a.id && hist.data ? (
              <ul className="mt-2 space-y-1 text-sm text-steel">
                {hist.data.records.map((r) => (
                  <li key={r.id}>
                    <Link to="/registros/$id" params={{ id: r.id }} className="text-teal-dark">
                      {formatDate(r.at)} → Inspección {r.folio}
                    </Link>
                  </li>
                ))}
                {hist.data.incidents.map((i) => (
                  <li key={i.at + i.title}>
                    {formatDate(i.at)} → Incidencia {i.title}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
