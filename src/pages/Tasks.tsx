import { CalendarDays, ChevronLeft, ChevronRight, KanbanSquare, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, Empty } from "@/components/farm/kit";
import { RecordDialog } from "@/components/farm/RecordDialog";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { todayISO } from "@/lib/calc";
import { toneClass } from "@/lib/format";
import { canWrite } from "@/lib/permissions";
import { saveRecord } from "@/lib/rules";
import { labelOf, TASK_STATUS } from "@/lib/schema";
import { useRows, useUser } from "@/lib/store";
import type { Row } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIEWS = [{ id: "list", label: "List", icon: List }, { id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "board", label: "Board", icon: KanbanSquare }] as const;
const PRIORITY_DOT: Record<string, string> = { Urgent: "bg-danger", High: "bg-warning", Medium: "bg-info", Low: "bg-muted-foreground" };

function TaskCard({ t, onEdit, onMove, writable }: { t: Row; onEdit: () => void; onMove?: (dir: -1 | 1) => void; writable: boolean }) {
  const employees = useRows("employees");
  const overdue = t.status !== "Done" && t.dueDate < todayISO();
  return (
    <Card className="p-3">
      <button className="w-full text-left" onClick={onEdit} disabled={!writable}>
        <div className="flex items-start gap-2"><span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", PRIORITY_DOT[t.priority])} title={`${t.priority} priority`} /><div className="font-medium leading-snug">{t.name}</div></div>
        <div className="mt-1 text-xs text-muted-foreground">{labelOf("employees", employees.find((e) => e.id === t.employeeId)) !== "–" ? labelOf("employees", employees.find((e) => e.id === t.employeeId)) : "Unassigned"} · {t.section}</div>
        <div className={cn("mt-1 text-xs", overdue ? "font-semibold text-danger" : "text-muted-foreground")}>Due {t.dueDate || "–"}{overdue && " · overdue"}</div>
      </button>
      {onMove && writable && (
        <div className="mt-2 flex justify-between">
          <Button variant="outline" size="sm" disabled={t.status === TASK_STATUS[0]} onClick={() => onMove(-1)} aria-label="Move back"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" disabled={t.status === TASK_STATUS[2]} onClick={() => onMove(1)} aria-label="Move forward"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </Card>
  );
}

function Board({ tasks, edit, writable }: { tasks: Row[]; edit: (t: Row) => void; writable: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TASK_STATUS.map((s, idx) => {
        const col = tasks.filter((t) => t.status === s).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        return (
          <section key={s} aria-label={s} className="rounded-xl bg-muted/50 p-3">
            <h3 className="mb-2 flex items-center justify-between text-sm font-semibold">{s}<span className={`rounded-full px-2 py-0.5 text-xs ${toneClass(s)}`}>{col.length}</span></h3>
            <div className="space-y-2">{col.map((t) => <TaskCard key={t.id} t={t} writable={writable} onEdit={() => edit(t)} onMove={(d) => saveRecord("tasks", { id: t.id, status: TASK_STATUS[idx + d] })} />)}{!col.length && <p className="py-4 text-center text-xs text-muted-foreground">Nothing here</p>}</div>
          </section>
        );
      })}
    </div>
  );
}

function Calendar({ tasks, edit, writable }: { tasks: Row[]; edit: (t: Row) => void; writable: boolean }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(todayISO());
  const days = useMemo(() => {
    const first = new Date(cursor);
    const pad = (first.getDay() + 6) % 7; // Monday first
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(pad).fill(null), ...Array.from({ length: count }, (_, i) => `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)];
  }, [cursor]);
  const on = (d: string) => tasks.filter((t) => t.dueDate === d);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="font-semibold">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</h3>
        <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => d ? (
          <button key={d} onClick={() => setSelected(d)} aria-label={d} className={cn("flex min-h-[3.5rem] flex-col items-center rounded-lg border bg-card p-1 text-sm", d === selected && "ring-2 ring-primary", d === todayISO() && "border-primary")}>
            <span>{Number(d.slice(8))}</span>
            <span className="mt-auto flex gap-0.5">{on(d).slice(0, 3).map((t) => <span key={t.id} className={cn("h-1.5 w-1.5 rounded-full", t.status === "Done" ? "bg-success" : PRIORITY_DOT[t.priority])} />)}</span>
          </button>
        ) : <div key={i} />)}
      </div>
      <div className="space-y-2"><h3 className="text-sm font-semibold">{selected}</h3>{on(selected).length ? on(selected).map((t) => <TaskCard key={t.id} t={t} writable={writable} onEdit={() => edit(t)} />) : <Empty>No tasks due this day.</Empty>}</div>
    </div>
  );
}

export default function Tasks() {
  const tasks = useRows("tasks");
  const role = useUser().role;
  const writable = canWrite(role, "tasks");
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("board");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  return (
    <div>
      <PageHeader title="Tasks" description="Assign work to your team and track it from to-do to done."
        actions={writable && <Button size="lg" onClick={() => setEditing("new")}><Plus className="mr-1.5 h-4 w-4" />New task</Button>} />
      <div className="mb-4 inline-flex rounded-lg border bg-card p-1" role="tablist" aria-label="Task view">
        {VIEWS.map((v) => <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={cn("inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-4 text-sm font-medium", view === v.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}><v.icon className="h-4 w-4" />{v.label}</button>)}
      </div>
      {view === "list" && <ResourceManager resource="tasks" section="tasks" hideTitle />}
      {view === "calendar" && <Calendar tasks={tasks} writable={writable} edit={setEditing} />}
      {view === "board" && <Board tasks={tasks} writable={writable} edit={setEditing} />}
      <RecordDialog resource="tasks" open={!!editing} row={editing && editing !== "new" ? editing : undefined} onClose={() => setEditing(null)} />
    </div>
  );
}
