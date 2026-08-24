import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listTickets, replyTicket } from "@/lib/server/platform";

export const Route = createFileRoute("/super/soporte")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tickets"], queryFn: () => listTickets() });
  const [draft, setDraft] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Soporte</h1>
      <p className="text-sm text-steel">Tickets de las empresas hacia el desarrollador. Impersonar desde Empresas.</p>
      <ul className="space-y-3">
        {(q.data ?? []).length === 0 ? <li className="p-4 text-sm text-steel">Sin tickets.</li> : null}
        {(q.data ?? []).map((t) => (
          <li key={t.id} className="rounded-lg border border-line bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-navy">{t.title}</p>
              <div className="flex gap-2">
                <Badge tone={t.priority === "alta" ? "rust" : t.priority === "media" ? "warn" : "steel"}>{t.priority}</Badge>
                <Badge tone={t.status === "resuelto" ? "ok" : "teal"}>{t.status}</Badge>
              </div>
            </div>
            <p className="mt-2 text-sm text-steel">{t.body}</p>
            {t.response ? <p className="mt-2 text-sm text-navy">Respuesta: {t.response}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                placeholder="Responder…"
                value={draft[t.id] ?? ""}
                onChange={(e) => setDraft({ ...draft, [t.id]: e.target.value })}
                className="max-w-md"
              />
              <Button
                size="sm"
                variant="navy"
                onClick={() => {
                  const response = (draft[t.id] ?? "").trim();
                  if (response.length < 2) return;
                  void replyTicket({ data: { id: t.id, response, status: "en_proceso" } }).then(() => {
                    toast.success("Respondido");
                    void qc.invalidateQueries({ queryKey: ["tickets"] });
                  });
                }}
              >
                Responder
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void replyTicket({
                    data: { id: t.id, response: draft[t.id] || t.response || "Resuelto", status: "resuelto" },
                  }).then(() => {
                    toast.success("Resuelto");
                    void qc.invalidateQueries({ queryKey: ["tickets"] });
                  });
                }}
              >
                Resolver
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
