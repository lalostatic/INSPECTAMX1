import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { exportInspectionsCsv, getReportSummary } from "@/lib/server/reports";

export const Route = createFileRoute("/reportes")({ component: Page });

function Page() {
  return (
    <Protected>
      <Reportes />
    </Protected>
  );
}

function Reportes() {
  const q = useQuery({ queryKey: ["reports"], queryFn: () => getReportSummary() });
  const d = q.data;

  async function downloadCsv() {
    const { csv } = await exportInspectionsCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inspectamx-inspecciones.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-steel">Administración</p>
          <h1 className="font-display text-4xl tracking-wide text-navy">Reportes</h1>
          <p className="mt-1 text-sm text-steel">Totales de este patio. No incluye otras empresas.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void downloadCsv()}>
          Descargar CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Inspecciones" value={d?.inspections} />
        <Stat label="Fotos" value={d?.photos} />
        <Stat label="Archivadas" value={d?.archived} />
        <Stat label="Reportes M&R" value={d?.workReports} />
        <Stat label="Almacén" value={d?.warehouse} />
      </div>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wider text-steel">Por inspector</p>
        <ul className="mt-3 divide-y divide-line">
          {(d?.byInspector ?? []).length === 0 ? (
            <li className="py-2 text-sm text-steel">Sin datos.</li>
          ) : (
            d?.byInspector.map((r) => (
              <li key={r.name} className="flex justify-between py-2 text-sm">
                <span>{r.name || "Sin nombre"}</span>
                <span className="font-medium text-navy">{r.count}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="text-sm text-steel">
        <Link to="/configuracion" className="text-teal-dark">
          Configuración
        </Link>
        {" · "}
        respaldos y correo SMTP de la empresa.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-card">
      <p className="text-xs uppercase tracking-wider text-steel">{label}</p>
      <p className="font-display text-3xl text-navy">{value ?? "—"}</p>
    </div>
  );
}
