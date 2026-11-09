import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Local dev only: Lovable-hosted image assets live on the production host.
    proxy: {
      "/__l5e": { target: "https://kaisentravel.se", changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split vendor libraries into named chunks so the initial bundle stays
    // small. Big libs (Stripe SDK, Leaflet maps, Radix UI primitives) only
    // load on pages that need them.
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-stripe": ["@stripe/stripe-js", "@stripe/react-stripe-js"],
          "vendor-leaflet": ["leaflet", "react-leaflet", "react-leaflet-cluster"],
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-sentry": ["@sentry/react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
