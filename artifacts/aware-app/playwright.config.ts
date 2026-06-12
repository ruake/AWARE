import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/puppeteer/**", "**/http/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["json", { outputFile: "test-results/playwright-results.json" }]]
    : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: process.env.CI ? "on" : "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: "pnpm build && pnpm exec vite preview --port 5173 --host 0.0.0.0",
        port: 5173,
        reuseExistingServer: false,
        timeout: 30000,
      }
    : {
        command: "pnpm dev",
        port: 5173,
        reuseExistingServer: true,
        timeout: 30000,
      },
});
