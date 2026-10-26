import { rowsOf } from "./store";
import { saveRecord } from "./rules";
import { todayISO } from "./calc";

export type ProactiveInsight = {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  collection: string;
  rowId: string;
  actionLabel: string;
  onAction: () => void;
};

/**
 * Scans farm data for issues that require attention (e.g. overdue vaccinations).
 */
export function scanForInsights(): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const now = todayISO();

  // 1. Overdue Vaccinations
  const vax = rowsOf("vaccinations");
  const overdueVax = vax.filter(v => v.status === "To do" && v.dueDate < now);

  overdueVax.forEach(v => {
    insights.push({
      id: `vax-${v.id}`,
      title: "Overdue Vaccination",
      description: `Vaccination ${v.name} was due on ${v.dueDate}.`,
      priority: "High",
      collection: "vaccinations",
      rowId: v.id,
      actionLabel: "Mark as Done",
      onAction: () => saveRecord("vaccinations", { id: v.id, status: "Done", date: now })
    });
  });

  // 2. Critical Health Issues (Emergency Urgency)
  const health = rowsOf("health");
  const criticalHealth = health.filter(h => h.urgency === "Emergency" && h.recovery !== "Recovered");

  criticalHealth.forEach(h => {
    insights.push({
      id: `health-${h.id}`,
      title: "Critical Health Alert",
      description: `Animal ${h.animalId} has an emergency condition: ${h.condition}.`,
      priority: "Urgent",
      collection: "health",
      rowId: h.id,
      actionLabel: "Update Status",
      onAction: () => { /* Navigation logic usually handled by UI */ }
    });
  });

  // 3. Unscheduled AI suggestions (if we stored them in a way that can be scanned)
  // For now, these are created as tasks, so we scan for overdue High priority tasks
  const tasks = rowsOf("tasks");
  const overdueTasks = tasks.filter(t => t.status === "To do" && t.dueDate < now && t.priority === "High");

  overdueTasks.forEach(t => {
    insights.push({
      id: `task-${t.id}`,
      title: "High Priority Task Overdue",
      description: `Task "${t.name}" is overdue since ${t.dueDate}.`,
      priority: "Medium",
      collection: "tasks",
      rowId: t.id,
      actionLabel: "Complete Task",
      onAction: () => saveRecord("tasks", { id: t.id, status: "Done", date: now })
    });
  });

  return insights;
}
