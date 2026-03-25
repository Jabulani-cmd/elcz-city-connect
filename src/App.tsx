import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Ministries from "./pages/Ministries";
import Gallery from "./pages/Gallery";
import Downloads from "./pages/Downloads";
import Livestream from "./pages/Livestream";
import Appointments from "./pages/Appointments";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import Projects from "./pages/Projects";
import Register from "./pages/Register";
import PreachingSchedule from "./pages/PreachingSchedule";
import HomePrayers from "./pages/HomePrayers";
import Choir from "./pages/Choir";
import Giving from "./pages/Giving";
import NotFound from "./pages/NotFound";

// Pastor Portal
import PastorLogin from "./pages/PastorLogin";
import PastorLayout from "./components/pastor/PastorLayout";
import PastorDashboard from "./pages/pastor/PastorDashboard";
import SermonBuilder from "./pages/pastor/SermonBuilder";
import SermonSeries from "./pages/pastor/SermonSeries";
import SermonLibrary from "./pages/pastor/SermonLibrary";
import CareDashboard from "./pages/pastor/CareDashboard";
import CounselingPage from "./pages/pastor/CounselingPage";
import PrayerRequestsPage from "./pages/pastor/PrayerRequestsPage";
import MemberDirectory from "./pages/pastor/MemberDirectory";
import FamilyManagement from "./pages/pastor/FamilyManagement";
import MinistryTeams from "./pages/pastor/MinistryTeams";
import VolunteerDirectory from "./pages/pastor/VolunteerDirectory";
import SongLibrary from "./pages/pastor/SongLibrary";
import GivingDashboard from "./pages/pastor/GivingDashboard";
import EventManagement from "./pages/pastor/EventManagement";
import AnnouncementsPage from "./pages/pastor/AnnouncementsPage";
import ReportsPage from "./pages/pastor/ReportsPage";
import ChurchSettings from "./pages/pastor/ChurchSettings";
import PlaceholderPage from "./pages/pastor/PlaceholderPage";
import BibleReader from "./pages/pastor/BibleReader";
import AISermonBuilder from "./pages/pastor/AISermonBuilder";

const queryClient = new QueryClient();

const PastorPage = ({ children }: { children: React.ReactNode }) => (
  <PastorLayout>{children}</PastorLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/ministries" element={<Ministries />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/livestream" element={<Livestream />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/preaching-schedule" element={<PreachingSchedule />} />
            <Route path="/home-prayers" element={<HomePrayers />} />
            <Route path="/choir" element={<Choir />} />
            <Route path="/giving" element={<Giving />} />
            <Route path="/admin" element={<Admin />} />

            {/* Pastor Portal */}
            <Route path="/pastor/login" element={<PastorLogin />} />
            <Route path="/pastor" element={<PastorPage><PastorDashboard /></PastorPage>} />
            <Route path="/pastor/sermons/ai-builder" element={<PastorPage><AISermonBuilder /></PastorPage>} />
            <Route path="/pastor/sermons/builder" element={<PastorPage><SermonBuilder /></PastorPage>} />
            <Route path="/pastor/sermons/series" element={<PastorPage><SermonSeries /></PastorPage>} />
            <Route path="/pastor/sermons/library" element={<PastorPage><SermonLibrary /></PastorPage>} />
            <Route path="/pastor/care" element={<PastorPage><CareDashboard /></PastorPage>} />
            <Route path="/pastor/care/counseling" element={<PastorPage><CounselingPage /></PastorPage>} />
            <Route path="/pastor/care/prayers" element={<PastorPage><PrayerRequestsPage /></PastorPage>} />
            <Route path="/pastor/care/visits" element={<PastorPage><PlaceholderPage title="Visit Planning" /></PastorPage>} />
            <Route path="/pastor/members" element={<PastorPage><MemberDirectory /></PastorPage>} />
            <Route path="/pastor/members/families" element={<PastorPage><FamilyManagement /></PastorPage>} />
            <Route path="/pastor/volunteers/teams" element={<PastorPage><MinistryTeams /></PastorPage>} />
            <Route path="/pastor/volunteers" element={<PastorPage><VolunteerDirectory /></PastorPage>} />
            <Route path="/pastor/volunteers/scheduler" element={<PastorPage><PlaceholderPage title="Service Scheduler" /></PastorPage>} />
            <Route path="/pastor/services/plans" element={<PastorPage><PlaceholderPage title="Service Plan Builder" /></PastorPage>} />
            <Route path="/pastor/services/songs" element={<PastorPage><SongLibrary /></PastorPage>} />
            <Route path="/pastor/resources/bible" element={<PastorPage><BibleReader /></PastorPage>} />
            <Route path="/pastor/resources/order" element={<PastorPage><PlaceholderPage title="Order of Service" /></PastorPage>} />
            <Route path="/pastor/resources/almanac" element={<PastorPage><PlaceholderPage title="Liturgical Almanac" /></PastorPage>} />
            <Route path="/pastor/communication/announcements" element={<PastorPage><AnnouncementsPage /></PastorPage>} />
            <Route path="/pastor/communication/notifications" element={<PastorPage><PlaceholderPage title="Notifications" /></PastorPage>} />
            <Route path="/pastor/communication/broadcast" element={<PastorPage><PlaceholderPage title="Broadcast" /></PastorPage>} />
            <Route path="/pastor/events" element={<PastorPage><EventManagement /></PastorPage>} />
            <Route path="/pastor/events/calendar" element={<PastorPage><PlaceholderPage title="Calendar View" /></PastorPage>} />
            <Route path="/pastor/giving" element={<PastorPage><GivingDashboard /></PastorPage>} />
            <Route path="/pastor/giving/transactions" element={<PastorPage><GivingDashboard /></PastorPage>} />
            <Route path="/pastor/giving/statements" element={<PastorPage><PlaceholderPage title="Giving Statements" /></PastorPage>} />
            <Route path="/pastor/reports/attendance" element={<PastorPage><ReportsPage /></PastorPage>} />
            <Route path="/pastor/reports/membership" element={<PastorPage><ReportsPage /></PastorPage>} />
            <Route path="/pastor/reports/giving" element={<PastorPage><ReportsPage /></PastorPage>} />
            <Route path="/pastor/reports/volunteers" element={<PastorPage><ReportsPage /></PastorPage>} />
            <Route path="/pastor/settings" element={<PastorPage><ChurchSettings /></PastorPage>} />
            <Route path="/pastor/settings/users" element={<PastorPage><PlaceholderPage title="User Management" /></PastorPage>} />
            <Route path="/pastor/settings/data" element={<PastorPage><PlaceholderPage title="Data Import/Export" /></PastorPage>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
