import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Layout;
