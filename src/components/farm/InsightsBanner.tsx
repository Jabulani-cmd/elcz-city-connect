import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { scanForInsights, type ProactiveInsight } from "@/lib/proactive";
import { cn } from "@/lib/utils";

/** Where each kind of insight is looked after in the app. */
const PATH: Record<string, string> = { health: "/livestock/health", tasks: "/tasks" };
const TONE: Record<ProactiveInsight["priority"], string> = {
  Urgent: "bg-danger/10 text-danger",
  High: "bg-warning/15 text-warning",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-success/10 text-success",
};
const SHOW = 2;

/** Home-page list of things that need doing now. Compact on phones: two shown, the rest behind “Show all”. */
export function InsightsBanner() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [all, setAll] = useState(false);
  const refresh = () => setInsights(scanForInsights());
  useEffect(refresh, []);

  if (insights.length === 0) return null;
  const list = all ? insights : insights.slice(0, SHOW);

  return (
    <section aria-label="Needs doing now" className="mb-5 rounded-2xl border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold">Needs doing now <span className="ml-1 rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-bold text-destructive-foreground">{insights.length}</span></h2>
        <button onClick={refresh} aria-label="Check again" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground active:bg-muted"><RefreshCw className="h-4 w-4" /></button>
      </div>
      <ul className="divide-y">
        {list.map((i) => {
          const to = PATH[i.collection];
          return (
            <li key={i.id} className="flex items-center gap-3 py-2.5">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", TONE[i.priority])}><AlertTriangle className="h-4 w-4" /></span>
              <button className="min-w-0 flex-1 text-left" onClick={() => to && navigate(to)}>
                <div className="truncate text-sm font-semibold">{i.title}</div>
                <div className="line-clamp-2 text-xs text-muted-foreground">{i.description}</div>
              </button>
              {i.collection === "health" ? (
                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" aria-label="Open" onClick={() => to && navigate(to)}><ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button size="sm" variant="outline" className="h-9 shrink-0 px-3 text-xs" onClick={() => { i.onAction(); toast.success("Marked as done"); refresh(); }}>Done</Button>
              )}
            </li>
          );
        })}
      </ul>
      {insights.length > SHOW && (
        <button onClick={() => setAll((v) => !v)} className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-primary active:bg-muted">
          {all ? "Show less" : `Show all ${insights.length}`}<ChevronDown className={cn("h-4 w-4 transition-transform", all && "rotate-180")} />
        </button>
      )}
    </section>
  );
}
