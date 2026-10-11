import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOwnerAccount, resetLocalAccounts, signIn } from "@/lib/auth";
import { eraseLocalData, localDeviceData } from "@/lib/store";
import { KeepSignedIn, Shell } from "./AuthScreen";

const friendly = (e: unknown) => {
  const m = e instanceof Error ? e.message : "Something went wrong";
  return /invalid login/i.test(m) ? "That username or password isn’t right." : m;
};

/** First run: create the owner account that protects this device’s farm data. */
export function LocalSetup() {
  const existing = localDeviceData();
  const [f, setF] = useState({ name: "", username: "", password: "", confirm: "" });
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async () => {
    if (f.password !== f.confirm) return toast.error("The two passwords don’t match");
    setBusy(true);
    try { await createOwnerAccount(f.name, f.username, f.password, keep); } catch (e) { toast.error(friendly(e)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Create your account" subtitle="You’ll be the owner of this farm app">
      {existing && <p className="mb-4 rounded-xl bg-info/10 p-3 text-sm">Your existing farm data on this device (“{existing.farms.map((f) => f.name).join("”, “")}”) will be kept and protected by this account.</p>}
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div><Label htmlFor="ls-name" className="mb-1.5 block">Your name</Label><Input id="ls-name" className="h-12 text-base" autoComplete="name" value={f.name} onChange={set("name")} /></div>
        <div><Label htmlFor="ls-user" className="mb-1.5 block">Username</Label><Input id="ls-user" className="h-12 text-base" autoComplete="username" autoCapitalize="none" value={f.username} onChange={set("username")} /></div>
        <div><Label htmlFor="ls-pw" className="mb-1.5 block">Password (at least 8 characters)</Label><Input id="ls-pw" type="password" className="h-12 text-base" autoComplete="new-password" value={f.password} onChange={set("password")} /></div>
        <div><Label htmlFor="ls-pw2" className="mb-1.5 block">Repeat password</Label><Input id="ls-pw2" type="password" className="h-12 text-base" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} /></div>
        <KeepSignedIn checked={keep} onChange={setKeep} />
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
        <p className="text-center text-xs text-muted-foreground">Write your password down somewhere safe. On this device there is no “reset by email”.</p>
      </form>
    </Shell>
  );
}

/** Opens at launch (unless “keep me signed in” was ticked). */
export function LocalLogin() {
  const [f, setF] = useState({ username: "", password: "" });
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    try { await signIn(f.username, f.password, keep); }
    catch (e) { setFails((n) => n + 1); toast.error(friendly(e)); if (fails >= 4) await new Promise((r) => setTimeout(r, Math.min(8000, (fails - 3) * 2000))); }
    finally { setBusy(false); }
  };
  if (forgot) {
    return (
      <Shell title="Forgot your password?" subtitle="Read this carefully">
        <p className="mb-3 text-sm">Passwords on this device can’t be recovered – there is no email to send a link to. The only way back in is to <b>erase everything on this device</b> (all accounts and all farm data) and start again.</p>
        <p className="mb-3 text-sm text-muted-foreground">If the farm is also stored in a cloud account, it can be loaded again after you sign in there. Otherwise the records are lost.</p>
        <Label htmlFor="er" className="mb-1.5 block text-sm">Type ERASE to confirm</Label>
        <Input id="er" className="h-12 text-base" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setForgot(false)}>Back</Button>
          <Button size="lg" className="flex-1 bg-danger hover:bg-danger/90" disabled={confirmText.trim().toUpperCase() !== "ERASE"} onClick={() => { eraseLocalData(); resetLocalAccounts(); }}>Erase and start again</Button>
        </div>
      </Shell>
    );
  }
  return (
    <Shell title="Welcome back" subtitle="Sign in to FarmHelper">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div><Label htmlFor="ll-user" className="mb-1.5 block">Username</Label><Input id="ll-user" className="h-12 text-base" autoComplete="username" autoCapitalize="none" value={f.username} onChange={set("username")} /></div>
        <div><Label htmlFor="ll-pw" className="mb-1.5 block">Password</Label><Input id="ll-pw" type="password" className="h-12 text-base" autoComplete="current-password" value={f.password} onChange={set("password")} /></div>
        <KeepSignedIn checked={keep} onChange={setKeep} />
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy || !f.username || !f.password}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
        <div className="text-center"><button type="button" className="text-sm text-muted-foreground underline" onClick={() => setForgot(true)}>Forgot your password?</button></div>
      </form>
    </Shell>
  );
}
