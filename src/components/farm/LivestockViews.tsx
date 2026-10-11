import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AGE_GROUPS, ageGroup, avgBy, groupSum, herdSeries, latestWeights, monthlyCounts, type Granularity } from "@/lib/analytics";
import { feedlotMetrics, fmtMoney, fmtNum, herdCounts, round, sum, toNum, todayISO } from "@/lib/calc";
import { canWrite } from "@/lib/permissions";
import { moveAnimals } from "@/lib/rules";
import { animalCost, labelOf } from "@/lib/schema";
import { useRows, useUser } from "@/lib/store";
import type { Row } from "@/lib/types";
import { BarCard, LineCard } from "./charts";
import { Empty, nativeSelect, Panel, StatCard } from "./kit";
import { Baby, Beef, Scale, ShieldAlert, Skull, TrendingUp } from "lucide-react";

const isLive = (a: Row) => a.status === "Active" || a.status === "Quarantined";

/* ---------- 6. Herd statistics ---------- */
export function HerdStats() {
  const animals = useRows("animals");
  const breeding = useRows("breeding");
  const births = useRows("births");
  const purchases = useRows("purchases");
  const sales = useRows("sales");
  const deaths = useRows("mortality");
  const [g, setG] = useState<Granularity>("monthly");
  const c = herdCounts(animals, breeding);
  const year = todayISO().slice(0, 4);
  const series = useMemo(() => herdSeries(animals, g), [animals, g]);
  const months = useMemo(() => monthlyCounts(births, "birthDate").map((b, i) => ({
    month: b.month.slice(2), Births: b.count,
    Purchases: monthlyCounts(purchases, "date")[i].count, Sales: monthlyCounts(sales, "date")[i].count, Deaths: monthlyCounts(deaths, "date")[i].count,
  })), [births, purchases, sales, deaths]);
  const avgHerd = series.length ? series.reduce((a, s) => a + s.herd, 0) / series.length : 0;
  const yBirths = births.filter((b) => String(b.birthDate).startsWith(year)).length;
  const yDeaths = deaths.filter((d) => String(d.date).startsWith(year)).length;
  const first = series[0]?.herd ?? 0;
  const last = series[series.length - 1]?.herd ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total herd" value={c.total} icon={Beef} />
        <StatCard label="Bulls" value={c.bulls} />
        <StatCard label="Cows" value={c.cows} />
        <StatCard label="Heifers" value={c.heifers} />
        <StatCard label="Calves" value={c.calves} icon={Baby} />
        <StatCard label="Steers" value={c.steers} />
        <StatCard label="Breeding animals" value={c.breeding} />
        <StatCard label="Pregnant cows" value={c.pregnant} tone="info" />
        <StatCard label="In quarantine" value={c.quarantine} tone={c.quarantine ? "warn" : "default"} icon={ShieldAlert} />
        <StatCard label="Sold (total)" value={c.sold} />
        <StatCard label="Deceased (total)" value={c.deceased} tone={c.deceased ? "bad" : "default"} icon={Skull} />
        <StatCard label={`Births ${year}`} value={yBirths} tone="good" />
      </div>
      <Panel title="Herd size over time" action={
        <div className="flex gap-1" role="group" aria-label="Time range">
          {(["daily", "monthly", "annual"] as Granularity[]).map((x) => <Button key={x} size="sm" variant={g === x ? "default" : "outline"} onClick={() => setG(x)} className="capitalize">{x}</Button>)}
        </div>}>
        <LineCard data={series} x="label" lines={[{ key: "herd", name: "Herd size" }]} />
        <p className="mt-2 text-sm text-muted-foreground">Change over this period: <b>{last - first >= 0 ? "+" : ""}{last - first}</b> animals{first > 0 && <> ({round(((last - first) / first) * 100, 1)}% growth)</>}.</p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Births, purchases, sales and deaths (12 months)" className="lg:col-span-2">
          <BarCard data={months} x="month" bars={[{ key: "Births" }, { key: "Purchases" }, { key: "Sales" }, { key: "Deaths" }]} />
        </Panel>
        <Panel title="Rates (this year)">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt>Birth rate</dt><dd className="font-semibold">{avgHerd ? round((yBirths / avgHerd) * 100, 1) : 0}%</dd></div>
            <div className="flex justify-between"><dt>Mortality rate</dt><dd className="font-semibold">{avgHerd ? round((yDeaths / avgHerd) * 100, 1) : 0}%</dd></div>
            <div className="flex justify-between"><dt>Purchases</dt><dd className="font-semibold">{purchases.filter((p) => String(p.date).startsWith(year)).length}</dd></div>
            <div className="flex justify-between"><dt>Sales</dt><dd className="font-semibold">{sales.filter((p) => String(p.date).startsWith(year)).length}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- 7. Weight analytics ---------- */
export function WeightAnalytics() {
  const animals = useRows("animals");
  const weights = useRows("weights");
  const live = animals.filter(isLive);
  const latest = latestWeights(weights);
  const adgs = live.map((a) => ({ a, adg: toNum(latest.get(a.id)?.adg) })).filter((x) => x.adg !== 0 || latest.get(x.a.id)?.previousWeight !== "");
  const withAdg = adgs.filter((x) => latest.get(x.a.id)?.previousWeight !== "" && latest.get(x.a.id)?.previousWeight !== undefined);
  const avgAdg = withAdg.length ? withAdg.reduce((s, x) => s + x.adg, 0) / withAdg.length : 0;
  const ranked = [...withAdg].sort((x, y) => y.adg - x.adg);
  const avgW = herdCounts(animals).avgWeight;
  const byAge = AGE_GROUPS.map((n) => avgBy(live, (a) => ageGroup(a.dob), (a) => toNum(a.currentWeight)).find((r) => r.name === n) ?? { name: n, value: 0, count: 0 });
  const byBreed = avgBy(live, (a) => a.breed, (a) => toNum(a.currentWeight));
  const bySex = avgBy(live, (a) => a.sex, (a) => toNum(a.currentWeight));
  const list = (items: typeof ranked) => items.map((x) => (
    <li key={x.a.id} className="flex justify-between border-b py-1.5 last:border-0 text-sm"><span>{labelOf("animals", x.a)}</span><b className="tabular-nums">{fmtNum(x.adg, 2)} kg/day</b></li>
  ));
  return (
    <div className="mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Average herd weight" value={`${fmtNum(avgW)} kg`} icon={Scale} />
        <StatCard label="Average daily gain" value={`${fmtNum(avgAdg, 2)} kg/day`} icon={TrendingUp} tone="good" />
        <StatCard label="Animals weighed" value={`${latest.size} / ${live.length}`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Fastest growing"><ul>{ranked.length ? list(ranked.slice(0, 5)) : <Empty>Weigh animals at least twice to see growth.</Empty>}</ul></Panel>
        <Panel title="Slowest growing"><ul>{ranked.length ? list([...ranked].reverse().slice(0, 5)) : <Empty>No data yet.</Empty>}</ul></Panel>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Average weight by age"><BarCard data={byAge} x="name" bars={[{ key: "value", name: "kg" }]} height={190} /></Panel>
        <Panel title="Average weight by breed"><BarCard data={byBreed} x="name" bars={[{ key: "value", name: "kg", color: "#d98e04" }]} height={190} /></Panel>
        <Panel title="Average weight by sex"><BarCard data={bySex} x="name" bars={[{ key: "value", name: "kg", color: "#2b7bb9" }]} height={190} /></Panel>
      </div>
    </div>
  );
}

/* ---------- 12. Feedlot analytics ---------- */
export function FeedlotAnalytics() {
  const rows = useRows("feedlot");
  const animals = useRows("animals");
  const expenses = useRows("expenses");
  const m = rows.map((r) => ({ r, m: feedlotMetrics(r) }));
  const n = rows.length;
  const total = (pick: (x: (typeof m)[number]) => number) => m.reduce((s, x) => s + pick(x), 0);
  const totalGain = total((x) => x.m.gain);
  const totalFeedKg = total((x) => x.m.totalFeedKg);
  const totalFeed = total((x) => x.m.feedCost);
  const acquisition = rows.reduce((s, r) => s + animalCost(animals.find((a) => a.id === r.animalId) ?? ({} as Row), { rows: (c) => (c === "expenses" ? expenses : []) }), 0);
  const saleValue = total((x) => x.m.salePrice);
  const avgAdg = n ? m.reduce((s, x) => s + x.m.adg, 0) / n : 0;
  if (!n) return null;
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Animals in feedlot" value={n} icon={Beef} />
      <StatCard label="Average daily gain" value={`${fmtNum(avgAdg, 2)} kg/day`} tone="good" />
      <StatCard label="Feed conversion ratio" value={totalGain > 0 ? fmtNum(totalFeedKg / totalGain, 2) : "–"} hint="kg feed per kg gained" />
      <StatCard label="Cost per kg gained" value={totalGain > 0 ? fmtMoney(totalFeed / totalGain) : "–"} />
      <StatCard label="Total feed cost" value={fmtMoney(totalFeed)} />
      <StatCard label="Feed cost per animal" value={fmtMoney(totalFeed / n)} />
      <StatCard label="Estimated sale value" value={fmtMoney(saleValue)} />
      <StatCard label="Expected profit" value={fmtMoney(saleValue - acquisition - totalFeed)} tone={saleValue - acquisition - totalFeed >= 0 ? "good" : "bad"} hint="sale value − purchase − feed" />
    </div>
  );
}

/* ---------- 17. Mortality analytics ---------- */
export function MortalityAnalytics() {
  const deaths = useRows("mortality");
  const animals = useRows("animals");
  const pastures = useRows("pastures");
  const [dim, setDim] = useState("Month");
  if (!deaths.length) return null;
  const animal = (d: Row) => animals.find((a) => a.id === d.animalId);
  const keyers: Record<string, (d: Row) => string> = {
    Month: (d) => String(d.date).slice(0, 7), Year: (d) => String(d.date).slice(0, 4), Cause: (d) => d.cause,
    Age: (d) => ageGroup(animal(d)?.dob, d.date), Breed: (d) => animal(d)?.breed, Herd: (d) => animal(d)?.herd,
    Pasture: (d) => labelOf("pastures", pastures.find((p) => p.id === animal(d)?.pastureId)) === "–" ? d.location : labelOf("pastures", pastures.find((p) => p.id === animal(d)?.pastureId)),
  };
  const data = groupSum(deaths, keyers[dim], () => 1).sort((a, b) => (dim === "Month" || dim === "Year" ? a.name.localeCompare(b.name) : b.value - a.value));
  return (
    <Panel title="Mortality analysis" className="mb-5" action={
      <select aria-label="Group deaths by" className={`${nativeSelect} w-auto`} value={dim} onChange={(e) => setDim(e.target.value)}>
        {Object.keys(keyers).map((k) => <option key={k} value={k}>By {k.toLowerCase()}</option>)}
      </select>}>
      <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
        <BarCard data={data} x="name" bars={[{ key: "value", name: "Deaths", color: "#b5483a" }]} height={200} />
        <div className="text-sm"><b>Total loss:</b> {fmtMoney(sum(deaths, "loss"))}<br /><b>Deaths:</b> {deaths.length}</div>
      </div>
    </Panel>
  );
}

/* ---------- 8. Pasture board + rotation ---------- */
export function PastureBoard() {
  const pastures = useRows("pastures");
  const animals = useRows("animals");
  const role = useUser().role;
  const [moving, setMoving] = useState(false);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(todayISO());
  const live = animals.filter(isLive);
  const candidates = from === "__none" ? live.filter((a) => !a.pastureId) : from ? live.filter((a) => a.pastureId === from) : live;
  const submit = () => {
    try {
      const ids = [...picked].filter((id) => candidates.some((a) => a.id === id));
      if (!ids.length) return toast.error("Choose at least one animal");
      const warnings = moveAnimals(ids, to, date);
      toast.success(`Moved ${ids.length} animal${ids.length === 1 ? "" : "s"}`);
      warnings.forEach((w) => toast.warning(w, { duration: 8000 }));
      setMoving(false); setPicked(new Set());
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not move animals"); }
  };
  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Grazing overview</h2>
        {canWrite(role, "livestock") && <Button size="lg" className="md:h-10" onClick={() => { setTo(pastures[0]?.id ?? ""); setFrom(""); setPicked(new Set()); setDate(todayISO()); setMoving(true); }} disabled={!pastures.length}>Move animals</Button>}
      </div>
      {pastures.length === 0 ? <Empty>Add a pasture first, then you can move animals between them.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pastures.map((p) => {
            const n = live.filter((a) => a.pastureId === p.id).length;
            const cap = toNum(p.capacity);
            const pct = cap > 0 ? Math.min(100, Math.round((n / cap) * 100)) : 0;
            const over = cap > 0 && n > cap;
            return (
              <div key={p.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-semibold">{labelOf("pastures", p)}</div><div className="text-xs text-muted-foreground">{p.areaHa} ha · {p.forage || "forage not set"}</div></div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.condition === "Poor" ? "bg-danger/15 text-danger" : p.condition === "Fair" ? "bg-warning/20 text-[hsl(30_90%_28%)]" : "bg-success/15 text-success"}`}>{p.condition || "–"}</span>
                </div>
                <div className="mt-3 flex justify-between text-sm"><span>{n} animals{cap ? ` of ${cap}` : ""}</span><span className={over ? "font-semibold text-danger" : "text-muted-foreground"}>{over ? "Overstocked" : cap ? `${pct}% full` : ""}</span></div>
                <Progress value={pct} className={`mt-1.5 h-2 ${over ? "[&>div]:bg-danger" : ""}`} />
                <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
                  <dt>Stocking</dt><dd className="text-right text-foreground">{toNum(p.areaHa) ? round(n / toNum(p.areaHa), 2) : 0} animals/ha</dd>
                  <dt>Water</dt><dd className={`text-right ${p.water === "Unavailable" ? "font-semibold text-danger" : "text-foreground"}`}>{p.water || "–"}</dd>
                  <dt>{n ? "Grazing since" : "Last grazed"}</dt><dd className="text-right text-foreground">{(n ? p.grazingStart : p.grazingEnd) || "–"}</dd>
                  <dt>Rest needed</dt><dd className="text-right text-foreground">{p.restDays || 0} days</dd>
                </dl>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Move animals</DialogTitle><DialogDescription>Choose where they are going and which animals to move. Their grazing history updates automatically.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1"><Label className="mb-1.5 block">Move to</Label><select className={nativeSelect} value={to} onChange={(e) => setTo(e.target.value)}>{pastures.map((p) => <option key={p.id} value={p.id}>{labelOf("pastures", p)}</option>)}</select></div>
            <div className="col-span-2 sm:col-span-1"><Label className="mb-1.5 block">Date</Label><Input type="date" className="h-11 md:h-10" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="col-span-2"><Label className="mb-1.5 block">Show animals from</Label>
              <select className={nativeSelect} value={from} onChange={(e) => { setFrom(e.target.value); setPicked(new Set()); }}>
                <option value="">Everywhere</option><option value="__none">Not on a pasture</option>{pastures.map((p) => <option key={p.id} value={p.id}>{labelOf("pastures", p)}</option>)}
              </select></div>
          </div>
          <div className="flex items-center justify-between text-sm"><span>{picked.size} selected</span><Button variant="link" size="sm" onClick={() => setPicked(picked.size === candidates.length ? new Set() : new Set(candidates.map((a) => a.id)))}>{picked.size === candidates.length ? "Clear" : "Select all"}</Button></div>
          <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border">
            {candidates.map((a) => (
              <li key={a.id}><label className="flex min-h-[44px] cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={picked.has(a.id)} onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; })} />
                <span className="flex-1">{labelOf("animals", a)}</span><span className="text-xs text-muted-foreground">{labelOf("pastures", pastures.find((p) => p.id === a.pastureId))}</span>
              </label></li>
            ))}
            {!candidates.length && <li className="p-4 text-center text-sm text-muted-foreground">No animals here.</li>}
          </ul>
          <DialogFooter className="gap-2"><Button variant="outline" size="lg" onClick={() => setMoving(false)}>Cancel</Button><Button size="lg" onClick={submit}>Move</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

