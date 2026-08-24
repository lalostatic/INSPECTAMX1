import { SignaturePad } from "@/components/signature-pad";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { compressImage } from "@/lib/compress-image";
import type { TemplateField } from "@/lib/server/engine";

export function EngineField({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = field.options.split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <Field label={field.label} hint={field.required ? "Obligatorio" : field.help || undefined}>
      {field.type === "textarea" || field.type === "comment" ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "number" ? (
        <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "date" ? (
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" ? (
        <NativeSelect value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Seleccione</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </NativeSelect>
      ) : field.type === "checkbox" ? (
        <label className="flex h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value === "sí" || value === "true"}
            onChange={(e) => onChange(e.target.checked ? "sí" : "no")}
          />
          Cumple
        </label>
      ) : field.type === "signature" ? (
        <SignaturePad value={value} onChange={onChange} />
      ) : field.type === "photo" || field.type === "video" || field.type === "audio" || field.type === "document" ? (
        <div>
          <Input
            type="file"
            accept={
              field.type === "photo"
                ? "image/*"
                : field.type === "video"
                  ? "video/*"
                  : field.type === "audio"
                    ? "audio/*"
                    : "*/*"
            }
            capture={field.type === "photo" ? "environment" : undefined}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void (async () => {
                if (file.type.startsWith("image/")) onChange(await compressImage(file));
                else if (file.size < 350_000) {
                  const reader = new FileReader();
                  reader.onload = () => onChange(String(reader.result || file.name));
                  reader.readAsDataURL(file);
                } else onChange(file.name);
              })();
            }}
          />
          {value.startsWith("data:image") ? (
            <img src={value} alt="" className="mt-2 max-h-40 rounded-md border border-line object-cover" />
          ) : value ? (
            <p className="mt-1 text-xs text-steel">Adjunto listo</p>
          ) : null}
        </div>
      ) : field.type === "gps" ? (
        <p className="text-sm text-steel">{value || "Se toma al enviar, si el dispositivo lo permite."}</p>
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}
