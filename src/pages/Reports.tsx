import { ReportCatalog } from "@/components/farm/ReportCatalog";
import { ReportsPage } from "@/components/farm/ReportsPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPORTS } from "@/lib/reportCatalog";

/** Two views: the quick summary reports, and the full catalogue with exports. */
export default function Reports() {
  return (
    <Tabs defaultValue="summary">
      <TabsList className="mb-4 h-11">
        <TabsTrigger value="summary" className="h-9 text-sm">Summary</TabsTrigger>
        <TabsTrigger value="all" className="h-9 text-sm">All reports ({REPORTS.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="summary"><ReportsPage /></TabsContent>
      <TabsContent value="all"><ReportCatalog /></TabsContent>
    </Tabs>
  );
}
