import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Auth endpoints - no caching in development
          ...(mode === "development"
            ? [
                {
                  urlPattern: /^https:\/\/.*\.supabase\.co.*\/auth\//,
                  handler: "NetworkOnly" as const,
                },
              ]
            : []),
          // Supabase API caching for non-auth endpoints
          {
            urlPattern: /^https:\/\/.*\.supabase\.co/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: mode === "development" ? 10 : 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: "Solace - Mental Health Support",
        short_name: "Solace",
        description:
          "A comprehensive mental health support platform providing crisis intervention, community support, and resources for mental wellness.",
        theme_color: "#6366f1",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable any",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
        shortcuts: [
          {
            name: "Crisis Support",
            short_name: "Crisis",
            description: "Access immediate crisis support resources",
            url: "/crisis-support",
            icons: [{ src: "/icons/crisis-shortcut.png", sizes: "192x192" }],
          },
          {
            name: "Community",
            short_name: "Community",
            description: "Connect with the support community",
            url: "/community",
            icons: [{ src: "/icons/community-shortcut.png", sizes: "192x192" }],
          },
        ],
        categories: ["health", "medical", "lifestyle", "social"],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Exclude Supabase Edge Functions from the build
        /^.*\/supabase\/functions\/.*/,
      ],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          i18n: ["i18next", "react-i18next"],
        },
      },
    },
  },
}));
