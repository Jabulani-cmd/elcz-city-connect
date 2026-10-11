import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/farm/AppShell";
import { Guard } from "@/components/farm/Guard";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agriculture = lazy(() => import("@/pages/Agriculture"));
const Livestock = lazy(() => import("@/pages/Livestock"));
const AnimalProfile = lazy(() => import("@/pages/AnimalProfile"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Finance = lazy(() => import("@/pages/Finance"));
const Employees = lazy(() => import("@/pages/Employees"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const FarmMap = lazy(() => import("@/pages/FarmMap"));
const Assistant = lazy(() => import("@/pages/Assistant"));
const Reports = lazy(() => import("@/pages/Reports"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Documents = lazy(() => import("@/pages/Documents"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const App = () => (
  <TooltipProvider>
    <Toaster richColors position="top-center" />
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Guard section="dashboard"><Dashboard /></Guard>} />
            <Route path="agriculture" element={<Navigate to="/agriculture/crops" replace />} />
            <Route path="agriculture/:section" element={<Guard section="agriculture"><Agriculture /></Guard>} />
            <Route path="livestock" element={<Navigate to="/livestock/herd" replace />} />
            <Route path="livestock/animal/:id" element={<Guard section="livestock"><AnimalProfile /></Guard>} />
            <Route path="livestock/:section" element={<Guard section="livestock"><Livestock /></Guard>} />
            <Route path="inventory" element={<Navigate to="/inventory/supplies" replace />} />
            <Route path="inventory/:section" element={<Guard section="inventory"><Inventory /></Guard>} />
            <Route path="finance" element={<Navigate to="/finance/overview" replace />} />
            <Route path="finance/:section" element={<Guard section="finance"><Finance /></Guard>} />
            <Route path="employees" element={<Navigate to="/employees/staff" replace />} />
            <Route path="employees/:section" element={<Guard section="employees"><Employees /></Guard>} />
            <Route path="tasks" element={<Guard section="tasks"><Tasks /></Guard>} />
            <Route path="map" element={<Guard section="map"><FarmMap /></Guard>} />
            <Route path="assistant" element={<Guard section="assistant"><Assistant /></Guard>} />
            <Route path="reports" element={<Guard section="reports"><Reports /></Guard>} />
            <Route path="notifications" element={<Guard section="notifications"><Notifications /></Guard>} />
            <Route path="documents" element={<Guard section="documents"><Documents /></Guard>} />
            <Route path="settings" element={<Guard section="settings"><Settings /></Guard>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
