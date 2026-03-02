import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";
import logo from "@/assets/church-cross-logo-new.jpg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileWorshipOpen, setMobileWorshipOpen] = useState(false);
  const [mobileMediaOpen, setMobileMediaOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const worshipLinks = [
    { to: "/livestream", label: t.nav_livestream },
    { to: "/preaching-schedule", label: t.nav_preaching_plan },
    { to: "/home-prayers", label: t.nav_home_prayers },
  ];

  const mediaLinks = [
    { to: "/gallery", label: t.nav_gallery },
    { to: "/downloads", label: t.nav_downloads },
    { to: "/choir", label: t.nav_choir },
  ];

  const topNavLinks = [
    { to: "/about", label: t.nav_about },
    { to: "/events", label: t.nav_events },
    { to: "/projects", label: t.nav_projects },
    { to: "/giving", label: t.nav_giving },
  ];

  const afterDropdownLinks = [
    { to: "/contact", label: t.nav_contact },
  ];

  const isActiveDropdown = (links: { to: string }[]) =>
    links.some((link) => location.pathname === link.to);

  const linkClass = (path: string) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      location.pathname === path
        ? "text-primary font-semibold"
        : "text-foreground/80 hover:text-primary hover:bg-muted"
    }`;

  const mobileLinkClass = (path: string) =>
    `block px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      location.pathname === path
        ? "text-primary bg-primary/5 font-semibold"
        : "text-foreground/80 hover:text-primary hover:bg-muted"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-md border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img src={logo} alt="Mzilikazi Congregation Logo" className="h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] lg:h-[70px] lg:w-[70px] object-contain shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-base sm:text-lg lg:text-xl font-serif font-extrabold tracking-wide text-primary leading-tight">ELCZ - Mzilikazi Congregation</span>
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.15em] sm:tracking-[0.2em] uppercase text-muted-foreground">Bulawayo</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {topNavLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}

            {/* Worship Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActiveDropdown(worshipLinks)
                      ? "text-primary font-semibold"
                      : "text-foreground/80 hover:text-primary hover:bg-muted"
                  }`}
                >
                  {t.nav_worship}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {worshipLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className={`w-full ${location.pathname === link.to ? "font-semibold text-primary" : ""}`}>
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Media Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActiveDropdown(mediaLinks)
                      ? "text-primary font-semibold"
                      : "text-foreground/80 hover:text-primary hover:bg-muted"
                  }`}
                >
                  {t.nav_media}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {mediaLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className={`w-full ${location.pathname === link.to ? "font-semibold text-primary" : ""}`}>
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {afterDropdownLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}

            <Link to="/admin/login" className={linkClass("/admin/login")}>
              {t.nav_admin}
            </Link>

            <LanguageSelector />
          </div>

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden pb-4 animate-fade-in">
            {topNavLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className={mobileLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}

            {/* Mobile Worship Accordion */}
            <button
              onClick={() => setMobileWorshipOpen(!mobileWorshipOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              {t.nav_worship}
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileWorshipOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileWorshipOpen && (
              <div className="pl-4">
                {worshipLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className={mobileLinkClass(link.to)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile Media Accordion */}
            <button
              onClick={() => setMobileMediaOpen(!mobileMediaOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              {t.nav_media}
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileMediaOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileMediaOpen && (
              <div className="pl-4">
                {mediaLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className={mobileLinkClass(link.to)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {afterDropdownLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className={mobileLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}

            <Link to="/admin/login" onClick={() => setIsOpen(false)} className={mobileLinkClass("/admin/login")}>
              {t.nav_admin}
            </Link>

            <div className="px-4 pt-2"><LanguageSelector /></div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
