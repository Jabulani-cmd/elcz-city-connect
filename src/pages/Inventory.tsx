import { useParams } from "react-router-dom";
import { ModulePage, type ModuleItem } from "@/components/farm/ModulePage";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { StatCard } from "@/components/farm/kit";
import { feedAvailable, fmtMoney, sum, toNum } from "@/lib/calc";
import { useRows } from "@/lib/store";
import { Boxes, PackageX } from "lucide-react";

function Summary() {
  const inv = useRows("inventory");
  const low = inv.filter((i) => toNum(i.minStock) > 0 && toNum(i.quantity) <= toNum(i.minStock)).length;
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
      <StatCard label="Items" value={inv.length} icon={Boxes} />
      <StatCard label="Stock value" value={fmtMoney(inv.reduce((s, i) => s + toNum(i.quantity) * toNum(i.price), 0))} />
      <StatCard label="Low stock" value={low} icon={PackageX} tone={low ? "warn" : "good"} />
    </div>
  );
}

function FeedSummary() {
  const feed = useRows("feed");
  const usage = useRows("feedUsage");
  const low = feed.filter((f) => toNum(f.minStock) > 0 && feedAvailable(toNum(f.qtyPurchased), sum(usage.filter((u) => u.feedId === f.id), "quantity")) <= toNum(f.minStock)).length;
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <StatCard label="Feed items" value={feed.length} icon={Boxes} />
      <StatCard label="Running low" value={low} icon={PackageX} tone={low ? "warn" : "good"} />
    </div>
  );
}

const items: ModuleItem[] = [
  { id: "supplies", label: "Supplies & equipment", render: () => <ResourceManager resource="inventory" section="inventory" header={<Summary />} /> },
  { id: "feed", label: "Feed", render: () => <ResourceManager resource="feed" section="inventory" header={<FeedSummary />} /> },
  { id: "suppliers", label: "Suppliers", render: () => <ResourceManager resource="suppliers" section="inventory" /> },
];

export default function Inventory() {
  const { section } = useParams();
  return <ModulePage title="Inventory" description="Seeds, fertilizer, chemicals, medicines, equipment, fuel and feed in one place." base="/inventory" items={items} current={section} />;
}
