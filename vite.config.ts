import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const BUILD_ID = `${(process.env.GITHUB_SHA ?? process.env.COMMIT_REF ?? "").slice(0, 7) || "build"} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;

export default defineConfig(({ mode }) => ({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
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
      // The manifest is a static file in /public (linked from index.html) so it is also served by the dev server and
      // editor previews; the plugin only adds the offline service worker to production builds.
      manifest: false,
      registerType: "autoUpdate",
      injectRegister: false,
      workbox: {
        // precache the whole app shell, including lazy route chunks and fonts, so every screen opens offline
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
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
