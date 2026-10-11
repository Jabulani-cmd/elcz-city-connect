import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authMode, changeMyPassword, signOut, useAuth } from "@/lib/auth";
import { ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { usePendingCount, useUser } from "@/lib/store";
import { Panel } from "./kit";

/** Who you are, change password, sign out. */
export function AccountPanel() {
  const auth = useAuth();
  const user = useUser();
  const pending = usePendingCount();
  const { hash } = useLocation();
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (hash === "#password") document.getElementById("password")?.scrollIntoView({ block: "center" }); }, [hash]);
  const submit = async () => {
    if (f.next !== f.again) return toast.error("The new passwords don’t match");
    setBusy(true);
    try { await changeMyPassword(f.current, f.next); toast.success("Password changed"); setF({ current: "", next: "", again: "" }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn’t change password"); } finally { setBusy(false); }
  };
  return (
    <Panel title="Your account">
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Name</dt><dd>{auth.name}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{authMode === "cloud" ? "Email" : "Username"}</dt><dd className="truncate">{auth.email}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Your role</dt><dd>{user.role} <span className="text-xs text-muted-foreground">– {ROLE_DESCRIPTIONS[user.role]}</span></dd></div>
      </dl>
      <form id="password" className="mt-5 grid max-w-sm gap-3 border-t pt-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div className="font-semibold">Change password</div>
        <div><Label htmlFor="pw-cur" className="mb-1.5 block text-sm">Current password</Label><Input id="pw-cur" type="password" autoComplete="current-password" className="h-11 md:h-10" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></div>
        <div><Label htmlFor="pw-new" className="mb-1.5 block text-sm">New password (8+ characters)</Label><Input id="pw-new" type="password" autoComplete="new-password" className="h-11 md:h-10" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></div>
        <div><Label htmlFor="pw-again" className="mb-1.5 block text-sm">Repeat new password</Label><Input id="pw-again" type="password" autoComplete="new-password" className="h-11 md:h-10" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} /></div>
        <Button type="submit" disabled={busy || !f.current || !f.next}>Change password</Button>
      </form>
      <Button variant="outline" className="mt-5" onClick={() => { if (authMode !== "cloud" || pending === 0 || confirm(`${pending} change${pending === 1 ? " is" : "s are"} not uploaded yet. They stay on this device and upload next time you sign in. Sign out now?`)) void signOut(); }}><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button>
    </Panel>
  );
}
