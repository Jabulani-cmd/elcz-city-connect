import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const BUILD_ID = `${(process.env.GITHUB_SHA ?? process.env.COMMIT_REF ?? "").slice(0, 7) || "build"} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;

export default defineConfig(({ mode }) => ({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID), __APP_VERSION__: JSON.stringify(pkg.version) },
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
      // "prompt": a new version waits until the user taps Update in the in-app bar (PwaBanner), so a half-filled record is never lost to a surprise reload
      registerType: "prompt",
      injectRegister: false,
      workbox: {
        // precache the whole app shell, including lazy route chunks and fonts, so every screen opens offline
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2,webmanifest}"],
        // Pages are NOT served from the offline copy first: opening the app online always loads the newest published
        // version (an installed app used to keep showing the old one). The saved copy is only used offline or on a very slow network.
        directoryIndex: null,
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === "navigate" && !/^\/(~oauth|rest\/|auth\/|functions\/)/.test(url.pathname),
            handler: "NetworkFirst",
            options: { cacheName: "farmhelper-pages", networkTimeoutSeconds: 4, cacheableResponse: { statuses: [200] }, precacheFallback: { fallbackURL: "/index.html" } },
          },
          {
            // photos/documents uploaded to storage: show the cached copy immediately (patchy networks), refresh quietly
            urlPattern: ({ url }) => /\/storage\/v1\/object\/(public|sign)\//.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "farmhelper-storage", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
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
