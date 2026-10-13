import { Bell, BarChart3, Boxes, ChevronDown, Cloud, CloudOff, FileText, LayoutDashboard, ListChecks, Map as MapIcon, Download, LogOut, MoreHorizontal, UserRound, PawPrint, Plus, Settings, Sparkles, Sprout, Users, Wallet, WifiOff, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { computeAlerts } from "@/lib/alerts";
import { canRead } from "@/lib/permissions";
import { clearDemoData, createFarm, rowsOf, setActiveFarm, usePendingCount, useStore, useUser, useFarms, useFarm } from "@/lib/store";
import { useOnline, useSyncStatus } from "@/lib/sync";
import { cloudEnabled } from "@/lib/supabaseClient";
import { signOut } from "@/lib/auth";
import { usePwa } from "@/lib/pwa";
import type { Section } from "@/lib/types";
import { cn } from "@/lib/utils";
import { nativeSelect } from "./kit";
import { Onboarding } from "./Onboarding";
import { PwaBanner } from "./PwaBanner";
import { AdoptLocalBanner } from "./AdoptLocalBanner";
import { AccountMenu } from "./AccountMenu";
import { QuickRecord } from "./QuickRecord";
import { ShiftTracker } from "./ShiftTracker";

export const NAV: { to: string; label: string; section: Section; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", section: "dashboard", icon: LayoutDashboard },
  { to: "/agriculture", label: "Agricultural Farming", section: "agriculture", icon: Sprout },
  { to: "/livestock", label: "Livestock Farming", section: "livestock", icon: PawPrint },
  { to: "/tasks", label: "Tasks", section: "tasks", icon: ListChecks },
  { to: "/map", label: "Farm Map", section: "map", icon: MapIcon },
  { to: "/inventory", label: "Inventory", section: "inventory", icon: Boxes },
  { to: "/finance", label: "Financial Management", section: "finance", icon: Wallet },
  { to: "/employees", label: "Employees", section: "employees", icon: Users },
  { to: "/reports", label: "Reports & Analytics", section: "reports", icon: BarChart3 },
  { to: "/assistant", label: "AI Farm Assistant", section: "assistant", icon: Sparkles },
  { to: "/notifications", label: "Notifications", section: "notifications", icon: Bell },
  { to: "/documents", label: "Documents", section: "documents", icon: FileText },
  { to: "/settings", label: "Settings", section: "settings", icon: Settings },
];

export function useAlertCount() {
  const data = useStore((s) => s.data);
  const farmId = useStore((s) => s.activeFarmId);
  return useMemo(() => computeAlerts((c) => (data[c] ?? []).filter((r) => r.farmId === farmId)).filter((a) => a.severity !== "info").length, [data, farmId]);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const role = useUser().role;
  const alerts = useAlertCount();
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Main">
      {NAV.filter((n) => canRead(role, n.section)).map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={onNavigate}
          className={({ isActive }) => cn("flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm")}>
          <n.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{n.label}</span>
          {n.section === "notifications" && alerts > 0 && <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-bold text-sidebar-primary-foreground">{alerts}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-4 text-sidebar-foreground">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Sprout className="h-5 w-5" /></div>
      <div className="leading-tight"><div className="text-lg font-bold">FarmHelper</div><div className="text-[11px] opacity-70">One platform to manage the entire farm</div></div>
    </div>
  );
}

function SyncBadge() {
  const online = useOnline();
  const pending = usePendingCount();
  const sync = useSyncStatus();
  let text: string;
  let title: string;
  let warn = false;
  if (!cloudEnabled) { text = online ? "Online · saved on device" : "Offline · saved on device"; title = "Changes are saved on this device. Cloud sync is not set up."; warn = !online; }
  else if (!online) { text = `Offline · ${pending} waiting`; title = "You are offline. Changes are saved on this device and will upload when you reconnect."; warn = true; }
  else if (sync.state === "syncing") { text = "Syncing…"; title = "Syncing with the cloud"; }
  else if (sync.state === "error") { text = pending ? `Sync problem · ${pending} waiting` : "Sync problem"; title = sync.error || "Could not reach the server. Will retry."; warn = true; }
  else if (pending > 0) { text = `${pending} to upload`; title = "Waiting to sync"; }
  else { text = "Synced"; title = "Everything is saved to the cloud"; }
  return (
    <span title={title} className={cn("hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex", warn ? "border-warning/50 bg-warning/10 text-foreground" : "text-muted-foreground")}>
      {online ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}{text}
    </span>
  );
}

function FarmSwitcher() {
  const farms = useFarms();
  const farm = useFarm();
  const navigate = useNavigate();
  return (
    <label className="relative flex min-w-0 items-center">
      <span className="sr-only">Switch farm</span>
      <select className="h-10 max-w-[13rem] cursor-pointer appearance-none truncate rounded-full border bg-card pl-3.5 pr-8 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs" value={farm?.id ?? ""}
        onChange={(e) => {
          if (e.target.value === "__new") { createFarm({ name: "New farm" }); navigate("/settings"); }
          else setActiveFarm(e.target.value);
        }}>
        {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        <option value="__new">+ Add a farm…</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  );
}

const TABS = [
  { to: "/", label: "Home", icon: LayoutDashboard, section: "dashboard" as Section, end: true },
  { to: "/livestock", label: "Livestock", icon: PawPrint, section: "livestock" as Section },
  { to: "/agriculture", label: "Crops", icon: Sprout, section: "agriculture" as Section },
  { to: "/tasks", label: "Tasks", icon: ListChecks, section: "tasks" as Section },
];

function TabBar({ onMore, onQuick, canRecord }: { onMore: () => void; onQuick: () => void; canRecord: boolean }) {
  const role = useUser().role;
  const alerts = useAlertCount();
  const tabs = TABS.filter((t) => canRead(role, t.section));
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2, 4);
  const item = (t: (typeof TABS)[number]) => (
    <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cn("relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
      {({ isActive }) => (<>
        <span className={cn("flex h-7 w-14 items-center justify-center rounded-full transition-colors", isActive && "bg-primary/10")}><t.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} /></span>
        {t.label}
      </>)}
    </NavLink>
  );
  return (
    <nav aria-label="Primary" className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-safe md:hidden">
      <div className="mx-auto flex max-w-lg items-end px-1">
        {left.map(item)}
        {canRecord ? (
          <div className="flex flex-1 justify-center">
            <button onClick={onQuick} aria-label="Quick record" className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"><Plus className="h-7 w-7" /></button>
          </div>
        ) : <NavLink to="/notifications" className="flex flex-1 flex-col items-center py-2 text-[11px] text-muted-foreground"><span className="flex h-7 w-14 items-center justify-center"><Bell className="h-[22px] w-[22px]" /></span>Alerts</NavLink>}
        {right.map(item)}
        <button onClick={onMore} className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground">
          <span className="relative flex h-7 w-14 items-center justify-center"><MoreHorizontal className="h-[22px] w-[22px]" />{alerts > 0 && <span className="absolute right-3 top-0 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-background" />}</span>
          More
        </button>
      </div>
    </nav>
  );
}

export function AppShell() {
  const farmCount = useFarms().length;
  const isDemo = useFarm()?.id === "demo-farm";
  const [open, setOpen] = useState(false);
  const [quick, setQuick] = useState(false);
  const user = useUser();
  const alerts = useAlertCount();
  const online = useOnline();
  const navigate = useNavigate();
  const loc = useLocation();
  const pwa = usePwa();
  const [params, setParams] = useSearchParams();
  const writable = user.role !== "Viewer";
  useEffect(() => { // “Quick record” app shortcut
    if (params.get("quick") === "1") { setQuick(writable); params.delete("quick"); setParams(params, { replace: true }); }
  }, [params, setParams, writable]);
  if (farmCount === 0) return <Onboarding />;
  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-sidebar md:block">
        <Brand />
        <NavList />
        <div className="border-t border-sidebar-border p-3">
          <NavLink to="/account" className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent"><UserRound className="h-5 w-5" />My account</NavLink>
          <button onClick={() => { void signOut(); }} className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent"><LogOut className="h-5 w-5" />Sign out</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="glass sticky top-0 z-30 border-b pt-safe">
          <div className="flex items-center gap-2 px-3 py-2 sm:px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground md:hidden"><Sprout className="h-5 w-5" /></div>
            <FarmSwitcher />
            <div className="ml-auto flex items-center gap-2">
              <SyncBadge />
              <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary lg:inline">{user.role}</span>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full" aria-label={`Notifications (${alerts})`} onClick={() => navigate("/notifications")}>
                <Bell className="h-5 w-5" />
                {alerts > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-background">{alerts}</span>}
              </Button>
              <AccountMenu />
            </div>
          </div>
          {!online && <div role="status" className="flex items-center justify-center gap-2 bg-warning/15 py-1.5 text-xs font-medium"><WifiOff className="h-3.5 w-3.5" />Offline – everything you record is saved on this device</div>}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-32 sm:p-6 md:pb-10" key={loc.pathname.split("/")[1]}>
          <ShiftTracker />
          {isDemo && (
            <div role="note" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm">
              <span><b>Sample data.</b> You’re looking at a demo farm, not your own records.</span>
              <Button size="sm" onClick={() => { clearDemoData(); }}>Remove &amp; start my farm</Button>
            </div>
          )}
          <PwaBanner />
          <AdoptLocalBanner />
          <Outlet />
        </main>
      </div>
      <TabBar onMore={() => setOpen(true)} onQuick={() => setQuick(true)} canRecord={writable} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto border-sidebar-border bg-sidebar p-0 pt-safe text-sidebar-foreground [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Brand />
          <NavList onNavigate={() => setOpen(false)} />
          {pwa.canInstall && <div className="px-3 pb-2"><button onClick={() => { void pwa.install(); setOpen(false); }} className="flex min-h-[44px] w-full items-center gap-3 rounded-lg bg-sidebar-primary px-3 text-sm font-semibold text-sidebar-primary-foreground"><Download className="h-5 w-5" />Install app</button></div>}
          <div className="px-5 pb-6 pt-2 text-xs text-sidebar-foreground/60">
            {user.name} · {user.role}
            <NavLink to="/account" onClick={() => setOpen(false)} className="mt-3 flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"><UserRound className="h-5 w-5" />My account &amp; password</NavLink>
            <button className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-lg bg-sidebar-accent px-3 text-sm font-semibold text-sidebar-accent-foreground" onClick={() => { void signOut(); }}><LogOut className="h-5 w-5" />Sign out</button>
          </div>
        </SheetContent>
      </Sheet>
      {writable && (
        <>
          <Button size="lg" className="fixed bottom-6 right-6 z-40 hidden h-14 rounded-full px-5 text-base shadow-lg md:inline-flex" onClick={() => setQuick(true)} aria-label="Quick record">
            <Plus className="mr-1.5 h-5 w-5" />Quick record
          </Button>
          <QuickRecord open={quick} onClose={() => setQuick(false)} />
        </>
      )}
    </div>
  );
}

export const Page = ({ children }: { children: ReactNode }) => <div className="space-y-5">{children}</div>;
export { rowsOf };
