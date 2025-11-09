import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // mise à jour silencieuse
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
        "offline.html",
        "lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png",
        "konekte-group.png",
        "icons/icon-192x192.png",
        "icons/icon-512x512.png",
        "icons/icon-192x192-maskable.png",
        "icons/icon-512x512-maskable.png"
      ],
      manifest: {
        name: "CourseMax - Livraison rapide à Valleyfield",
        short_name: "CourseMax",
        description: "Plateforme de livraison connectant clients, livreurs et magasins à Valleyfield",
        theme_color: "#FF4F2E",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "fr-CA",
        icons: [
          { src: "icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-192x192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        shortcuts: [
          {
            name: "Magasins",
            short_name: "Magasins",
            url: "/stores",
            icons: [{ src: "icons/icon-96x96.png", sizes: "96x96", type: "image/png" }]
          },
          {
            name: "Dashboard",
            short_name: "Dashboard",
            url: "/dashboard",
            icons: [{ src: "icons/icon-96x96.png", sizes: "96x96", type: "image/png" }]
          }
        ],
        categories: ["food", "shopping", "business"]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            // Pages dynamiques / navigation
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 10, // timeout légèrement augmenté
            },
          },
          {
            // Scripts, styles, images et fonts
            urlPattern: ({ request }) => ['script', 'style', 'image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 jours
            },
          },
          {
            // API Supabase (données dynamiques)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10, // timeout augmenté
            },
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));