import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { listNotices, publishNotice } from "@/lib/server/platform";

export const Route = createFileRoute("/super/avisos")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["notices"], queryFn: () => listNotices() });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await publishNotice({ data: { title, body } });
    toast.success("Aviso publicado");
    setTitle("");
    setBody("");
    void qc.invalidateQueries({ queryKey: ["notices"] });
  }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-navy">Avisos globales</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 rounded-lg border border-line bg-card p-5">
        <Field label="Título">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Mensaje">
          <Input value={body} onChange={(e) => setBody(e.target.value)} required />
        </Field>
        <Button type="submit">Publicar</Button>
      </form>
      <ul className="space-y-2 text-sm">
        {(q.data ?? []).map((n) => (
          <li key={n.id} className="rounded-lg border border-line bg-card p-4">
            <p className="font-medium text-navy">{n.title}</p>
            <p className="text-steel">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
