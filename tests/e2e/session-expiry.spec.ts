import { test, expect } from '@playwright/test';
import { mockCommonApi, login } from './fixtures/mockApi';

/**
 * Verifies items 3 & 4 of the "generic dashboard error on session expiry"
 * fix: when a session dies mid-use (e.g. a SECRET_KEY rotation
 * invalidating every outstanding token at once -- see backend/tests/
 * test_auth_middleware.py::test_secret_key_rotation_mid_session_yields_
 * clean_401_not_500 for the backend half of this same scenario), the
 * user must be cleanly redirected to /login with a clear "session
 * expired" message, never left looking at a broken/zeroed page with a
 * vague error banner.
 *
 * Deliberately uses a real client-side navigation (clicking the Audit
 * Log sidebar link), NOT page.goto() -- goto() is a full page reload,
 * which would reset the in-memory auth store and re-trigger
 * AuthGuard's own bootstrapAuth/silent-refresh path instead of the
 * scenario this test targets: an already-logged-in session (live
 * accessToken already in memory) whose NEXT API call discovers the
 * session is dead. That's apiClient.ts's response interceptor path,
 * not AuthGuard's.
 */
test.describe('Session expiry mid-use', () => {
  test('a 401 that survives silent refresh redirects to /login with a clear message', async ({ page }) => {
    await mockCommonApi(page);
    await login(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Simulate the session dying right now (e.g. SECRET_KEY rotated):
    // every subsequent API call 401s, AND the refresh endpoint -- which
    // would normally mint a new access token from the httpOnly cookie --
    // 401s too, since a rotated secret invalidates the refresh token's
    // signature exactly the same way it does the access token's.
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'tenant_authentication_required', detail: 'Invalid or expired JWT token.' }),
      });
    });
    await page.route('**/api/v1/audit/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'tenant_authentication_required', detail: 'Invalid or expired JWT token.' }),
      });
    });

    // "Audit Log" lives under the collapsible "Master Foundation" sidebar
    // section -- expand it first.
    await page.getByRole('button', { name: 'Master Foundation' }).click();
    await page.getByRole('link', { name: 'Audit Log' }).click();

    // apiClient.ts's interceptor issues a hard `window.location.href`
    // redirect (not client-side router.push) precisely so this doesn't
    // depend on any component re-rendering first. Not page.waitForURL()
    // here -- the click above first triggers a client-side Next.js
    // navigation to /audit, which the hard redirect to /login then
    // interrupts/aborts mid-flight; waitForURL races that abort and
    // intermittently reports net::ERR_ABORTED even on runs where the
    // redirect itself (confirmed via the page snapshot) already
    // succeeded. Waiting on the destination page's own content is
    // unaffected by that intermediate-navigation race.
    await expect(page.getByText('Your session has expired. Please log in again.')).toBeVisible();
    expect(new URL(page.url()).searchParams.get('reason')).toBe('session_expired');

    // Confirm this isn't just a URL param nobody reads -- the login form
    // itself must still be usable, not stuck behind the message.
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
