import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_accepted");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-4 sm:p-6 animate-fade-in">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          This website uses cookies to enhance your browsing experience. By continuing to use this site, you agree to our use of cookies.
        </p>
        <Button onClick={accept} size="sm" className="shrink-0">
          Accept Cookies
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;
