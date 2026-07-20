import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: false,

      // ❌ لا تضيف icons الـ manifest تلقائياً للـ precache
      // ده كان السبب الرئيسي لضخامة الـ precache رغم globPatterns الصغيرة
      includeManifestIcons: false,

      workbox: {
        // ✅ precache: JS + CSS + HTML فقط (~900KB)
        // كل الصور والأيقونات تتحمل runtime عبر CacheFirst
        globPatterns: [
          "assets/**/*.{js,css}",
          "index.html",
          "manifest.webmanifest",
        ],
        globIgnores: ["**/node_modules/**"],

        // Navigation fallback → الـ SPA يشتغل على أي URL
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//],

        // لا تخزن API calls
        runtimeCaching: [
          // Icons small (already precached) — just in case
          {
            urlPattern: /\/icons\/.+\.(png|svg|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "icons-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Large icons (512px, 384px) — load on demand, not in precache
          {
            urlPattern: /\/icons-hd\/.+\.(png|svg)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "icons-hd-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Apple splash screens (apple-touch-startup-image) — only fetched
          // by iOS/iPadOS at launch, load on demand, not in precache
          {
            urlPattern: /\/splash\/.+\.png$/,
            handler: "CacheFirst",
            options: {
              cacheName: "apple-splash-cache",
              expiration: { maxEntries: 15, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Docs Viewer (PDF عرض)
          {
            urlPattern: /^https:\/\/docs\.google\.com\//,
            handler: "NetworkOnly",
          },
          // Cloudinary images
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "cloudinary-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API calls — never cache
          {
            urlPattern: /\/api\//,
            handler: "NetworkOnly",
          },
        ],

        // حجم أقصى للملف في الكاش (4MB)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,

        // skipWaiting + clientsClaim = تفعيل فوري
        skipWaiting: true,
        clientsClaim: true,

        // تنظيف الكاش القديم تلقائياً
        cleanupOutdatedCaches: true,
      },

      manifest: {
        name: "منصة الإبداع في الرياضيات",
        short_name: "الإبداع",
        description: "منصة الإبداع في الرياضيات للأستاذ مينا دياب",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#080d1a",
        theme_color: "#080d1a",
        lang: "ar",
        dir: "rtl",
        icons: [
          { src: "/icons/icon-96x96.png",            sizes: "96x96",   type: "image/png", purpose: "any" },
          { src: "/icons/icon-128x128.png",          sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/icons/icon-144x144.png",          sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icons/icon-152x152.png",          sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icons/icon-180x180.png",          sizes: "180x180", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192x192.png",          sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192x192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          // 384 & 512 → icons-hd/ (not precached, loaded on demand)
          { src: "/icons-hd/icon-384x384.png",          sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icons-hd/icon-512x512.png",          sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons-hd/icon-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },

      devOptions: {
        enabled: false, // لا SW في dev
      },
    }),
  ],

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    // الأهم: target واضح لضمان التوافق مع Chrome 80+
    // بدونه Vite يبني ESNext = يقع على Android Chrome < 88
    target: ["es2015", "chrome80", "firefox78", "safari13"],

    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/sonner') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'vendor-utils';
          }
        },
      },
    },

    minify: "terser",
    terserOptions: {
      compress: {
        drop_debugger: true,
        // نحافظ على console.error و console.warn للـ debugging
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
    },
    sourcemap: false,
  },

  server: {
    host: "::",
    port: 3000,
  },
});