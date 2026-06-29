import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["lib/*/src/**/*.test.ts", "artifacts/*/src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
});
