import { Bell, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scanForInsights, type ProactiveInsight } from "@/lib/proactive";

export function InsightsBanner() {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const refresh = async () => {
    setIsScanning(true);
    try {
      const result = scanForInsights();
      setInsights(result);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (insights.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Bell className="h-4 w-4" />
          <span>Proactive Insights</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh} disabled={isScanning}>
          {isScanning ? "Scanning..." : "Refresh"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((i) => (
          <div key={i.id} className="flex items-start gap-3 rounded-xl border p-3 shadow-sm bg-card">
            <div className={`mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-white ${
              i.priority === "Urgent" ? "bg-danger" :
              i.priority === "High" ? "bg-orange-500" :
              i.priority === "Medium" ? "bg-warning" : "bg-success"
            }`}>
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-none mb-1">{i.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{i.description}</div>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" className="h-7 px-2 text-xs" onClick={() => {
                  i.onAction();
                  toast.success("Action completed");
                  refresh();
                }}>
                  {i.actionLabel}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => {
                  // In a real app, this would navigate to the specific record
                  toast.info(`Opening ${i.collection} record...`);
                }}>
                  Details <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
