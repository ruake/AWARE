import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

function cspPlugin(): import("vite").Plugin {
  return {
    name: "csp-headers",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader(
          "Content-Security-Policy",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net; frame-src 'self' https://www.gstatic.com; connect-src 'self' https://www.gstatic.com https://*.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net;"
        );
        next();
      });
    },
  };
}

const dataDir = path.resolve(import.meta.dirname, "data");

function dataServePlugin(): Plugin {
  return {
    name: "data-serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/data")) return next();
        const reqPath = url.replace(/^\/data\/?/, "").split("?")[0];
        if (!reqPath) return next();
        const filePath = path.join(dataDir, reqPath);
        if (!fs.existsSync(filePath)) return next();
        const ext = path.extname(filePath);
        const mime: Record<string, string> = {
          ".json": "application/json",
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
        };
        res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(fs.readFileSync(filePath, "utf-8"));
      });
    },
    closeBundle() {
      const outDir = path.resolve(import.meta.dirname, "dist", "data");
      if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
      if (fs.existsSync(dataDir)) {
        fs.cpSync(dataDir, outDir, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    cspPlugin(),
    dataServePlugin(),
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
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
