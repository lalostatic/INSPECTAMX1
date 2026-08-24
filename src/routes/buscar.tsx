import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { globalSearch } from "@/lib/server/engine";

type Search = { q: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    q: typeof raw.q === "string" ? raw.q : "",
  }),
  component: Page,
});

function Page() {
  return (
    <Protected>
      <Buscar />
    </Protected>
  );
}

function Buscar() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial);
  const [sent, setSent] = useState(initial);
  const results = useQuery({
    queryKey: ["search", sent],
    queryFn: () => globalSearch({ data: { q: sent } }),
    enabled: sent.trim().length > 0,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(q.trim());
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl text-navy">Buscar</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Folio, activo, incidencia, etiqueta…" />
        <Button type="submit" variant="navy">
          Buscar
        </Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {!sent ? <li className="p-4 text-sm text-steel">Escriba un término.</li> : null}
        {sent && (results.data ?? []).length === 0 && !results.isFetching ? (
          <li className="p-4 text-sm text-steel">Sin resultados.</li>
        ) : null}
        {(results.data ?? []).map((h) => (
          <li key={h.kind + h.id} className="px-4 py-3">
            <p className="text-[10px] uppercase text-steel">{h.kind}</p>
            <a href={h.href} className="text-navy hover:underline">
              {h.title}
            </a>
            <p className="text-xs text-steel">{h.subtitle}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
