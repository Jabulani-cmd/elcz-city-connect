import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "apple-touch-icon.png", "favicon-32.png"],
      manifest: {
        id: "/",
        name: "FarmHelper – Farm Management",
        short_name: "FarmHelper",
        description: "One platform to manage the entire farm: crops, livestock, finance, staff and reports. Works offline.",
        lang: "en",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f3f6ef",
        theme_color: "#14532d",
        categories: ["business", "productivity", "lifestyle"],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Quick record", short_name: "Record", url: "/?quick=1", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Herd", short_name: "Herd", url: "/livestock/herd", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Tasks", short_name: "Tasks", url: "/tasks", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Notifications", short_name: "Alerts", url: "/notifications", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        // precache the whole app shell, including lazy route chunks and fonts, so every screen opens offline
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
