import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { listBranches, saveBranch } from "@/lib/server/engine";

export const Route = createFileRoute("/sucursales")({ component: Page });

function Page() {
  return (
    <Protected>
      <Sucursales />
    </Protected>
  );
}

function Sucursales() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["branches"], queryFn: () => listBranches() });
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  async function create(e: FormEvent) {
    e.preventDefault();
    await saveBranch({ data: { name, city, address } });
    toast.success("Sucursal");
    setName("");
    setCity("");
    setAddress("");
    void qc.invalidateQueries({ queryKey: ["branches"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-navy">Sucursales</h1>
      <p className="text-sm text-steel">Un usuario puede quedar limitado a una sucursal desde Equipo en una siguiente versión; aquí se dan de alta.</p>
      <form onSubmit={(e) => void create(e)} className="grid gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-3">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Ciudad">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="Dirección">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Button type="submit">Alta</Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {(q.data ?? []).map((b) => (
          <li key={b.id} className="px-4 py-3">
            <p className="text-navy">{b.name}</p>
            <p className="text-xs text-steel">
              {b.city} {b.address}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
