import { defineConfig, devices } from '@playwright/test';

/**
 * playwright.config.ts
 * =====================
 * E2E smoke suite for the five core flows in tests/e2e/. There is no live
 * backend/database wired into this config -- every spec intercepts
 * `**\/api/v1/**` via page.route() and fulfills with fixture JSON (see
 * tests/e2e/fixtures/mockApi.ts). This mirrors how this repo's existing
 * frontend test (src/lib/formatCurrency.test.ts, Vitest) has zero backend
 * dependency, and matches what the "frontend" CI job already does (build +
 * type-check only, no Postgres/backend service) -- these specs prove the
 * FRONTEND renders/behaves correctly given a known-shaped API response,
 * the same boundary the three bugs this suite targets actually live at
 * (tenant-context error handling, currency formatting, button contrast).
 * Full request/response integration against the real FastAPI backend is
 * already covered by backend/tests/ (pytest, 100+ tests) -- not
 * duplicated here.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Chromium-based mobile emulation (Pixel 5's device descriptor --
      // real mobile UA + touch, not just a resized Desktop Chrome window)
      // with the viewport overridden to the requested 390x844. Not
      // devices['iPhone 13'] (WebKit) -- this repo only installs the
      // Chromium browser binary (see CI step below); pulling in a second
      // full browser engine just for one viewport size isn't worth the
      // extra install weight when Chromium's mobile emulation already
      // exercises the same responsive/mobile layout branches.
      name: 'mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],

  webServer: {
    // A production build+start, not `npm run dev`: dev mode compiles each
    // route on-demand on its first request (visible as "Fast Refresh
    // rebuilding" in the browser console) -- under fullyParallel workers
    // hitting several different routes for the first time simultaneously,
    // that on-demand compile latency was enough to blow through a spec's
    // 30s test timeout (confirmed by re-running the same interaction
    // standalone under 1 worker, with no timeout, and it completing in
    // under 2s). A prod build compiles everything up front once, so
    // per-route navigation during the actual test run is fast and stable
    // regardless of worker count -- and it's more representative of what
    // actually ships, which this CI job already builds in the step right
    // before this one runs (see .github/workflows/ci.yml).
    // `next start` prints a warning about next.config.js's
    // output:"standalone" (that mode's real entrypoint is
    // .next/standalone/server.js, built for the Docker image -- see that
    // config's own comment) but still serves correctly from the regular
    // .next build tree that `next build` also produces alongside the
    // standalone one; confirmed by a full green run. Harmless here, not
    // worth the extra static/public-copying complexity standalone's
    // proper entrypoint would need just for local/CI E2E.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8000',
      NEXT_PUBLIC_APP_NAME: 'AI-Native ERP',
      NEXT_PUBLIC_APP_VERSION: '0.1.0',
      NEXT_PUBLIC_SUPABASE_URL: 'https://ci-placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'ci-placeholder-anon-key',
    },
  },
});
