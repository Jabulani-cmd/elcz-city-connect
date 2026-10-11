import { useParams } from "react-router-dom";
import { CropDiseaseAI } from "@/components/farm/AiAssistants";
import { ModulePage, type ModuleItem } from "@/components/farm/ModulePage";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { Panel, StatCard } from "@/components/farm/kit";
import { BarCard } from "@/components/farm/charts";
import { fmtMoney, fmtNum, sum } from "@/lib/calc";
import { cropCost, cropRevenue } from "@/lib/schema";
import { useRows } from "@/lib/store";
import { Sprout, Wheat } from "lucide-react";

function CropsHeader() {
  const crops = useRows("crops");
  const fert = useRows("fertilizer");
  const prot = useRows("protection");
  const irr = useRows("irrigation");
  const rows = (c: string) => (c === "fertilizer" ? fert : c === "protection" ? prot : c === "irrigation" ? irr : []);
  const ctx = { rows };
  const growing = crops.filter((c) => !c.actualHarvestDate);
  const data = crops.map((c) => ({ name: c.cropName, Revenue: Math.round(cropRevenue(c)), Cost: Math.round(cropCost(c, ctx)) }));
  if (!crops.length) return null;
  return (
    <div className="mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Growing now" value={growing.length} icon={Sprout} />
        <StatCard label="Planted area" value={`${fmtNum(sum(growing, "areaHa"))} ha`} />
        <StatCard label="Expected harvest" value={`${fmtNum(sum(growing, "expectedYield"))} t`} icon={Wheat} />
        <StatCard label="Production cost" value={fmtMoney(crops.reduce((s, c) => s + cropCost(c, ctx), 0))} />
      </div>
      <Panel title="Revenue vs cost by crop"><BarCard data={data} x="name" bars={[{ key: "Revenue" }, { key: "Cost", color: "#b5483a" }]} height={190} /></Panel>
    </div>
  );
}

function Irrigation() {
  const rows = useRows("irrigation");
  return (
    <ResourceManager resource="irrigation" section="agriculture" header={rows.length ? (
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Water used" value={`${fmtNum(sum(rows, "waterM3"), 0)} m³`} />
        <StatCard label="Irrigation cost" value={fmtMoney(sum(rows, "cost"))} />
        <StatCard label="Open problems" value={rows.filter((r) => r.problems).length} tone="warn" />
      </div>
    ) : null} />
  );
}

const items: ModuleItem[] = [
  { id: "crops", label: "Crops", group: "Crop management", render: () => <ResourceManager resource="crops" section="agriculture" header={<CropsHeader />} /> },
  { id: "fields", label: "Fields", group: "Crop management", render: () => <ResourceManager resource="fields" section="agriculture" /> },
  { id: "planting", label: "Planting", group: "Crop management", render: () => <ResourceManager resource="plantings" section="agriculture" /> },
  { id: "harvests", label: "Harvest", group: "Crop management", render: () => <ResourceManager resource="harvests" section="agriculture" /> },
  { id: "fertilizer", label: "Fertilizer", group: "Inputs", render: () => <ResourceManager resource="fertilizer" section="agriculture" /> },
  { id: "protection", label: "Crop protection", group: "Inputs", render: () => <ResourceManager resource="protection" section="agriculture" /> },
  { id: "irrigation", label: "Irrigation", group: "Inputs", render: () => <Irrigation /> },
  { id: "disease", label: "Disease check (AI)", group: "Crop health", render: () => <><CropDiseaseAI /><ResourceManager resource="diagnoses" section="agriculture" /></> },
];

export default function Agriculture() {
  const { section } = useParams();
  return <ModulePage title="Agricultural Farming" description="Fields, crops, inputs and harvests." base="/agriculture" items={items} current={section} />;
}
