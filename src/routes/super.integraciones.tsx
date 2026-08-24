import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/server/platform";

export const Route = createFileRoute("/super/integraciones")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["apikeys"], queryFn: () => listApiKeys() });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Integraciones</h1>
      <ul className="space-y-2 text-sm">
        <li>WhatsApp · compartir por enlace (sin API de pago) · activo</li>
        <li>Telegram · compartir por enlace · activo</li>
        <li>SMTP · por empresa en Configuración del patio · activo</li>
        <li>Storage · fotos JPEG en la base del patio · activo</li>
      </ul>
      <Button
        variant="navy"
        onClick={() => {
          void createApiKey({ data: { name: "soporte" } }).then((r) => {
            toast.success(`Clave ${r.prefix}`);
            void qc.invalidateQueries({ queryKey: ["apikeys"] });
          });
        }}
      >
        Crear API key
      </Button>
      <ul className="space-y-2 text-sm">
        {(q.data ?? []).map((k) => (
          <li key={k.id} className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2 font-mono">
            <span>
              {k.prefix} · {k.name} {k.revoked ? "(revocada)" : ""}
            </span>
            {!k.revoked ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void revokeApiKey({ data: { id: k.id } }).then(() => {
                    toast.success("Revocada");
                    void qc.invalidateQueries({ queryKey: ["apikeys"] });
                  });
                }}
              >
                Revocar
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
