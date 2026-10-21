import { AlertTriangle, Baby, Banknote, Beef, Droplets, HeartPulse, Leaf, Map, Scale, Sprout, TrendingDown, TrendingUp, Users, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarCard, LineCard, PieCard } from "@/components/farm/charts";
import { Empty, nativeSelect, Panel, StatCard } from "@/components/farm/kit";
import { RecordDialog } from "@/components/farm/RecordDialog";
import { Progress } from "@/components/ui/progress";
import { groupSum, herdSeries, inRange, latestWeights } from "@/lib/analytics";
import { addDays, fmtMoney, fmtNum, herdCounts, lastMonths, round, sum, toNum, todayISO } from "@/lib/calc";
import { farmKpis } from "@/lib/finance";
import { cropCost, cropRevenue, labelOf } from "@/lib/schema";
import { useFarm, useRows, useUser } from "@/lib/store";
import { canWrite } from "@/lib/permissions";
import type { Row } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SEV_STYLE, SEV_TEXT, useAlerts } from "@/components/farm/alertUi";

const RANGES = { all: "All time", year: "This year", d30: "Last 30 days" } as const;

export default function Dashboard() {
  const farm = useFarm();
  const animals = useRows("animals");
  const weights = useRows("weights");
  const income = useRows("income");
  const expenses = useRows("expenses");
  const crops = useRows("crops");
  const fields = useRows("fields");
  const employees = useRows("employees");
  const births = useRows("births");
  const sales = useRows("sales");
  const purchases = useRows("purchases");
  const deaths = useRows("mortality");
  const breeding = useRows("breeding");
  const health = useRows("health");
  const fert = useRows("fertilizer");
  const prot = useRows("protection");
  const irr = useRows("irrigation");
  const pastures = useRows("pastures");
  const alerts = useAlerts();
  const [range, setRange] = useState<keyof typeof RANGES>("all");
  const user = useUser();
  const tasksAll = useRows("tasks");
  const [recording, setRecording] = useState<string | null>(null);

  const today = todayISO();
  const period = range === "year" ? { from: `${today.slice(0, 4)}-01-01` } : range === "d30" ? { from: addDays(today, -30) } : {};
  const inc = useMemo(() => income.filter((r) => range === "all" || inRange(r.date, period)), [income, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const exp = useMemo(() => expenses.filter((r) => range === "all" || inRange(r.date, period)), [expenses, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const herd = herdCounts(animals, breeding);
  const k = farmKpis(inc, exp, animals, weights, sum(crops.filter((c) => !c.actualHarvestDate), "areaHa"));
  const live = animals.filter((a) => a.status === "Active" || a.status === "Quarantined");
  const latest = latestWeights(weights);
  const adgList = live.map((a) => latest.get(a.id)).filter((w) => w && w.previousWeight !== "" && w.previousWeight != null).map((w) => toNum(w!.adg));
  const avgAdg = adgList.length ? adgList.reduce((a, b) => a + b, 0) / adgList.length : 0;
  const attention = new Set([...health.filter((h) => h.recovery === "Ongoing").map((h) => h.animalId), ...animals.filter((a) => a.status === "Quarantined").map((a) => a.id)]);
  const year = today.slice(0, 4);
  const yearOf = (rows: Row[], key: string) => rows.filter((r) => String(r[key]).startsWith(year)).length;

  const growing = crops.filter((c) => !c.actualHarvestDate);
  const ready = growing.filter((c) => c.expectedHarvestDate && c.expectedHarvestDate <= addDays(today, 14));
  const cropCtx = { rows: (c: string) => (c === "fertilizer" ? fert : c === "protection" ? prot : c === "irrigation" ? irr : []) };
  const healthCounts = groupSum(growing, (c) => c.health || "Unknown", () => 1);
  const irrProblems = irr.filter((r) => r.problems && r.date >= addDays(today, -14)).length;
  const lastIrr = irr.length ? [...irr].sort((a, b) => b.date.localeCompare(a.date))[0] : undefined;

  const months = lastMonths(6).map((m) => ({ month: m.slice(2), Income: sum(income.filter((r) => r.date?.startsWith(m)), "amount"), Expenses: sum(expenses.filter((r) => r.date?.startsWith(m)), "amount") }));
  const composition = groupSum(live, (a) => a.category, () => 1);
  const recent = [...income.map((r): Row => ({ ...r, kind: "in" })), ...expenses.map((r): Row => ({ ...r, kind: "out" }))].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  const cashFlow = sum(inc.filter((r) => r.paymentStatus !== "Outstanding"), "amount") - sum(exp.filter((r) => r.paymentStatus !== "Outstanding"), "amount");
  const cropRev = crops.reduce((s, c) => s + cropRevenue(c), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  if (!farm) return <Empty>No farm yet. Add one in Settings.</Empty>;
  return (
    <div className="space-y-6">
      <section aria-label="Summary" className="bg-hero relative -mx-4 -mt-4 overflow-hidden rounded-b-3xl px-5 pb-6 pt-6 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm text-white/75">{greeting}{user.name && user.name !== "Farm Owner" ? `, ${user.name.split(" ")[0]}` : ""}</p>
        <h1 className="mt-0.5 text-2xl font-bold sm:text-3xl">{farm.name}</h1>
        <p className="text-sm text-white/70">{[farm.location, farm.farmType].filter(Boolean).join(" · ")}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-xl">
          {[["Animals", herd.total, "/livestock/herd"], ["Alerts", alerts.filter((a) => a.severity !== "info").length, "/notifications"], ["Tasks today", tasksAll.filter((t) => t.status !== "Done" && t.dueDate <= today).length, "/tasks"]].map(([l, v, to]) => (
            <Link key={String(l)} to={String(to)} className="rounded-2xl bg-white/10 p-3 backdrop-blur transition-colors active:bg-white/20"><div className="text-2xl font-bold tabular-nums">{v}</div><div className="text-xs text-white/75">{l}</div></Link>
          ))}
        </div>
        {canWrite(user.role, "livestock") && (
          <div className="scrollbar-none -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {[["weights", "Weigh"], ["health", "Treat"], ["vaccinations", "Vaccinate"], ["feedUsage", "Feed used"], ["expenses", "Expense"]].map(([r, l]) => (
              <button key={r} onClick={() => setRecording(r)} className="shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[hsl(142_60%_18%)] shadow-sm transition-transform active:scale-95">+ {l}</button>
            ))}
          </div>
        )}
      </section>
      <div className="flex justify-end">
        <select aria-label="Period" className={cn(nativeSelect, "w-auto")} value={range} onChange={(e) => setRange(e.target.value as keyof typeof RANGES)}>{Object.entries(RANGES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>

      <section aria-label="Alerts">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">Needs your attention</h2><Link to="/notifications" className="text-sm text-primary underline">See all ({alerts.length})</Link></div>
        {alerts.length === 0 ? <Empty>All clear – nothing needs attention right now.</Empty> : (
          <ul className="grid gap-2 md:grid-cols-2">
            {alerts.slice(0, 6).map((a) => (
              <li key={a.id}><Link to={a.to} className={cn("flex items-start gap-3 rounded-xl border p-3 hover:opacity-90", SEV_STYLE[a.severity])}>
                <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", SEV_TEXT[a.severity])} />
                <div className="min-w-0"><div className="truncate font-medium">{a.title}</div><div className="truncate text-sm text-muted-foreground">{a.detail}</div></div>
              </Link></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Farm overview">
        <h2 className="mb-2 text-lg font-semibold">Farm overview</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total farm area" value={`${fmtNum(toNum(farm.sizeHa), 0)} ha`} icon={Map} to="/map" />
          <StatCard label="Agricultural land" value={`${fmtNum(toNum(farm.agriHa), 0)} ha`} icon={Leaf} />
          <StatCard label="Pasture area" value={`${fmtNum(toNum(farm.pastureHa) || sum(pastures, "areaHa"), 0)} ha`} />
          <StatCard label="Active employees" value={employees.filter((e) => e.status === "Active").length} icon={Users} to="/employees/staff" />
          <StatCard label="Livestock" value={herd.total} icon={Beef} to="/livestock/herd" />
          <StatCard label="Cattle" value={herd.cattle} />
          <StatCard label="Other livestock" value={herd.other} />
          <StatCard label="Needing medical attention" value={attention.size} icon={HeartPulse} tone={attention.size ? "warn" : "good"} to="/livestock/health" />
        </div>
      </section>

      <section aria-label="Financial overview">
        <h2 className="mb-2 text-lg font-semibold">Money <span className="text-sm font-normal text-muted-foreground">({RANGES[range].toLowerCase()})</span></h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total income" value={fmtMoney(k.revenue)} icon={TrendingUp} tone="good" to="/finance/income" />
          <StatCard label="Total expenses" value={fmtMoney(k.expenses)} icon={TrendingDown} tone="bad" to="/finance/expenses" />
          <StatCard label="Net profit" value={fmtMoney(k.netProfit)} icon={Banknote} tone={k.netProfit >= 0 ? "good" : "bad"} hint={`Margin ${k.margin}% · ROI ${k.roi}%`} to="/finance/overview" />
          <StatCard label="Outstanding payments" value={fmtMoney(k.outstandingPayable)} tone={k.outstandingPayable ? "warn" : "good"} hint={`Cash flow ${fmtMoney(cashFlow)}`} />
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <Panel title="Income vs expenses (6 months)" className="lg:col-span-2"><BarCard data={months} x="month" bars={[{ key: "Income" }, { key: "Expenses", color: "#b5483a" }]} /></Panel>
          <Panel title="Recent transactions">
            {recent.length === 0 ? <Empty>No transactions yet.</Empty> : <ul className="divide-y text-sm">{recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2"><div className="min-w-0"><div className="truncate">{r.description}</div><div className="text-xs text-muted-foreground">{r.date} · {r.category}</div></div><b className={cn("shrink-0 tabular-nums", r.kind === "in" ? "text-success" : "text-danger")}>{r.kind === "in" ? "+" : "−"}{fmtMoney(toNum(r.amount))}</b></li>
            ))}</ul>}
          </Panel>
        </div>
      </section>

      <section aria-label="Livestock overview">
        <h2 className="mb-2 text-lg font-semibold">Livestock</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Herd size" value={herd.total} icon={Beef} to="/livestock/stats" />
          <StatCard label="Average weight" value={`${fmtNum(herd.avgWeight, 0)} kg`} icon={Scale} to="/livestock/weights" />
          <StatCard label="Average daily gain" value={`${fmtNum(avgAdg, 2)} kg`} tone="good" />
          <StatCard label={`Births ${year}`} value={yearOf(births, "birthDate")} icon={Baby} tone="good" />
          <StatCard label={`Purchased ${year}`} value={yearOf(purchases, "date")} />
          <StatCard label={`Sold ${year}`} value={yearOf(sales, "date")} />
          <StatCard label={`Deaths ${year}`} value={yearOf(deaths, "date")} tone={yearOf(deaths, "date") ? "bad" : "default"} />
          <StatCard label="Mortality rate" value={herd.total ? `${round((yearOf(deaths, "date") / herd.total) * 100, 1)}%` : "0%"} />
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <Panel title="Herd size (12 months)" className="lg:col-span-2"><LineCard data={herdSeries(animals, "monthly")} x="label" lines={[{ key: "herd", name: "Herd" }]} /></Panel>
          <Panel title="Herd makeup"><PieCard data={composition} /></Panel>
        </div>
      </section>

      <section aria-label="Agriculture overview">
        <h2 className="mb-2 text-lg font-semibold">Crops</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Crops planted" value={growing.length} icon={Sprout} to="/agriculture/crops" />
          <StatCard label="Area planted" value={`${fmtNum(sum(growing, "areaHa"))} ha`} />
          <StatCard label="Ready to harvest soon" value={ready.length} icon={Wheat} tone={ready.length ? "warn" : "default"} to="/agriculture/harvests" />
          <StatCard label="Expected harvest" value={`${fmtNum(sum(growing, "expectedYield"))} t`} />
          <StatCard label="Production cost" value={fmtMoney(crops.reduce((s, c) => s + cropCost(c, cropCtx), 0))} />
          <StatCard label="Crop revenue" value={fmtMoney(cropRev)} tone="good" />
          <StatCard label="Irrigation" value={irrProblems ? `${irrProblems} problem${irrProblems === 1 ? "" : "s"}` : "Running OK"} icon={Droplets} tone={irrProblems ? "warn" : "good"} hint={lastIrr ? `Last: ${lastIrr.date}` : "No records"} to="/agriculture/irrigation" />
          <StatCard label="Yield (harvested)" value={`${fmtNum(sum(crops, "actualYield"))} t`} />
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Panel title="Crop health"><PieCard data={healthCounts} height={190} /></Panel>
          <Panel title="Growing crops">
            {growing.length === 0 ? <Empty>Nothing planted.</Empty> : <ul className="space-y-3">{growing.map((c) => {
              const total = Math.max(1, (new Date(c.expectedHarvestDate).getTime() - new Date(c.plantingDate).getTime()) / 864e5);
              const done = Math.min(100, Math.max(0, ((Date.now() - new Date(c.plantingDate).getTime()) / 864e5 / total) * 100));
              return <li key={c.id}><div className="mb-1 flex justify-between text-sm"><span>{labelOf("crops", c)} · {labelOf("fields", fields.find((f) => f.id === c.fieldId))}</span><span className="text-muted-foreground">{Math.round(done)}% to harvest</span></div><Progress value={done} className="h-2" /></li>;
            })}</ul>}
          </Panel>
        </div>
      </section>
      {recording && <RecordDialog resource={recording} open onClose={() => setRecording(null)} />}
    </div>
  );
}
