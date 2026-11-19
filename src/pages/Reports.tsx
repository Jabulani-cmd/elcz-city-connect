import { PeriodReports } from "@/components/farm/PeriodReports";
import { ReportCatalog } from "@/components/farm/ReportCatalog";
import { ReportsPage } from "@/components/farm/ReportsPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPORTS } from "@/lib/reportCatalog";

/** Three views: the quick summary reports, daily & weekly CSV downloads, and the full catalogue with exports. */
export default function Reports() {
  return (
    <Tabs defaultValue="summary">
      <TabsList className="mb-4 h-11">
        <TabsTrigger value="summary" className="h-9 text-sm">Summary</TabsTrigger>
        <TabsTrigger value="period" className="h-9 text-sm">Daily &amp; weekly</TabsTrigger>
        <TabsTrigger value="all" className="h-9 text-sm">All reports ({REPORTS.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="summary"><ReportsPage /></TabsContent>
      <TabsContent value="period"><PeriodReports /></TabsContent>
      <TabsContent value="all"><ReportCatalog /></TabsContent>
    </Tabs>
  );
}
