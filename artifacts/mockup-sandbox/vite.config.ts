import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
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

export default defineConfig({
  base: basePath,
  plugins: [
    cspPlugin(),
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
