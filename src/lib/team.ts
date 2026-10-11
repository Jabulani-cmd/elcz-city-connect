import { supabase } from "@/integrations/supabase/client";
import { ROLE_FROM_DB, ROLE_TO_DB } from "./tables";
import type { Role } from "./types";

export type Member = { userId: string; name: string; email: string; role: Role };
export type Invite = { id: string; email: string; role: Role };

const sb = () => { if (!supabase) throw new Error("Not connected"); return supabase; };
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export async function listTeam(farmId: string): Promise<{ members: Member[]; invites: Invite[] }> {
  const [m, i] = await Promise.all([
    sb().from("farm_members").select("user_id, role").eq("farm_id", farmId),
    sb().from("farm_invites").select("id, email, role").eq("farm_id", farmId).is("accepted_at", null),
  ]);
  fail(m.error); fail(i.error);
  const ids = (m.data ?? []).map((x) => x.user_id as string);
  const p = ids.length ? await sb().from("profiles").select("id, full_name, email").in("id", ids) : { data: [], error: null };
  fail(p.error);
  const prof = new Map((p.data ?? []).map((x) => [x.id as string, x]));
  return {
    members: (m.data ?? []).map((x) => ({ userId: x.user_id as string, name: (prof.get(x.user_id as string)?.full_name as string) ?? "", email: (prof.get(x.user_id as string)?.email as string) ?? "", role: ROLE_FROM_DB[x.role as string] ?? "Viewer" })),
    invites: (i.data ?? []).map((x) => ({ id: x.id as string, email: x.email as string, role: ROLE_FROM_DB[x.role as string] ?? "Viewer" })),
  };
}

export async function inviteMember(farmId: string, email: string, role: Role) {
  const { error } = await sb().from("farm_invites").insert({ farm_id: farmId, email: email.trim().toLowerCase(), role: ROLE_TO_DB[role] });
  if (error?.code === "23505") throw new Error("That email has already been invited");
  fail(error);
}
export async function revokeInvite(id: string) { fail((await sb().from("farm_invites").delete().eq("id", id)).error); }
export async function setMemberRole(farmId: string, userId: string, role: Role) { fail((await sb().from("farm_members").update({ role: ROLE_TO_DB[role] }).eq("farm_id", farmId).eq("user_id", userId)).error); }
export async function removeMember(farmId: string, userId: string) { fail((await sb().from("farm_members").delete().eq("farm_id", farmId).eq("user_id", userId)).error); }
