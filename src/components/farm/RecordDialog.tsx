import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveRecord } from "@/lib/rules";
import { RESOURCES } from "@/lib/schema";
import type { Row, Values } from "@/lib/types";
import { cleanValues, FieldInput, initialValues, missingRequired } from "./FieldInput";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Add/edit form for any resource defined in the schema. `row` = edit, undefined = add. */
export function RecordDialog({ resource, open, row, defaults, onClose, onSaved, title }: {
  resource: string; open: boolean; row?: Row; defaults?: Values; title?: string;
  onClose: () => void; onSaved?: (r: Row) => void;
}) {
  const res = RESOURCES[resource];
  const [values, setValues] = useState<Values>({});
  useEffect(() => {
    if (open) setValues(row ? initialValues(res.fields, row) : { ...initialValues(res.fields), ...defaults });
  }, [open, row, res, defaults]);

  const save = () => {
    const missing = missingRequired(res.fields, values);
    if (missing.length) return toast.error(`Please fill in: ${missing.join(", ")}`);
    try {
      const saved = saveRecord(res.collection, { ...cleanValues(res.fields, values), ...(row ? { id: row.id } : {}) });
      toast.success(row ? `${cap(res.singular)} updated` : `${cap(res.singular)} added`);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ?? (row ? `Edit ${res.singular}` : `Add ${res.singular}`)}</DialogTitle>
          <DialogDescription>{res.help ?? "Fields marked * are required."}</DialogDescription>
        </DialogHeader>
        <form className="grid grid-cols-2 gap-x-3 gap-y-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
          {res.fields.map((f) => <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />)}
          <DialogFooter className="col-span-2 mt-2 gap-2 sm:gap-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="lg">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
