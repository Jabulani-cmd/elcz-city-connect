import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Youtube, Instagram } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import logo from "@/assets/umplogo2.png";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Mzilikazi Congregation Logo" className="h-[120px] w-[120px] sm:h-[180px] sm:w-[180px] object-contain shrink-0" />
              <span className="font-display text-base sm:text-lg font-bold">Mzilikazi Congregation Bulawayo</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">{t.footer_description}</p>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-accent">{t.footer_service_times}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>{t.home_intercession}: 8:00 AM</li>
              <li>{t.home_bible_study}: 9:00 AM</li>
              <li>{t.home_sunday_worship}: 10:00 AM</li>
              <li>{t.home_sunday_school}: 10:00 AM</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-accent">{t.footer_quick_links}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/about", label: t.nav_about },
                { to: "/events", label: t.nav_events },
                { to: "/giving", label: t.nav_giving },
                { to: "/livestream", label: t.nav_livestream },
                { to: "/preaching-schedule", label: t.nav_preaching_plan },
                { to: "/home-prayers", label: t.nav_home_prayers },
              ].map((link) => (
                <li key={link.to}><Link to={link.to} className="text-primary-foreground/70 hover:text-accent transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-accent">{t.footer_contact_us}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" /><span>Stand 44038, Mzilikazi, Bulawayo, Zimbabwe</span></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-accent" /><span>+263 71 206 4556 / +263 77 500 7746</span></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-accent" /><span>info@mzilikazi-elcz.org</span></li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/profile.php?id=100064839849337" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-accent transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              <a href="https://www.instagram.com/elczbyonorthparish_mzilikazi_congregation" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-accent transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors" aria-label="YouTube"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-sm text-primary-foreground/50 space-y-2">
          <p>© {new Date().getFullYear()} {t.footer_copyright}</p>
          <p>This website was designed and is maintained by <a href="https://mavingtech.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent transition-colors">MavingTech Business Solutions</a>.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
