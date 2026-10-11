import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONE = {
  default: "text-primary bg-primary/10",
  good: "text-success bg-success/10",
  warn: "text-warning bg-warning/15",
  bad: "text-danger bg-danger/10",
  info: "text-info bg-info/10",
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "default", to }: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; tone?: keyof typeof TONE; to?: string }) {
  const body = (
    <Card className={cn("flex items-center gap-3 p-4", to && "transition-colors hover:bg-muted/50")}>
      {Icon && <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE[tone])}><Icon className="h-5 w-5" /></div>}
      <div className="min-w-0">
        <div className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate text-xl font-bold leading-tight tabular-nums">{value}</div>
        {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
      </div>
    </Card>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return <div role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">{children}</div>;
}

export const nativeSelect = "flex h-11 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm";
