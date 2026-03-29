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

const CrossLogo = () => (
  <div className="relative w-[50px] h-[50px] flex items-center justify-center shrink-0">
    {/* Vertical bar */}
    <div className="absolute w-[8px] h-[40px] bg-cross-blue rounded-sm" />
    {/* Horizontal bar */}
    <div className="absolute w-[32px] h-[8px] bg-cross-blue rounded-sm" style={{ top: '10px' }} />
    {/* Center circle */}
    <div className="absolute w-[12px] h-[12px] bg-gold rounded-full" style={{ top: '12px' }} />
  </div>
);

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
    `px-3 py-2 text-[16px] font-medium transition-colors cursor-pointer ${
      location.pathname === path
        ? "text-btn-blue font-semibold"
        : "text-white hover:text-btn-blue-border"
    }`;

  const mobileLinkClass = (path: string) =>
    `block px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      location.pathname === path
        ? "text-btn-blue bg-navy-light font-semibold"
        : "text-white/80 hover:text-btn-blue-border hover:bg-navy-light"
    }`;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] lg:w-[calc(100%-336px)] max-w-[1030px]">
      <div className="bg-navy/95 backdrop-blur-[10px] rounded-[50px] shadow-header px-4 lg:px-6">
        <div className="flex items-center justify-between h-[70px]">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <CrossLogo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6 mx-auto">
            {topNavLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}

            {/* Worship Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-[16px] font-medium transition-colors ${
                    isActiveDropdown(worshipLinks)
                      ? "text-btn-blue font-semibold"
                      : "text-white hover:text-btn-blue-border"
                  }`}
                >
                  {t.nav_worship}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-navy border-navy-light">
                {worshipLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className={`w-full text-white hover:text-btn-blue ${location.pathname === link.to ? "font-semibold text-btn-blue" : ""}`}>
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
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-[16px] font-medium transition-colors ${
                    isActiveDropdown(mediaLinks)
                      ? "text-btn-blue font-semibold"
                      : "text-white hover:text-btn-blue-border"
                  }`}
                >
                  {t.nav_media}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-navy border-navy-light">
                {mediaLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className={`w-full text-white hover:text-btn-blue ${location.pathname === link.to ? "font-semibold text-btn-blue" : ""}`}>
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
          </div>

          {/* Right side: CTA + Language + Mobile toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSelector />
              <Link
                to="/register"
                className="bg-btn-blue hover:bg-btn-blue-hover text-white font-semibold text-[16px] px-6 py-3 rounded-[24px] transition-colors"
              >
                Join Now
              </Link>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-navy-light" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden pb-4 animate-fade-in border-t border-navy-light/30 mt-1">
            {topNavLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className={mobileLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}

            <button
              onClick={() => setMobileWorshipOpen(!mobileWorshipOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-white/80 hover:text-btn-blue-border hover:bg-navy-light rounded-md transition-colors"
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

            <button
              onClick={() => setMobileMediaOpen(!mobileMediaOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-white/80 hover:text-btn-blue-border hover:bg-navy-light rounded-md transition-colors"
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

            <div className="px-4 pt-3 flex flex-col gap-2">
              <LanguageSelector />
              <Link
                to="/register"
                className="bg-btn-blue hover:bg-btn-blue-hover text-white font-semibold text-sm text-center px-6 py-3 rounded-[24px] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Join Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
