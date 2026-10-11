import { useMemo } from "react";
import { computeAlerts, type Severity } from "@/lib/alerts";
import { useStore } from "@/lib/store";

export const SEV_STYLE: Record<Severity, string> = { danger: "border-danger/40 bg-danger/10", warning: "border-warning/50 bg-warning/10", info: "border-info/30 bg-info/10" };
export const SEV_TEXT: Record<Severity, string> = { danger: "text-danger", warning: "text-warning", info: "text-info" };

/** Alerts for the active farm, recomputed whenever any record changes. */
export function useAlerts() {
  const data = useStore((s) => s.data);
  const farmId = useStore((s) => s.activeFarmId);
  return useMemo(() => computeAlerts((c) => (data[c] ?? []).filter((r) => r.farmId === farmId)), [data, farmId]);
}
