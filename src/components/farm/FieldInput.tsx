import { MapPin, Paperclip } from "lucide-react";
import type { Cell, Values } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { openStored, saveFile } from "@/lib/files";
import { ALL_ANIMALS } from "@/lib/rules";
import { labelOf, type Field } from "@/lib/schema";
import { useRows } from "@/lib/store";
import { nativeSelect } from "./kit";

const MAX_FILE = 15 * 1024 * 1024;

function RefOptions({ field, value }: { field: Field; value: unknown }) {
  const rows = useRows(field.ref!);
  const visible = rows.filter((r) => field.ref !== "animals" || r.status === "Active" || r.status === "Quarantined" || r.id === value);
  const sorted = [...visible].sort((a, b) => labelOf(field.ref!, a).localeCompare(labelOf(field.ref!, b), undefined, { numeric: true }));
  return (
    <>
      <option value="">{field.required ? "Select…" : "None"}</option>
      {field.allowAll && <option value={ALL_ANIMALS}>All active animals</option>}
      {sorted.map((r) => <option key={r.id} value={r.id}>{labelOf(field.ref!, r)}</option>)}
    </>
  );
}

export function FieldInput({ field, value, onChange }: { field: Field; value: Cell; onChange: (v: Cell) => void }) {
  const id = `f-${field.key}`;
  const [busy, setBusy] = useState(false);
  let control;
  switch (field.type) {
    case "select":
      control = (
        <select id={id} className={nativeSelect} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.required ? "Select…" : "None"}</option>
          {field.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case "ref":
      control = <select id={id} className={nativeSelect} value={value ?? ""} onChange={(e) => onChange(e.target.value)}><RefOptions field={field} value={value} /></select>;
      break;
    case "textarea":
      control = <Textarea id={id} rows={3} value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "number":
    case "money":
      control = <Input id={id} type="number" inputMode="decimal" step="any" min={0} className="h-11 text-base md:h-10 md:text-sm" value={value ?? ""} placeholder={field.type === "money" ? "0.00" : field.placeholder} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "date":
      control = <Input id={id} type="date" className="h-11 text-base md:h-10 md:text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "file":
      control = (
        <div className="flex flex-wrap items-center gap-2">
          <Input id={id} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv" disabled={busy} className="h-11 text-base file:mr-3 md:h-10 md:text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_FILE) return toast.error("File is larger than 15 MB");
              setBusy(true);
              try { onChange(await saveFile(file)); } catch { toast.error("Could not store the file on this device"); } finally { setBusy(false); }
            }} />
          {value?.fileId && (
            <button type="button" className="inline-flex items-center gap-1 text-sm text-primary underline" onClick={() => openStored(value).catch((err) => toast.error(err.message))}>
              <Paperclip className="h-4 w-4" />{value.name}
            </button>
          )}
        </div>
      );
      break;
    default:
      control = (
        <div className="flex gap-2">
          <Input id={id} className="h-11 text-base md:h-10 md:text-sm" value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
          {field.key === "gps" && (
            <Button type="button" variant="outline" className="h-11 shrink-0 md:h-10" onClick={() => {
              if (!navigator.geolocation) return toast.error("Location is not available on this device");
              navigator.geolocation.getCurrentPosition((p) => onChange(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`), () => toast.error("Could not get your location – check permissions"), { enableHighAccuracy: true, timeout: 15000 });
            }}><MapPin className="mr-1.5 h-4 w-4" />My location</Button>
          )}
        </div>
      );
  }
  return (
    <div className={field.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
      <Label htmlFor={id} className="mb-1.5 block text-sm">{field.label}{field.required && <span className="text-danger"> *</span>}</Label>
      {control}
      {field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}

export function initialValues(fields: Field[], row?: Values) {
  const v: Values = {};
  for (const f of fields) v[f.key] = row ? row[f.key] ?? "" : typeof f.def === "function" ? f.def() : f.def ?? "";
  return v;
}

export function cleanValues(fields: Field[], values: Values) {
  const out: Values = { ...values };
  for (const f of fields) {
    if ((f.type === "number" || f.type === "money") && out[f.key] !== "" && out[f.key] != null) out[f.key] = Number(out[f.key]);
    if (typeof out[f.key] === "string") out[f.key] = out[f.key].trim();
  }
  return out;
}

export function missingRequired(fields: Field[], values: Values) {
  return fields.filter((f) => f.required && (values[f.key] === "" || values[f.key] == null)).map((f) => f.label);
}
