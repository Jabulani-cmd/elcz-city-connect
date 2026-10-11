import { LineChart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { LivestockAI } from "@/components/farm/AiAssistants";
import { ModulePage, type ModuleItem } from "@/components/farm/ModulePage";
import { FeedlotAnalytics, HerdStats, MortalityAnalytics, PastureBoard, WeightAnalytics } from "@/components/farm/LivestockViews";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { Button } from "@/components/ui/button";

const profile = (r: { id: string }) => (
  <Button asChild variant="ghost" size="icon" aria-label="Open animal profile"><Link to={`/livestock/animal/${r.id}`}><LineChart className="h-4 w-4" /></Link></Button>
);

const items: ModuleItem[] = [
  { id: "herd", label: "Herd registry", group: "Herd", render: () => <ResourceManager resource="animals" section="livestock" rowActions={profile} addLabel="Add animal" /> },
  { id: "stats", label: "Herd statistics", group: "Herd", render: () => <HerdStats /> },
  { id: "weights", label: "Weights", group: "Herd", render: () => <ResourceManager resource="weights" section="livestock" header={<WeightAnalytics />} addLabel="Record weight" /> },
  { id: "pastures", label: "Pastures", group: "Grazing", render: () => <><ResourceManager resource="pastures" section="livestock" header={<PastureBoard />} /><div className="mt-8"><ResourceManager resource="grazing" section="livestock" /></div></> },
  { id: "health", label: "Medical history", group: "Health", render: () => <ResourceManager resource="health" section="livestock" addLabel="Record treatment" /> },
  { id: "vaccinations", label: "Vaccinations", group: "Health", render: () => <ResourceManager resource="vaccinations" section="livestock" /> },
  { id: "diseases", label: "Diseases", group: "Health", render: () => <ResourceManager resource="diseases" section="livestock" /> },
  { id: "quarantine", label: "Quarantine", group: "Health", render: () => <ResourceManager resource="quarantine" section="livestock" /> },
  { id: "appointments", label: "Vet appointments", group: "Health", render: () => <ResourceManager resource="appointments" section="livestock" /> },
  { id: "ai", label: "AI health assistant", group: "Health", render: () => <LivestockAI /> },
  { id: "feed", label: "Feed stock", group: "Feed", render: () => <ResourceManager resource="feed" section="livestock" /> },
  { id: "feed-use", label: "Feed use", group: "Feed", render: () => <ResourceManager resource="feedUsage" section="livestock" addLabel="Record feed used" /> },
  { id: "feedlot", label: "Feedlot", group: "Feed", render: () => <ResourceManager resource="feedlot" section="livestock" header={<FeedlotAnalytics />} /> },
  { id: "purchases", label: "Purchases", group: "Buying & selling", render: () => <ResourceManager resource="purchases" section="livestock" /> },
  { id: "sales", label: "Sales", group: "Buying & selling", render: () => <ResourceManager resource="sales" section="livestock" /> },
  { id: "breeding", label: "Breeding", group: "Breeding", render: () => <ResourceManager resource="breeding" section="livestock" /> },
  { id: "births", label: "Births & calves", group: "Breeding", render: () => <ResourceManager resource="births" section="livestock" /> },
  { id: "mortality", label: "Mortality", group: "Breeding", render: () => <ResourceManager resource="mortality" section="livestock" header={<MortalityAnalytics />} /> },
];

export default function Livestock() {
  const { section } = useParams();
  return <ModulePage title="Livestock Farming" description="Cattle first, with a registry that also supports goats, sheep, pigs, poultry and more." base="/livestock" items={items} current={section} />;
}
