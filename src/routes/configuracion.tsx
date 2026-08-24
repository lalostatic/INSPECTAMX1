import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { exportBackup } from "@/lib/server/backups";
import { getSmtpSettings, saveSmtpSettings } from "@/lib/server/settings";
import { listArchivedInspections, restoreInspection } from "@/lib/server/inspections";
import { formatContainer } from "@/lib/iso6346";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/configuracion")({ component: Page });

function Page() {
  return (
    <Protected>
      <Configuracion />
    </Protected>
  );
}

function Configuracion() {
  const qc = useQueryClient();
  const smtp = useQuery({ queryKey: ["smtp"], queryFn: () => getSmtpSettings() });
  const archived = useQuery({ queryKey: ["archived"], queryFn: () => listArchivedInspections() });
  const s = smtp.data;
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [secure, setSecure] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (s && !loaded) {
    setHost(s.host);
    setPort(String(s.port));
    setUsername(s.username);
    setPassword(s.password);
    setFromEmail(s.fromEmail);
    setFromName(s.fromName);
    setSecure(s.secure);
    setLoaded(true);
  }

  async function saveSmtp() {
    try {
      await saveSmtpSettings({
        data: {
          host,
          port: Number(port) || 587,
          username,
          password,
          fromEmail,
          fromName,
          secure,
        },
      });
      toast.success("SMTP de esta empresa guardado");
      void qc.invalidateQueries({ queryKey: ["smtp"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  async function downloadBackup() {
    try {
      const payload = await exportBackup();
      const blob = new Blob([payload.json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `inspectamx-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Respaldo descargado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo exportar");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-steel">Empresa</p>
        <h1 className="font-display text-4xl tracking-wide text-navy">Configuración</h1>
        <p className="mt-1 text-sm text-steel">
          Correo SMTP, respaldos y folios archivados. Solo de este patio.
        </p>
      </div>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card space-y-3">
        <h2 className="font-display text-2xl text-navy">SMTP de la empresa</h2>
        <p className="text-sm text-steel">
          Cada patio pone su propio servidor de correo. No se comparte con otra empresa.
          WhatsApp y Telegram se envían desde el folio, sin API de pago.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Servidor (host)">
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.su-empresa.com" />
          </Field>
          <Field label="Puerto">
            <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" />
          </Field>
          <Field label="Usuario">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Correo remitente">
            <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="patio@su-empresa.mx" />
          </Field>
          <Field label="Nombre remitente">
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="INSPECTAMX" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-steel">
          <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
          Conexión segura (SSL/TLS, puerto 465)
        </label>
        <Button type="button" onClick={() => void saveSmtp()}>
          Guardar SMTP
        </Button>
      </section>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card space-y-3">
        <h2 className="font-display text-2xl text-navy">Respaldos</h2>
        <p className="text-sm text-steel">
          Descargue un JSON con inspecciones, fotos, taller y almacén. Hágalo antes de actualizar el sistema.
        </p>
        <Button type="button" variant="secondary" onClick={() => void downloadBackup()}>
          Descargar respaldo
        </Button>
      </section>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <h2 className="font-display text-2xl text-navy">Folios archivados</h2>
        <p className="mt-1 text-sm text-steel">No se borran. Recupérelos aquí.</p>
        <ul className="mt-3 divide-y divide-line">
          {(archived.data ?? []).length === 0 ? (
            <li className="py-2 text-sm text-steel">Ningún folio archivado.</li>
          ) : (
            (archived.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <Link to="/inspecciones/$id" params={{ id: r.id }} className="text-sm">
                  {formatContainer(r.containerNo)} · {formatDate(r.inspectedAt)}
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void restoreInspection({ data: { id: r.id } })
                      .then(() => {
                        toast.success("Folio recuperado");
                        void qc.invalidateQueries({ queryKey: ["archived"] });
                        void qc.invalidateQueries({ queryKey: ["inspections"] });
                      })
                      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo recuperar"));
                  }}
                >
                  Recuperar
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
