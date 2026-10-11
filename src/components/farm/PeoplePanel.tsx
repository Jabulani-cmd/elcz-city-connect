import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { refreshLocalSession, useAuth } from "@/lib/auth";
import { addAccount, listAccounts, removeAccount, setAccountPassword, setAccountRole } from "@/lib/localAuth";
import { ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { ROLES, type Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { nativeSelect, Panel } from "./kit";

/** Local mode: the owner creates sign-ins for staff and sets what each person may do. */
export function PeoplePanel() {
  const me = useAuth();
  const [people, setPeople] = useState(listAccounts);
  const [f, setF] = useState({ name: "", username: "", password: "", role: "Employee" as Role });
  const [busy, setBusy] = useState(false);
  const reload = () => { setPeople(listAccounts()); refreshLocalSession(); };
  const run = async (fn: () => void | Promise<void>, ok: string) => { try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } };
  return (
    <Panel title="People who can sign in on this device">
      <p className="mb-3 text-sm text-muted-foreground">Each person has their own username and password, and only sees what their role allows. Only owners can change this.</p>
      <ul className="divide-y">
        {people.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
            <div className="min-w-0 flex-1"><div className="truncate font-medium">{p.name}{p.id === me.userId && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}</div><div className="truncate text-xs text-muted-foreground">{p.username}</div></div>
            <select aria-label={`Role for ${p.name}`} className={cn(nativeSelect, "w-auto")} value={p.role} onChange={(e) => run(() => setAccountRole(p.id, e.target.value as Role), "Role updated")}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            <Button variant="ghost" size="icon" aria-label={`Reset password for ${p.name}`} onClick={() => { const pw = prompt(`New password for ${p.name} (8+ characters)`); if (pw) void run(() => setAccountPassword(p.id, pw), "Password reset"); }}><KeyRound className="h-4 w-4" /></Button>
            {p.id !== me.userId && <Button variant="ghost" size="icon" aria-label={`Remove ${p.name}`} onClick={() => { if (confirm(`Remove ${p.name}? They will no longer be able to sign in.`)) void run(() => removeAccount(p.id), "Removed"); }}><Trash2 className="h-4 w-4 text-danger" /></Button>}
          </li>
        ))}
      </ul>
      <form className="mt-4 space-y-2 border-t pt-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await run(async () => { await addAccount(f.name, f.username, f.password, f.role); setF({ name: "", username: "", password: "", role: "Employee" }); }, "Person added"); setBusy(false); }}>
        <div className="text-sm font-semibold">Add a person</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input aria-label="Name" placeholder="Name" className="h-11 md:h-10" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input aria-label="Username" placeholder="Username" autoCapitalize="none" className="h-11 md:h-10" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
          <Input aria-label="Password" type="password" placeholder="Password (8+ characters)" autoComplete="new-password" className="h-11 md:h-10" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <select aria-label="New person's role" className={nativeSelect} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[f.role]}</p>
        <Button type="submit" disabled={busy}><UserPlus className="mr-1.5 h-4 w-4" />Add person</Button>
      </form>
      <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs">These sign-ins keep other people out of the app on this device. The farm records on the phone are not encrypted, and other devices don’t share them. For separate phones, backups and real server-side protection, connect the cloud (see README).</p>
    </Panel>
  );
}
