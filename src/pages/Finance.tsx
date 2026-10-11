import { cn } from "@/lib/utils";
import { Banknote, Percent, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BarCard, PieCard } from "@/components/farm/charts";
import { StatCard, Panel } from "@/components/farm/kit";
import { ModulePage, type ModuleItem } from "@/components/farm/ModulePage";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { groupSum, inRange, profitability } from "@/lib/analytics";
import { fmtMoney, fmtNum, lastMonths, sum, toNum } from "@/lib/calc";
import { dimensionKey, farmKpis, PROFIT_DIMENSIONS, type ProfitDimension } from "@/lib/finance";
import { labelOf } from "@/lib/schema";
import { rowsOf, useRows, useStore } from "@/lib/store";
import { nativeSelect } from "@/components/farm/kit";
import { Input } from "@/components/ui/input";

function Overview() {
  const income = useRows("income");
  const expenses = useRows("expenses");
  const animals = useRows("animals");
  const weights = useRows("weights");
  const fields = useRows("fields");
  useStore((s) => s.data);
  const [dim, setDim] = useState<ProfitDimension>("Category");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const inc = useMemo(() => (from || to ? income.filter((r) => inRange(r.date, { from, to })) : income), [income, from, to]);
  const exp = useMemo(() => (from || to ? expenses.filter((r) => inRange(r.date, { from, to })) : expenses), [expenses, from, to]);
  const cultivated = sum(fields, "sizeHa") || 0;
  const k = farmKpis(inc, exp, animals, weights, cultivated);
  const lookup = (c: string, id?: string) => labelOf(c, rowsOf(c).find((r) => r.id === id));
  const key = dimensionKey(dim, lookup);
  const table = profitability(inc, exp, key);
  const months = lastMonths(12).map((m) => ({ month: m.slice(2), Income: sum(inc.filter((r) => r.date?.startsWith(m)), "amount"), Expenses: sum(exp.filter((r) => r.date?.startsWith(m)), "amount") }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">From<Input type="date" className="mt-1 h-10 w-40" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-sm">To<Input type="date" className="mt-1 h-10 w-40" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {(from || to) && <button className="pb-2 text-sm underline" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</button>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total revenue" value={fmtMoney(k.revenue)} icon={TrendingUp} tone="good" />
        <StatCard label="Total expenses" value={fmtMoney(k.expenses)} icon={TrendingDown} tone="bad" />
        <StatCard label="Gross profit" value={fmtMoney(k.grossProfit)} icon={Banknote} hint="revenue − direct costs" />
        <StatCard label="Net profit" value={fmtMoney(k.netProfit)} icon={PiggyBank} tone={k.netProfit >= 0 ? "good" : "bad"} />
        <StatCard label="Profit margin" value={`${k.margin}%`} icon={Percent} />
        <StatCard label="Cost per animal" value={fmtMoney(k.costPerAnimal)} />
        <StatCard label="Cost per hectare" value={fmtMoney(k.costPerHa)} />
        <StatCard label="Revenue per hectare" value={fmtMoney(k.revenuePerHa)} />
        <StatCard label="Cost per kg of livestock" value={fmtNum(k.costPerKg, 2)} />
        <StatCard label="Feed cost per animal" value={fmtMoney(k.feedPerAnimal)} />
        <StatCard label="Vet cost per animal" value={fmtMoney(k.vetPerAnimal)} />
        <StatCard label="Outstanding payments" value={fmtMoney(k.outstandingPayable)} tone={k.outstandingPayable ? "warn" : "good"} hint={k.outstandingReceivable ? `${fmtMoney(k.outstandingReceivable)} owed to you` : undefined} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Income vs expenses" className="lg:col-span-2"><BarCard data={months} x="month" bars={[{ key: "Income" }, { key: "Expenses", color: "#b5483a" }]} /></Panel>
        <Panel title="Expenses by category"><PieCard data={groupSum(exp, (r) => r.category, (r) => toNum(r.amount))} /></Panel>
      </div>
      <Panel title="Profitability" action={
        <select aria-label="Group by" className={cn(nativeSelect, "w-auto")} value={dim} onChange={(e) => setDim(e.target.value as ProfitDimension)}>{PROFIT_DIMENSIONS.map((d) => <option key={d} value={d}>By {d.toLowerCase()}</option>)}</select>}>
        <p className="mb-3 text-xs text-muted-foreground">Records without a {dim.toLowerCase()} tag appear as “Unassigned”. Tag income and expenses when you enter them to see profit per crop, field, animal, herd, pasture or feedlot.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">{dim}</th><th className="text-right">Income</th><th className="text-right">Expenses</th><th className="text-right">Profit</th></tr></thead>
          <tbody className="divide-y">{table.map((r) => <tr key={r.name}><td className="py-2">{r.name}</td><td className="text-right tabular-nums">{fmtMoney(r.income)}</td><td className="text-right tabular-nums">{fmtMoney(r.expenses)}</td><td className={`text-right font-semibold tabular-nums ${r.profit < 0 ? "text-danger" : "text-success"}`}>{fmtMoney(r.profit)}</td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}

const items: ModuleItem[] = [
  { id: "overview", label: "Overview & profit", render: () => <Overview /> },
  { id: "income", label: "Income", render: () => <ResourceManager resource="income" section="finance" /> },
  { id: "expenses", label: "Expenses", render: () => <ResourceManager resource="expenses" section="finance" /> },
  { id: "budgets", label: "Budgets", render: () => <ResourceManager resource="budgets" section="finance" /> },
  { id: "suppliers", label: "Suppliers", render: () => <ResourceManager resource="suppliers" section="finance" /> },
  { id: "customers", label: "Customers", render: () => <ResourceManager resource="customers" section="finance" /> },
];

export default function Finance() {
  const { section } = useParams();
  return <ModulePage title="Financial Management" description="Income, expenses, budgets and profitability for the whole farm." base="/finance" items={items} current={section} />;
}
