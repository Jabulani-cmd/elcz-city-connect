import { Mail, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { inviteMember, listTeam, removeMember, revokeInvite, setMemberRole, type Invite, type Member } from "@/lib/team";
import { useFarm, useUser } from "@/lib/store";
import { ROLES, type Role } from "@/lib/types";
import { Empty, nativeSelect, Panel } from "./kit";

/** Who can open this farm and what they can do. Only owners can change it. */
export function TeamPanel() {
  const farm = useFarm();
  const { role } = useUser();
  const me = useAuth().userId;
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Employee");
  const isOwner = role === "Owner";

  const load = useCallback(async () => {
    if (!farm) return;
    try { const t = await listTeam(farm.id); setMembers(t.members); setInvites(t.invites); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not load the team"); }
    finally { setLoading(false); }
  }, [farm]);
  useEffect(() => { setLoading(true); void load(); }, [load]);

  const run = async (fn: () => Promise<void>, ok: string) => { try { await fn(); toast.success(ok); await load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } };
  if (!farm) return null;
  return (
    <Panel title="Team & access">
      <p className="mb-3 text-sm text-muted-foreground">Everyone signs in with their own account and only sees what their role allows. {isOwner ? "" : "Only the farm owner can change this."}</p>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1"><div className="truncate font-medium">{m.name || m.email}{m.userId === me && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}</div><div className="truncate text-xs text-muted-foreground">{m.email}</div></div>
              {isOwner ? (
                <>
                  <select aria-label={`Role for ${m.email}`} className={cn(nativeSelect, "w-auto")} value={m.role} onChange={(e) => run(() => setMemberRole(farm.id, m.userId, e.target.value as Role), "Role updated")}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${m.email}`} onClick={() => { if (confirm(`Remove ${m.name || m.email} from this farm?`)) void run(() => removeMember(farm.id, m.userId), "Removed"); }}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </>
              ) : <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{m.role}</span>}
            </li>
          ))}
          {invites.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1"><div className="truncate">{i.email}</div><div className="text-xs text-muted-foreground">Invited as {i.role} · waiting for them to sign up or sign in</div></div>
              {isOwner && <Button variant="ghost" size="sm" onClick={() => run(() => revokeInvite(i.id), "Invitation cancelled")}>Cancel</Button>}
            </li>
          ))}
          {!members.length && !invites.length && <Empty>No one yet.</Empty>}
        </ul>
      )}
      {isOwner && (
        <form className="mt-4 space-y-2 border-t pt-4" onSubmit={(e) => { e.preventDefault(); if (!email.trim()) return; void run(async () => { await inviteMember(farm.id, email, newRole); setEmail(""); }, "Invitation saved"); }}>
          <div className="text-sm font-semibold">Add someone</div>
          <div className="flex flex-wrap gap-2">
            <Input type="email" aria-label="Email to invite" placeholder="their@email.com" className="h-11 min-w-[12rem] flex-1 md:h-10" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select aria-label="Role" className={cn(nativeSelect, "w-auto")} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>{ROLES.filter((r) => r !== "Owner").map((r) => <option key={r}>{r}</option>)}</select>
            <Button type="submit" size="lg" className="md:h-10"><UserPlus className="mr-1.5 h-4 w-4" />Invite</Button>
          </div>
          <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[newRole]} Ask them to create a FarmHelper account with this exact email – the farm appears for them automatically.</p>
        </form>
      )}
    </Panel>
  );
}
