import { saveRecord } from "./rules";
import { addDays, todayISO } from "./calc";
import type { AiTaskSuggestion } from "./ai";

/**
 * Automates the creation of tasks based on AI suggestions.
 */
export function automateAiTasks(suggestions: AiTaskSuggestion[], section: string = "General") {
  const createdIds: string[] = [];

  for (const sug of suggestions) {
    const dueDate = addDays(todayISO(), sug.dueDateOffsetDays);

    const task = saveRecord("tasks", {
      name: sug.title,
      description: `AI Suggestion: ${sug.description}`,
      priority: sug.priority,
      dueDate: dueDate,
      section: section,
      status: "To do",
    });

    createdIds.push(task.id);
  }

  return createdIds;
}
