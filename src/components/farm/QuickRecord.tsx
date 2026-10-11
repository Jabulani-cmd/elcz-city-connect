import { Banknote, ClipboardList, Droplets, HeartPulse, Scale, Skull, Syringe, Wheat, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { canWrite } from "@/lib/permissions";
import { useUser } from "@/lib/store";
import type { Section } from "@/lib/types";
import { RecordDialog } from "./RecordDialog";

const ACTIONS: { resource: string; label: string; icon: LucideIcon; section: Section }[] = [
  { resource: "weights", label: "Weigh animal", icon: Scale, section: "livestock" },
  { resource: "health", label: "Treat animal", icon: HeartPulse, section: "livestock" },
  { resource: "vaccinations", label: "Vaccinate", icon: Syringe, section: "livestock" },
  { resource: "feedUsage", label: "Feed used", icon: Wheat, section: "livestock" },
  { resource: "mortality", label: "Record death", icon: Skull, section: "livestock" },
  { resource: "irrigation", label: "Irrigation", icon: Droplets, section: "agriculture" },
  { resource: "expenses", label: "Expense", icon: Banknote, section: "finance" },
  { resource: "tasks", label: "New task", icon: ClipboardList, section: "tasks" },
];

/** One-tap entry for the things farm workers record most. Weight: animal → weight → save. */
export function QuickRecord({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [resource, setResource] = useState<string | null>(null);
  const role = useUser().role;
  const actions = ACTIONS.filter((a) => canWrite(role, a.section));
  return (
    <>
      <Dialog open={open && !resource} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What did you do?</DialogTitle>
            <DialogDescription>Pick one — it takes under a minute.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((a) => (
              <button key={a.resource} onClick={() => setResource(a.resource)} className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-sm font-semibold transition-colors hover:bg-muted active:scale-[0.98]">
                <a.icon className="h-7 w-7 text-primary" />{a.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {resource && <RecordDialog resource={resource} open onClose={() => { setResource(null); onClose(); }} />}
    </>
  );
}
