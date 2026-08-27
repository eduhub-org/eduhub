import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright runs against a *running* EduHub stack; it never starts one itself.
 *
 * Locally that stack is `docker compose up` (frontend on :5000). In CI the
 * `E2E Tests` workflow publishes the same ports from containers and serves a
 * production build of `apps/edu-hub` on :5000, so both environments are reached
 * through the identical base URL and no `webServer` block is needed. See
 * `e2e/README.md`.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // Generous, because every assertion here crosses the real stack: Next.js SSR,
  // Hasura, Postgres and (for the auth specs) a full Keycloak redirect round
  // trip. Individual actions are capped much tighter via `actionTimeout` below,
  // so a genuinely stuck test still fails on the action rather than burning 90s.
  timeout: 90_000,
  expect: { timeout: 15_000 },

  // Every spec in this suite is read-only, so parallel workers cannot corrupt
  // each other's data. Capped on CI because the app, Hasura, Keycloak, Postgres
  // and the browsers all share one 2-core runner.
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],

  use: {
    baseURL,

    // The app's default locale is German and Next.js only prefixes NON-default
    // locales, so German pages live at `/` and English at `/en`. Next.js also
    // redirects `/` based on `Accept-Language`; pinning the context to de-DE
    // keeps `/` German and leaves the explicit `/en` prefix as the only route
    // into English. Without this the suite would pass or fail depending on the
    // locale of whoever's machine it runs on.
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',

    actionTimeout: 20_000,
    navigationTimeout: 45_000,

    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Only Chromium: the frontend targets evergreen browsers and a second engine
  // would double an already stack-bound run. Add projects here when a
  // cross-engine bug actually justifies the wall-clock cost.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
