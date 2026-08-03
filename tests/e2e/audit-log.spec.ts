import { test, expect } from '@playwright/test';
import { mockCommonApi, login } from './fixtures/mockApi';

/**
 * Flow (b): Navigate to Audit Log -> loads without the "No tenant_id
 * claim found" error.
 *
 * Regression target: the tenant-context failure bug where the Audit Log
 * page surfaced a raw "No tenant_id claim found" error instead of the
 * real log data.
 */
test.describe('Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApi(page);
  });

  test('loads real audit entries with no tenant-context error', async ({ page }) => {
    await page.route('**/api/v1/audit/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'a1',
            user_id: 'u1',
            action_category: 'AUTH',
            action_type: 'LOGIN_SUCCESS',
            action_source: 'web',
            resource_id: null,
            old_values: null,
            new_values: null,
            ip_address: '10.0.0.5',
            user_agent: 'Mozilla/5.0',
            correlation_id: 'corr-1',
            created_at: '2026-07-29T10:00:00Z',
          },
        ]),
      });
    });

    await login(page);
    await page.goto('/audit');

    await expect(page.getByRole('heading', { name: 'Audit & Activity Log' })).toBeVisible();
    await expect(page.getByText('No tenant_id claim found')).toHaveCount(0);
    // Scoped to non-empty alerts -- Next.js's built-in route-announcer
    // (see login-dashboard.spec.ts's comment) is always present with
    // role="alert" but always empty; a blanket count-0 check would
    // false-positive on it regardless of any real app error.
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(0);
    await expect(page.getByText('LOGIN_SUCCESS')).toBeVisible();
  });

  test('a genuine tenant-context error from the backend is surfaced visibly, not swallowed', async ({ page }) => {
    // Defensive regression guard: if this exact backend failure mode ever
    // comes back, the frontend must show it loudly (a real Alert), never
    // silently render an empty table as if nothing were wrong.
    await page.route('**/api/v1/audit/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No tenant_id claim found' }),
      });
    });

    await login(page);
    await page.goto('/audit');

    // NOT page.getByRole('alert') here: app/(main)/audit/page.tsx renders
    // its error banner as a plain styled <div>{error}</div>, not the
    // shared <Alert> component every other page in this suite uses (which
    // is what sets role="alert") -- confirmed via this exact test while
    // writing this suite. The message IS shown visually (this assertion
    // passes), but a screen reader gets no notification when it appears,
    // unlike every other page's error state. Real, minor a11y
    // inconsistency, flagged in this suite's report rather than silently
    // patched here or silently asserted around.
    await expect(page.getByText('No tenant_id claim found')).toBeVisible();
  });
});
