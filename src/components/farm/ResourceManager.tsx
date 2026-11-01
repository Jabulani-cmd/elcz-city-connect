import { cn } from "@/lib/utils";
import { ChevronDown, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cellText, columnLabel, isToneField, rawCell, toneClass } from "@/lib/format";
import { exportCsv } from "@/lib/export";
import { canWrite } from "@/lib/permissions";
import { deleteRecord } from "@/lib/rules";
import { RESOURCES } from "@/lib/schema";
import { useRows, useStore, useUser } from "@/lib/store";
import type { Row, Section, Values } from "@/lib/types";
import { RecordDialog } from "./RecordDialog";
import { Empty, nativeSelect } from "./kit";

/** Fields shown on a phone card before “more details”. */
const PREVIEW = 4;

type Props = {
  resource: string;
  section: Section;
  /** Shown above the table (analytics, tips, quick actions). */
  header?: ReactNode;
  rowActions?: (row: Row) => ReactNode;
  hideTitle?: boolean;
  /** Pre-fill values when adding. */
  defaults?: Values;
  /** Only show rows matching this predicate. */
  where?: (row: Row) => boolean;
  addLabel?: string;
};

export function ResourceManager({ resource, section, header, rowActions, hideTitle, defaults, where, addLabel }: Props) {
  const res = RESOURCES[resource];
  const all = useRows(res.collection);
  useStore((s) => s.data); // re-render when related collections change (derived columns)
  const role = useUser().role;
  const writable = canWrite(role, section);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const columns = [...res.columns, ...(res.derivedColumns ?? [])];
  const rows = useMemo(() => {
    let list = where ? all.filter(where) : all;
    if (filter && res.filter) list = list.filter((r) => String(r[res.filter!.key]) === filter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      const keys = res.search ?? res.columns;
      list = list.filter((r) => keys.some((k) => cellText(res, k, r).toLowerCase().includes(needle)));
    }
    const sorted = [...list];
    if (res.sort) sorted.sort(res.sort);
    else sorted.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return sorted;
  }, [all, where, filter, q, res]);

  const filterOptions = useMemo(() => {
    if (!res.filter) return [];
    const f = res.fields.find((x) => x.key === res.filter!.key);
    return f?.options ?? [...new Set(all.map((r) => String(r[res.filter!.key] ?? "")).filter(Boolean))].sort();
  }, [all, res]);

  const open = (row: Row | "new") => setEditing(row);

  const doExport = () =>
    exportCsv({ title: res.title, headers: columns.map((c) => columnLabel(res, c)), rows: rows.map((r) => columns.map((c) => rawCell(res, c, r))) });

  const cell = (key: string, r: Row) => {
    const text = cellText(res, key, r);
    if (!text) return <span className="text-muted-foreground">–</span>;
    return isToneField(key) ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneClass(text)}`}>{text}</span> : text;
  };

  return (
    <div>
      {header}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!hideTitle && <h2 className="mr-auto text-lg font-semibold">{res.title} <span className="text-sm font-normal text-muted-foreground">({rows.length})</span></h2>}
        {writable && <Button size="lg" className={cn("h-11 px-4 md:order-last md:h-10", hideTitle && "ml-auto")} onClick={() => open("new")}><Plus className="h-4 w-4" />{addLabel ?? `Add ${res.singular}`}</Button>}
        <div className="flex w-full items-center gap-2 md:w-auto md:flex-1 md:justify-end">
          <div className="relative min-w-0 flex-1 md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label={`Search ${res.title}`} className="h-11 rounded-full bg-card pl-9 md:h-10" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {res.filter && (
            <select aria-label={res.filter.label} className={cn(nativeSelect, "w-auto max-w-[9.5rem] rounded-full bg-card")} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All {res.filter.label.toLowerCase()}</option>
              {filterOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full sm:w-auto sm:rounded-md sm:px-3 md:h-10" onClick={doExport} disabled={!rows.length} aria-label="Download as spreadsheet (CSV)"><Download className="h-4 w-4" /><span className="hidden sm:inline">CSV</span></Button>
        </div>
      </div>
      {res.help && <p className="mb-3 text-sm text-muted-foreground">{res.help}</p>}

      {rows.length === 0 ? (
        <Empty>{all.length ? "Nothing matches your search or filter." : `No ${res.title.toLowerCase()} yet.${writable ? ` Tap “${addLabel ?? `Add ${res.singular}`}” to create the first one.` : ""}`}</Empty>
      ) : (
        <>
          {/* phones: cards */}
          <div className="space-y-2.5 md:hidden">
            {rows.map((r) => {
              const tone = columns.slice(1).find((c) => isToneField(c) && cellText(res, c, r));
              const other = columns.slice(1).filter((c) => c !== tone);
              const filled = other.filter((c) => cellText(res, c, r));
              const preview = filled.slice(0, PREVIEW);
              const more = other.length - preview.length;
              const shown = expanded.has(r.id) ? other : preview;
              return (
                <Card key={r.id} className="rounded-2xl border-border/60 p-3.5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 pt-1">
                      <div className="min-w-0 truncate text-base font-semibold leading-tight">{cell(columns[0], r)}</div>
                      {tone && cell(tone, r)}
                    </div>
                    <div className="-mr-1.5 -mt-1.5 flex shrink-0 items-center">
                      {rowActions?.(r)}
                      {writable && <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button>}
                      {writable && <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-danger" /></Button>}
                    </div>
                  </div>
                  {shown.length > 0 && (
                    <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-2.5 text-sm">
                      {shown.map((c) => (
                        <div key={c} className="min-w-0"><dt className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{columnLabel(res, c)}</dt><dd className="truncate font-medium">{cell(c, r)}</dd></div>
                      ))}
                    </dl>
                  )}
                  {more > 0 && (
                    <button onClick={() => toggle(r.id)} aria-expanded={expanded.has(r.id)} className="-mb-1 mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-primary active:bg-muted">
                      {expanded.has(r.id) ? "Less" : `${more} more detail${more === 1 ? "" : "s"}`}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded.has(r.id) && "rotate-180")} />
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
          {/* larger screens: table */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>{columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2.5 font-medium">{columnLabel(res, c)}</th>)}<th className="w-24 px-3" /></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    {columns.map((c) => <td key={c} className="max-w-[16rem] truncate whitespace-nowrap px-3 py-2.5">{cell(c, r)}</td>)}
                    <td className="whitespace-nowrap px-2 text-right">
                      {rowActions?.(r)}
                      {writable && <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button>}
                      {writable && <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-danger" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <RecordDialog resource={resource} open={!!editing} row={editing && editing !== "new" ? editing : undefined} defaults={defaults} onClose={() => setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {res.singular}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.{res.collection === "animals" ? " The animal’s weights, health, vaccination and grazing records are deleted too." : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger hover:bg-danger/90" onClick={() => { if (deleting) { deleteRecord(res.collection, deleting.id); toast.success("Deleted"); } setDeleting(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
