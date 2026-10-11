import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageHeader } from "./kit";

export type ModuleItem = { id: string; label: string; group?: string; render: () => ReactNode };

/** A module with a sub-navigation (pills on phones, side list on large screens). */
export function ModulePage({ title, description, base, items, current }: { title: string; description?: string; base: string; items: ModuleItem[]; current?: string }) {
  const active = items.find((i) => i.id === current) ?? items[0];
  const groups = [...new Set(items.map((i) => i.group ?? ""))];
  const pill = (i: ModuleItem) => (
    <Link key={i.id} to={`${base}/${i.id}`} aria-current={i.id === active.id ? "page" : undefined}
      className={cn("shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors lg:flex lg:rounded-lg lg:border-0 lg:px-3 lg:py-2", i.id === active.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted lg:bg-transparent")}>
      {i.label}
    </Link>
  );
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:gap-6">
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden" role="navigation" aria-label={`${title} sections`}>{items.map(pill)}</div>
        <nav className="sticky top-20 hidden self-start lg:block" aria-label={`${title} sections`}>
          {groups.map((g) => (
            <div key={g} className="mb-3">
              {g && <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</div>}
              <div className="flex flex-col">{items.filter((i) => (i.group ?? "") === g).map(pill)}</div>
            </div>
          ))}
        </nav>
        <div className="min-w-0" key={active.id}>{active.render()}</div>
      </div>
    </div>
  );
}
