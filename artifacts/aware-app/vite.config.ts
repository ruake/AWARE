import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

const port = process.env.PORT ? Number(process.env.PORT) : 5173;
const basePath = process.env.BASE_PATH || "/";

function aiProxyPlugin(): Plugin {
  return {
    name: "aware-ai-proxy",
    configureServer(server) {
      server.middlewares.use(
        "/api/ai/chat",
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 503;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error:
                  "OPENAI_API_KEY is not configured on the server. Add it in Replit Secrets.",
              }),
            );
            return;
          }

          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", async () => {
            try {
              const body = Buffer.concat(chunks).toString("utf8");
              const upstream = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body,
                },
              );

              res.statusCode = upstream.status;
              const ct = upstream.headers.get("content-type");
              if (ct) res.setHeader("Content-Type", ct);
              res.setHeader("Cache-Control", "no-cache, no-store");
              res.setHeader("Access-Control-Allow-Origin", "*");

              if (!upstream.body) {
                res.end();
                return;
              }

              const reader = upstream.body.getReader();
              const pump = async (): Promise<void> => {
                const { done, value } = await reader.read();
                if (done) {
                  res.end();
                  return;
                }
                res.write(Buffer.from(value));
                return pump();
              };
              await pump();
            } catch (err) {
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
              }
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          req.on("error", (err: Error) => {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
            }
            res.end(JSON.stringify({ error: err.message }));
          });
        },
      );
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    aiProxyPlugin(),
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
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "wouter",
      "recharts",
    ],
  },
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
    sourcemap: process.env.NODE_ENV !== "production",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("/node_modules/")) {
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/wouter/")
            )
              return "vendor";
            if (id.includes("/node_modules/recharts/"))
              return "charts";
            if (
              id.includes("/node_modules/lucide-react/") ||
              id.includes("/node_modules/@radix-ui/")
            )
              return "ui";
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
