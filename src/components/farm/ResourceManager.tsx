import { cn } from "@/lib/utils";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
        <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={`Search ${res.title}`} className="h-11 pl-9 md:h-10" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {res.filter && (
          <select aria-label={res.filter.label} className={cn(nativeSelect, "w-auto")} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All {res.filter.label.toLowerCase()}</option>
            {filterOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        <Button variant="outline" size="lg" className="md:h-10" onClick={doExport} disabled={!rows.length}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
        {writable && <Button size="lg" className="md:h-10" onClick={() => open("new")}><Plus className="mr-1.5 h-4 w-4" />{addLabel ?? `Add ${res.singular}`}</Button>}
      </div>
      {res.help && <p className="mb-3 text-sm text-muted-foreground">{res.help}</p>}

      {rows.length === 0 ? (
        <Empty>{all.length ? "Nothing matches your search or filter." : `No ${res.title.toLowerCase()} yet.${writable ? ` Tap “${addLabel ?? `Add ${res.singular}`}” to create the first one.` : ""}`}</Empty>
      ) : (
        <>
          {/* phones: cards */}
          <div className="space-y-2 md:hidden">
            {rows.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-base font-semibold">{cell(columns[0], r)}</div>
                  <div className="flex shrink-0 items-center">
                    {rowActions?.(r)}
                    {writable && <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button>}
                    {writable && <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4 text-danger" /></Button>}
                  </div>
                </div>
                <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  {columns.slice(1).map((c) => (
                    <div key={c} className="min-w-0"><dt className="text-xs text-muted-foreground">{columnLabel(res, c)}</dt><dd className="truncate">{cell(c, r)}</dd></div>
                  ))}
                </dl>
              </Card>
            ))}
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
