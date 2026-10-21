import { ArrowLeft, Loader2, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordReset, setNewPassword, signIn, signUp } from "@/lib/auth";

const friendly = (e: unknown) => {
  const m = e instanceof Error ? e.message : "Something went wrong";
  if (/invalid login/i.test(m)) return "That email or password isn’t right.";
  if (/not confirmed/i.test(m)) return "Please confirm your email first – check your inbox for the link.";
  if (/already registered|already been registered/i.test(m)) return "An account with this email already exists. Try signing in.";
  if (/password.*(short|least|weak)/i.test(m)) return "Please choose a longer password (at least 8 characters).";
  if (/fetch|network/i.test(m)) return "No internet connection. Please try again when you’re online.";
  return m;
};

export function Shell({ title, subtitle, children, home = true }: { title: string; subtitle?: string; children: ReactNode; home?: boolean }) {
  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center p-4 pt-safe">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        {home && <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Home</Link>}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sprout className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-bold">{title}</h1>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Splash({ children = "Loading…" }: { children?: ReactNode }) {
  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15"><Sprout className="h-8 w-8" /></div>
      <div className="flex items-center gap-2 text-sm text-white/85"><Loader2 className="h-4 w-4 animate-spin" />{children}</div>
    </div>
  );
}

export function AuthScreen({ initialMode = "in" }: { initialMode?: "in" | "up" }) {
  const [mode, setMode] = useState<"in" | "up" | "forgot">(initialMode);
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [keep, setKeep] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    if (!f.email.trim()) return toast.error("Please enter your email");
    if (mode !== "forgot" && f.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (mode === "up" && !f.name.trim()) return toast.error("Please enter your name");
    setBusy(true);
    try {
      if (mode === "in") await signIn(f.email, f.password, keep);
      else if (mode === "up") { if (!(await signUp(f.email, f.password, f.name, keep))) setNote("Account created. Check your email for a confirmation link, then sign in."); }
      else { await sendPasswordReset(f.email); setNote("If that email has an account, a reset link is on its way."); }
    } catch (e) { toast.error(friendly(e)); } finally { setBusy(false); }
  };

  return (
    <Shell title={mode === "up" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back"} subtitle="FarmHelper – one platform to manage the entire farm">
      {note ? (
        <div className="space-y-4"><p role="status" className="rounded-xl bg-success/10 p-3 text-sm">{note}</p><Button variant="outline" className="w-full" onClick={() => { setNote(""); setMode("in"); }}>Back to sign in</Button></div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          {mode === "up" && <div><Label htmlFor="au-name" className="mb-1.5 block">Your name</Label><Input id="au-name" className="h-12 text-base" autoComplete="name" value={f.name} onChange={set("name")} /></div>}
          <div><Label htmlFor="au-email" className="mb-1.5 block">Email</Label><Input id="au-email" type="email" className="h-12 text-base" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} /></div>
          {mode !== "forgot" && <div><Label htmlFor="au-pw" className="mb-1.5 block">Password</Label><Input id="au-pw" type="password" className="h-12 text-base" autoComplete={mode === "up" ? "new-password" : "current-password"} value={f.password} onChange={set("password")} /></div>}
          {mode !== "forgot" && <KeepSignedIn checked={keep} onChange={setKeep} />}
          <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</Button>
          <div className="flex flex-col items-center gap-2 text-sm">
            {mode === "in" && <><button type="button" className="text-muted-foreground underline" onClick={() => setMode("forgot")}>Forgot your password?</button><button type="button" className="font-medium text-primary underline" onClick={() => setMode("up")}>New here? Create an account</button></>}
            {mode !== "in" && <button type="button" className="text-muted-foreground underline" onClick={() => setMode("in")}>Back to sign in</button>}
          </div>
          {mode === "up" && <p className="text-center text-xs text-muted-foreground">Invited to a farm? Create your account with the same email you were invited with and the farm will appear automatically.</p>}
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell title="Choose a new password" home={false}>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (pw.length < 8) return toast.error("Password must be at least 8 characters"); setBusy(true); try { await setNewPassword(pw); toast.success("Password updated"); } catch (err) { toast.error(friendly(err)); } finally { setBusy(false); } }}>
        <div><Label htmlFor="rp" className="mb-1.5 block">New password</Label><Input id="rp" type="password" className="h-12 text-base" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>Save password</Button>
      </form>
    </Shell>
  );
}

export function KeepSignedIn({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>Keep me signed in on this device<span className="block text-xs text-muted-foreground">Leave off on shared phones – you’ll sign in each time you open the app.</span></span>
    </label>
  );
}
