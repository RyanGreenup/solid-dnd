import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the live playground (which imports the library
// from src/), so they exercise real browser scrolling behaviour that jsdom
// cannot. Playwright boots the Vite dev server itself via `webServer`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm playground --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
