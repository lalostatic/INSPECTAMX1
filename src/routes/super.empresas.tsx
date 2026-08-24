import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  createCompany,
  impersonateCompany,
  listSuperCompanies,
  renewCompany,
  setCompanyStatus,
  updateCompanyLimits,
  updateCompanyProfile,
  type SuperCompany,
} from "@/lib/server/platform";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";

export const Route = createFileRoute("/super/empresas")({ component: Empresas });

const STATUSES = ["activa", "prueba", "por_vencer", "vencida", "suspendida", "bloqueada"] as const;

function tone(s: string) {
  if (s === "activa") return "ok" as const;
  if (s === "prueba") return "teal" as const;
  if (s === "por_vencer") return "warn" as const;
  if (s === "vencida" || s === "bloqueada") return "rust" as const;
  return "steel" as const;
}

function Empresas() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["super-companies"], queryFn: () => listSuperCompanies() });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    legalName: "",
    rfc: "",
    domain: "",
    depot: "",
    city: "",
    phone: "",
    address: "",
    contactName: "",
    contactEmail: "",
    plan: "prueba",
    status: "prueba" as (typeof STATUSES)[number],
    maxUsers: 25,
    maxInspectors: 10,
    storageMb: 2048,
    adminName: "",
    adminEmail: "",
    adminPassword: DEMO_PASSWORD,
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createCompany({ data: form });
      toast.success("Empresa creada");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["super-companies"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-navy">Empresas</h1>
          <p className="text-sm text-steel">Alta, plan, límites e ingreso como administrador de esa empresa.</p>
        </div>
        <Button variant="navy" onClick={() => setOpen((v) => !v)}>
          {open ? "Cerrar alta" : "Crear empresa"}
        </Button>
      </div>

      {open ? (
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 rounded-lg border border-line bg-card p-5 shadow-card sm:grid-cols-2">
          <Field label="Nombre comercial">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Razón social">
            <Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
          </Field>
          <Field label="RFC">
            <Input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} />
          </Field>
          <Field label="Dominio de correo" hint="Ej. patio.mx — el admin será admin@ese-dominio">
            <Input required value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </Field>
          <Field label="Patio">
            <Input value={form.depot} onChange={(e) => setForm({ ...form, depot: e.target.value })} />
          </Field>
          <Field label="Ciudad">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Contacto">
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </Field>
          <Field label="Correo de contacto">
            <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </Field>
          <Field label="Administrador (nombre)">
            <Input required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
          </Field>
          <Field label="Administrador (correo)">
            <Input required type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
          </Field>
          <Field label="Contraseña inicial">
            <Input required value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
          </Field>
          <Field label="Plan">
            <select
              className="h-11 rounded-md border border-line bg-card px-3 text-sm"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              <option value="prueba">prueba</option>
              <option value="mensual">mensual</option>
              <option value="anual">anual</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="navy" disabled={busy}>
              Autorizar empresa
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {(q.data ?? []).map((c) => (
          <CompanyCard
            key={c.id}
            c={c}
            onChange={() => void qc.invalidateQueries({ queryKey: ["super-companies"] })}
          />
        ))}
      </div>
    </div>
  );
}

function CompanyCard({ c, onChange }: { c: SuperCompany; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(c.name);
  const [legal, setLegal] = useState(c.legalName);
  const [rfc, setRfc] = useState(c.rfc);
  const [phone, setPhone] = useState(c.phone);
  const [address, setAddress] = useState(c.address);
  const [contact, setContact] = useState(c.contactName);
  const [email, setEmail] = useState(c.contactEmail);
  const [depot, setDepot] = useState(c.depot);
  const [city, setCity] = useState(c.city);
  const [maxUsers, setMaxUsers] = useState(c.maxUsers);
  const [maxInspectors, setMaxInspectors] = useState(c.maxInspectors);
  const [storageMb, setStorageMb] = useState(c.storageMb);
  const [plan, setPlan] = useState(c.plan);

  return (
    <article className="rounded-lg border border-line bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl text-navy">{c.name}</h2>
            <Badge tone={tone(c.status)}>{c.status}</Badge>
            <Badge>{c.plan}</Badge>
          </div>
          <p className="text-xs text-steel">
            @{c.domain} · {c.city} · {c.legalName || "sin razón social"} · RFC {c.rfc || "—"}
          </p>
          <p className="mt-1 text-xs text-steel">
            Alta {c.createdAt.slice(0, 10)} · vence {c.periodEnd || "—"} · {c.members}/{c.maxUsers} usuarios ·{" "}
            {c.inspections} folios · {(c.storageBytes / 1024 / 1024).toFixed(1)} MB / {c.storageMb} MB
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
            {open ? "Cerrar" : "Administrar"}
          </Button>
          <Button
            size="sm"
            variant="navy"
            onClick={() => {
              void impersonateCompany({ data: { orgId: c.id } }).then(() => {
                window.location.assign("/");
              });
            }}
          >
            Entrar como admin
          </Button>
        </div>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={c.status === s ? "navy" : "ghost"}
                onClick={() => {
                  void setCompanyStatus({ data: { orgId: c.id, status: s } })
                    .then(() => {
                      toast.success(`Estado: ${s}`);
                      onChange();
                    })
                    .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Error"));
                }}
              >
                {s}
              </Button>
            ))}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void renewCompany({ data: { orgId: c.id } }).then(() => {
                  toast.success("Renovada 1 mes");
                  onChange();
                });
              }}
            >
              Renovar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Razón social">
              <Input value={legal} onChange={(e) => setLegal(e.target.value)} />
            </Field>
            <Field label="RFC">
              <Input value={rfc} onChange={(e) => setRfc(e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Contacto">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
            <Field label="Correo">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Patio">
              <Input value={depot} onChange={(e) => setDepot(e.target.value)} />
            </Field>
            <Field label="Ciudad">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Dirección">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label="Plan">
              <select
                className="h-11 rounded-md border border-line bg-card px-3 text-sm"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="prueba">prueba</option>
                <option value="mensual">mensual</option>
                <option value="anual">anual</option>
              </select>
            </Field>
            <Field label="Máx. usuarios">
              <Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} />
            </Field>
            <Field label="Máx. inspectores">
              <Input type="number" value={maxInspectors} onChange={(e) => setMaxInspectors(Number(e.target.value))} />
            </Field>
            <Field label="Almacenamiento MB">
              <Input type="number" value={storageMb} onChange={(e) => setStorageMb(Number(e.target.value))} />
            </Field>
          </div>
          <Button
            variant="navy"
            onClick={() => {
              void Promise.all([
                updateCompanyProfile({
                  data: {
                    orgId: c.id,
                    name,
                    legalName: legal,
                    rfc,
                    phone,
                    address,
                    contactName: contact,
                    contactEmail: email,
                    depot,
                    city,
                  },
                }),
                updateCompanyLimits({
                  data: { orgId: c.id, plan, maxUsers, maxInspectors, storageMb },
                }),
              ]).then(() => {
                toast.success("Empresa actualizada");
                onChange();
              });
            }}
          >
            Guardar cambios
          </Button>
        </div>
      ) : null}
    </article>
  );
}
