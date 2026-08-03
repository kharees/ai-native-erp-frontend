import { test, expect } from '@playwright/test';
import { mockCommonApi, login } from './fixtures/mockApi';

/**
 * Flow (a): Login with valid credentials -> lands on Dashboard -> no error
 * banner visible -> revenue stat renders with a Rupee symbol (explicitly
 * asserts NO "$" appears anywhere on the page).
 *
 * Regression target: the USD-instead-of-INR currency bug (Dashboard's
 * Total Revenue stat previously rendered with a literal "$").
 */
test.describe('Login -> Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApi(page);
  });

  test('logs in, lands on Dashboard, shows no error banner, and renders revenue in Rupees not Dollars', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // No error banner anywhere on the page. Scoped to alerts with actual
    // text: Next.js's built-in route-announcer (an always-present,
    // visually-hidden accessibility live region that announces client-side
    // navigations to screen readers) also carries role="alert" but is
    // always empty -- a blanket getByRole('alert') count would false-
    // positive on it every time, on every page, regardless of any real
    // app error. This app's own Alert component (components/ui/Alert.tsx)
    // always renders a message, so filtering to non-empty text isolates
    // real error banners without missing any genuine one.
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(0);

    const revenueStat = page.getByTestId('stat-revenue');
    await expect(revenueStat).toBeVisible();
    await expect(revenueStat).toContainText('₹'); // ₹

    // The hard assertion this spec exists for: no literal "$" anywhere on
    // the rendered page, not just within the revenue stat.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('$');
  });
});
