import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Image, Megaphone, CalendarDays, HandHeart, Users, Download, SlidersHorizontal, UserCircle, Video, BookOpen, Home, Music, Camera, FolderKanban } from "lucide-react";
import logo from "@/assets/umplogo2.png";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminPrayerRequests from "@/components/admin/AdminPrayerRequests";
import AdminMembers from "@/components/admin/AdminMembers";
import AdminDownloads from "@/components/admin/AdminDownloads";
import AdminCarousel from "@/components/admin/AdminCarousel";
import AdminLeaderPhotos from "@/components/admin/AdminLeaderPhotos";
import AdminLivestream from "@/components/admin/AdminLivestream";
import AdminPreachingSchedule from "@/components/admin/AdminPreachingSchedule";
import AdminHomePrayers from "@/components/admin/AdminHomePrayers";
import AdminGalleryVideos from "@/components/admin/AdminGalleryVideos";
import AdminChoir from "@/components/admin/AdminChoir";
import AdminMinistryPhotos from "@/components/admin/AdminMinistryPhotos";
import AdminProjects from "@/components/admin/AdminProjects";

const Admin = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
            <span className="font-display text-lg font-bold text-primary">Admin Portal</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="members">
          <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-1 h-auto mb-8">
            <TabsTrigger value="members" className="flex items-center gap-2"><Users className="h-4 w-4" /> Members</TabsTrigger>
            <TabsTrigger value="leaders" className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> Leaders</TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2"><Image className="h-4 w-4" /> Gallery</TabsTrigger>
            <TabsTrigger value="gallery-videos" className="flex items-center gap-2"><Video className="h-4 w-4" /> Videos</TabsTrigger>
            <TabsTrigger value="carousel" className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Carousel</TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Announcements</TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Events</TabsTrigger>
            <TabsTrigger value="prayers" className="flex items-center gap-2"><HandHeart className="h-4 w-4" /> Prayer Requests</TabsTrigger>
            <TabsTrigger value="preaching" className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Preaching</TabsTrigger>
            <TabsTrigger value="home-prayers" className="flex items-center gap-2"><Home className="h-4 w-4" /> Home Prayers</TabsTrigger>
            <TabsTrigger value="livestream" className="flex items-center gap-2"><Video className="h-4 w-4" /> Livestream</TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2"><Download className="h-4 w-4" /> Downloads</TabsTrigger>
            <TabsTrigger value="choir" className="flex items-center gap-2"><Music className="h-4 w-4" /> Choir</TabsTrigger>
            <TabsTrigger value="ministry-photos" className="flex items-center gap-2"><Camera className="h-4 w-4" /> Ministry Photos</TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="members"><AdminMembers /></TabsContent>
          <TabsContent value="leaders"><AdminLeaderPhotos /></TabsContent>
          <TabsContent value="gallery"><AdminGallery /></TabsContent>
          <TabsContent value="gallery-videos"><AdminGalleryVideos /></TabsContent>
          <TabsContent value="carousel"><AdminCarousel /></TabsContent>
          <TabsContent value="announcements"><AdminAnnouncements /></TabsContent>
          <TabsContent value="events"><AdminEvents /></TabsContent>
          <TabsContent value="prayers"><AdminPrayerRequests /></TabsContent>
          <TabsContent value="preaching"><AdminPreachingSchedule /></TabsContent>
          <TabsContent value="home-prayers"><AdminHomePrayers /></TabsContent>
          <TabsContent value="livestream"><AdminLivestream /></TabsContent>
          <TabsContent value="downloads"><AdminDownloads /></TabsContent>
          <TabsContent value="choir"><AdminChoir /></TabsContent>
          <TabsContent value="ministry-photos"><AdminMinistryPhotos /></TabsContent>
          <TabsContent value="projects"><AdminProjects /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
