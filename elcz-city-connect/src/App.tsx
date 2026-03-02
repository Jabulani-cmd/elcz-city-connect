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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
