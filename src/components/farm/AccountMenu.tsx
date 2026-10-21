import { CreditCard, KeyRound, LogOut, Settings as SettingsIcon, UserRound } from "lucide-react";
import { canRead } from "@/lib/permissions";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut, useAuth } from "@/lib/auth";
import { usePendingCount, useUser } from "@/lib/store";
import { authMode } from "@/lib/auth";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

/** Who is signed in, plus quick access to account settings and Sign out. */
export function AccountMenu() {
  const auth = useAuth();
  const user = useUser();
  const pending = usePendingCount();
  const navigate = useNavigate();
  const out = async () => {
    if (authMode === "cloud" && pending > 0 && !confirm(`${pending} change${pending === 1 ? " is" : "s are"} not uploaded yet. They stay on this device and upload next time you sign in. Sign out now?`)) return;
    try { await signOut(); } catch { toast.error("Couldn’t sign out"); }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Account menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{initials(auth.name || user.name)}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel><div className="truncate">{auth.name || user.name}</div><div className="truncate text-xs font-normal text-muted-foreground">{auth.email}{auth.email ? " · " : ""}{user.role}</div></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-[44px]" onClick={() => navigate("/account")}><UserRound className="mr-2 h-4 w-4" />My account</DropdownMenuItem>
        {canRead(user.role, "settings") && <DropdownMenuItem className="min-h-[44px]" onClick={() => navigate("/settings")}><SettingsIcon className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>}
        {authMode === "cloud" && <DropdownMenuItem className="min-h-[44px]" onClick={() => navigate("/billing")}><CreditCard className="mr-2 h-4 w-4" />Plan &amp; billing</DropdownMenuItem>}
        <DropdownMenuItem className="min-h-[44px]" onClick={() => navigate("/account#password")}><KeyRound className="mr-2 h-4 w-4" />Change password</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-[44px] font-medium text-danger focus:text-danger" onClick={out}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
