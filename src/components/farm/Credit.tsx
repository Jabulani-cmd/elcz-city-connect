import { APP_VERSION, BUILD_ID } from "@/lib/pwa";

/** Version line and developer credit, shown on the home page, sign-in, the menu and Settings. */
export function Credit({ className = "" }: { className?: string }) {
  const built = BUILD_ID.split(" · ")[1]?.slice(0, 10);
  return (
    <p className={`text-xs leading-relaxed ${className}`}>
      FarmHelper v{APP_VERSION}{built ? ` · ${built}` : ""}<br />
      Developed and designed by MavingTech Business Solutions
    </p>
  );
}
