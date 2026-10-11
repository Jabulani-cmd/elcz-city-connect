import { ArrowLeft, Scale } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LineCard } from "@/components/farm/charts";
import { Empty, PageHeader, Panel, StatCard } from "@/components/farm/kit";
import { RecordDialog } from "@/components/farm/RecordDialog";
import { Button } from "@/components/ui/button";
import { ageLabel, fmtMoney, fmtNum, toNum } from "@/lib/calc";
import { cellText, toneClass } from "@/lib/format";
import { canWrite } from "@/lib/permissions";
import { animalCost, labelOf, RESOURCES } from "@/lib/schema";
import { useRows, useStore, useUser } from "@/lib/store";
import type { Row } from "@/lib/types";

function Mini({ resource, rows, cols }: { resource: string; rows: Row[]; cols: string[] }) {
  const res = RESOURCES[resource];
  if (!rows.length) return <Empty>None recorded.</Empty>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted-foreground"><tr>{cols.map((c) => <th key={c} className="px-2 py-1.5 font-medium">{res.fields.find((f) => f.key === c)?.label ?? res.derived?.find((d) => d.key === c)?.label ?? c}</th>)}</tr></thead>
      <tbody className="divide-y">{rows.map((r) => <tr key={r.id}>{cols.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1.5">{cellText(res, c, r) || "–"}</td>)}</tr>)}</tbody></table></div>
  );
}

export default function AnimalProfile() {
  const { id } = useParams();
  const animals = useRows("animals");
  const weights = useRows("weights");
  const health = useRows("health");
  const vax = useRows("vaccinations");
  const breeding = useRows("breeding");
  const grazing = useRows("grazing");
  const feedlot = useRows("feedlot");
  const pastures = useRows("pastures");
  const expenses = useRows("expenses");
  const role = useUser().role;
  useStore((s) => s.data);
  const [weighing, setWeighing] = useState(false);
  const a = animals.find((x) => x.id === id);
  if (!a) return <Empty>Animal not found. <Link className="underline" to="/livestock/herd">Back to herd</Link></Empty>;
  const mine = (rows: Row[], key = "animalId") => rows.filter((r) => r[key] === a.id);
  const w = mine(weights).sort((x, y) => x.date.localeCompare(y.date));
  const latest = w[w.length - 1];
  const detail: [string, string][] = [
    ["Tag / ID", a.tag], ["RFID", a.rfid], ["Name", a.name], ["Species", a.species], ["Breed", a.breed], ["Type", a.category], ["Sex", a.sex], ["Born", a.dob ? `${a.dob} (${ageLabel(a.dob)})` : ""],
    ["Colour", a.color], ["Registration", a.registrationNo], ["Sire", a.sireId], ["Dam", a.damId], ["Herd", a.herd], ["Pasture", labelOf("pastures", pastures.find((p) => p.id === a.pastureId))],
    ["Purchased", a.purchaseDate], ["Purchase price", a.purchasePrice ? fmtMoney(toNum(a.purchasePrice)) : ""], ["Est. value", a.estimatedValue ? fmtMoney(toNum(a.estimatedValue)) : ""],
  ];
  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" className="-ml-3"><Link to="/livestock/herd"><ArrowLeft className="mr-1.5 h-4 w-4" />Herd registry</Link></Button>
      <PageHeader title={labelOf("animals", a)} description={`${a.breed ?? ""} ${a.category ?? ""}`.trim()}
        actions={<><span className={`rounded-full px-3 py-1 text-sm font-medium ${toneClass(a.status)}`}>{a.status}</span>{canWrite(role, "livestock") && <Button size="lg" onClick={() => setWeighing(true)}><Scale className="mr-1.5 h-4 w-4" />Record weight</Button>}</>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Current weight" value={a.currentWeight ? `${fmtNum(toNum(a.currentWeight))} kg` : "–"} icon={Scale} />
        <StatCard label="Last gain" value={latest && latest.previousWeight !== "" ? `${latest.difference >= 0 ? "+" : ""}${fmtNum(toNum(latest.difference))} kg` : "–"} />
        <StatCard label="Daily gain" value={latest && latest.previousWeight !== "" ? `${fmtNum(toNum(latest.adg), 2)} kg/day` : "–"} tone="good" />
        <StatCard label="Cost so far" value={fmtMoney(animalCost(a, { rows: (c) => (c === "expenses" ? expenses : []) }))} hint="purchase + tagged expenses" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Weight trend">{w.length > 1 ? <LineCard data={w.map((r) => ({ date: r.date.slice(5), kg: r.weight }))} x="date" lines={[{ key: "kg", name: "Weight (kg)" }]} /> : <Empty>Record at least two weights to see a trend.</Empty>}</Panel>
        <Panel title="Details"><dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{detail.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl></Panel>
      </div>
      <Panel title="Weight history"><Mini resource="weights" rows={[...w].reverse()} cols={["date", "weight", "previousWeight", "difference", "adg", "location"]} /></Panel>
      <Panel title="Medical history"><Mini resource="health" rows={mine(health)} cols={["date", "condition", "treatment", "medication", "veterinarian", "recovery"]} /></Panel>
      <Panel title="Vaccinations"><Mini resource="vaccinations" rows={mine(vax)} cols={["date", "vaccine", "nextDate", "batch"]} /></Panel>
      <Panel title="Grazing history"><Mini resource="grazing" rows={mine(grazing)} cols={["startDate", "endDate", "pastureId"]} /></Panel>
      {mine(breeding, "cowId").length > 0 && <Panel title="Breeding"><Mini resource="breeding" rows={mine(breeding, "cowId")} cols={["matingDate", "bullId", "method", "pregnancyStatus", "expected"]} /></Panel>}
      {mine(feedlot).length > 0 && <Panel title="Feedlot"><Mini resource="feedlot" rows={mine(feedlot)} cols={["feedlotId", "entryDate", "startWeight", "currentWeight", "adg", "finish"]} /></Panel>}
      <RecordDialog resource="weights" open={weighing} defaults={{ animalId: a.id }} onClose={() => setWeighing(false)} />
    </div>
  );
}
