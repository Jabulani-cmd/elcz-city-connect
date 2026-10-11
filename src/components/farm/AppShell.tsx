import { Bell, BarChart3, Boxes, Cloud, CloudOff, FileText, LayoutDashboard, ListChecks, Map as MapIcon, Menu, PawPrint, Plus, Settings, Sparkles, Sprout, Users, Wallet, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { computeAlerts } from "@/lib/alerts";
import { canRead } from "@/lib/permissions";
import { createFarm, rowsOf, setActiveFarm, usePendingCount, useStore, useUser, useFarms, useFarm } from "@/lib/store";
import { useOnline } from "@/lib/sync";
import type { Section } from "@/lib/types";
import { cn } from "@/lib/utils";
import { nativeSelect } from "./kit";
import { QuickRecord } from "./QuickRecord";

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
  return (
    <span title={online ? "Changes are saved on this device. Cloud sync is not connected yet." : "You are offline. Everything you record is saved on this device."}
      className={cn("hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex", online ? "text-muted-foreground" : "border-warning/50 bg-warning/10 text-foreground")}>
      {online ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      {online ? "Online" : "Offline"} · {pending} saved on device
    </span>
  );
}

function FarmSwitcher() {
  const farms = useFarms();
  const farm = useFarm();
  const navigate = useNavigate();
  return (
    <select aria-label="Switch farm" className={cn(nativeSelect, "h-10 max-w-[11rem] sm:max-w-xs")} value={farm?.id ?? ""}
      onChange={(e) => {
        if (e.target.value === "__new") { createFarm({ name: "New farm" }); navigate("/settings"); }
        else setActiveFarm(e.target.value);
      }}>
      {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      <option value="__new">+ Add a farm…</option>
    </select>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [quick, setQuick] = useState(false);
  const user = useUser();
  const alerts = useAlertCount();
  const navigate = useNavigate();
  const loc = useLocation();
  const writable = user.role !== "Viewer";
  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-sidebar md:block">
        <Brand />
        <NavList />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur sm:px-5">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></Button>
          <FarmSwitcher />
          <div className="ml-auto flex items-center gap-2">
            <SyncBadge />
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary lg:inline">{user.role}</span>
            <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${alerts})`} onClick={() => navigate("/notifications")}>
              <Bell className="h-5 w-5" />
              {alerts > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">{alerts}</span>}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-28 sm:p-6 md:pb-8" key={loc.pathname.split("/")[1]}>
          <Outlet />
        </main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Brand />
          <NavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      {writable && (
        <>
          <Button size="lg" className="fixed bottom-5 right-5 z-40 h-14 rounded-full px-5 text-base shadow-lg" onClick={() => setQuick(true)} aria-label="Quick record">
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
