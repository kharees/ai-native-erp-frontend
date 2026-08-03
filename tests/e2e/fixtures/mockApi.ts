import { Page } from '@playwright/test';

/**
 * tests/e2e/fixtures/mockApi.ts
 * ================================
 * Shared backend-response mocks for the E2E suite. See playwright.config.ts's
 * top-of-file comment for why this suite intercepts `/api/v1/**` instead of
 * hitting a live backend.
 */

export const TEST_TENANT_ID = '11111111-1111-4111-8111-111111111111';
export const TEST_USER_ID = '22222222-2222-4222-8222-222222222222';

export const TEST_USER = {
  id: TEST_USER_ID,
  email: 'dealer@example.com',
  tenant_id: TEST_TENANT_ID,
  full_name: 'Test Dealer',
};

/** Registers baseline mocks every authenticated page needs: login,
 * dashboard-summary, users list, inventory summary, and recent audit
 * activity (the last two are fetched by the Dashboard page on every
 * mount). Call BEFORE navigating. Individual specs add/override routes
 * for whatever else that specific flow needs. */
export async function mockCommonApi(page: Page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'test-access-token', user: TEST_USER }),
    });
  });

  // bootstrapAuth's silent refresh (authStore.ts). Every page.goto() in
  // this suite is a full page reload -- that resets the in-memory Zustand
  // store (accessToken/hasBootstrapped are deliberately NOT persisted,
  // see authStore.ts's security-model comment), so AuthGuard re-fires
  // bootstrapAuth on every single navigation after login, not just the
  // first one. In real production this succeeds via the httpOnly
  // refresh_token cookie the backend set on login; mocking it as a
  // rejection (as an earlier version of this fixture did) made every
  // post-login page.goto() bounce straight back to /login, since a
  // failed refresh triggers authStore.logout(). Defaulting to success
  // here (same token/user login already returned) matches what a real
  // browser reload after a real login actually does. A spec that
  // specifically wants to exercise the logged-out/expired-session path
  // can override this route itself.
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'test-refreshed-token', user: TEST_USER }),
    });
  });

  await page.route('**/api/v1/finance-reports/dashboard-summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        revenue: '245670.50',
        netProfit: '58900.25',
        operatingMargin: '23.98',
        cashPosition: '112000.00',
        arOutstanding: '34200.00',
        apOutstanding: '18900.00',
      }),
    });
  });

  await page.route('**/api/v1/users/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([TEST_USER]) });
  });

  await page.route('**/api/v1/universal-reports/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total_items: 128, total_quantity: 4310 }),
    });
  });

  // NOT '**/api/v1/audit/?**' -- app/(main)/audit/page.tsx calls
  // apiClient.get('/api/v1/audit/', { params }) with an empty params
  // object by default (no category filter selected), and axios omits the
  // query string entirely when params is empty -- there is no literal
  // "?" in that request URL to match against. A pattern requiring one
  // (as an earlier version of this fixture had) silently fell through to
  // a real, unmocked network call and produced a "failed to load" error
  // on every test that didn't explicitly re-route this endpoint itself.
  await page.route('**/api/v1/audit/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

/** Logs in through the real login form (mocked POST /auth/login) and
 * waits for the Dashboard to render -- the shared entry point every
 * other spec's beforeEach uses so each spec starts from an authenticated
 * session, not a raw page.goto() past AuthGuard. */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard');
}
