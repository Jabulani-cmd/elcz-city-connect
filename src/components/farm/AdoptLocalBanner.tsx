import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cloudEnabled } from "@/lib/supabaseClient";
import { adoptLocalData, dismissAdopt, localDeviceData, useStore } from "@/lib/store";

/** Offers to move farm data saved on this device (from before sign-in) into the signed-in account. */
export function AdoptLocalBanner() {
  const adopted = useStore((s) => s.adoptedLocal);
  if (!cloudEnabled || adopted) return null;
  const local = localDeviceData();
  if (!local) return null;
  return (
    <div role="note" className="mb-4 rounded-2xl border border-info/40 bg-info/10 p-3 text-sm">
      <b>Farm data found on this device.</b> “{local.farms.map((f) => f.name).join("”, “")}” was saved here before you signed in. Upload it to your account so it’s backed up and shared with your team?
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => { const n = adoptLocalData(); toast.success(n ? `Uploading ${n} records…` : "Done"); }}>Upload to my account</Button>
        <Button size="sm" variant="outline" onClick={dismissAdopt}>Not now</Button>
      </div>
    </div>
  );
}
