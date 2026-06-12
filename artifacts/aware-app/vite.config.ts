import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = process.env.PORT ? Number(process.env.PORT) : 5173;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),

    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("/node_modules/")) {
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/wouter/") ||
              id.includes("/node_modules/@tanstack/react-query/")
            )
              return "vendor";
            if (
              id.includes("/node_modules/react-google-charts/") ||
              id.includes("/node_modules/recharts/")
            )
              return "charts";
            if (
              id.includes("/node_modules/lucide-react/") ||
              id.includes("/node_modules/cmdk/") ||
              id.includes("/node_modules/sonner/")
            )
              return "ui";
            if (
              id.includes("/node_modules/@chatscope/") ||
              id.includes("/node_modules/@mlc-ai/")
            )
              return "copilot";
            if (
              id.includes("/node_modules/three/") ||
              id.includes("/node_modules/@react-three/")
            )
              return "three";
            return undefined;
          }
          if (id.includes("/src/components/ui/")) return "ui";
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
