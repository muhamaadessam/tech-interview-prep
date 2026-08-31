import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx next dev -H 127.0.0.1 -p 3000",
    url: "http://localhost:3000",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "https://mock.supabase.local",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "playwright-test",
    },
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
