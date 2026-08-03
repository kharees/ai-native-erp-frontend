import { test, expect } from '@playwright/test';
import { mockCommonApi, login } from './fixtures/mockApi';

/**
 * Regression target: the app's PRIMARY AI entry points were wired to a
 * mock. components/AIChatPanel.tsx answered every message with hardcoded
 * text from a setTimeout and never called the backend, and it was what
 * opened from the Sidebar's "Ask AI Assistant" and PageShell's "Ask AI"
 * button (present on all 49 pages). The real orchestrator-backed
 * assistant was only reachable by manually navigating to /ai-assistant.
 *
 * These specs prove the global entry points now reach the REAL
 * orchestrator: opening the assistant from several different pages and
 * sending a question must issue POST /api/v1/agent/chat carrying that
 * exact question, and must render the server's reply -- never the old
 * canned string.
 *
 * The assistant's answer here comes from an intercepted route (this
 * suite's convention -- see playwright.config.ts), so what's proven is
 * the wiring: the question leaves the browser for the real endpoint and
 * the real response is what gets rendered. The orchestrator's own
 * tool-calling correctness is covered by backend/tests/test_orchestrator.py.
 */

const QUESTION = 'what were my sales last month';
const ORCHESTRATOR_REPLY =
  'Your sales last month were Rs 2,45,670.50 across 128 invoices.';

/** The exact string the deleted mock used to emit. If this ever renders
 * again, the mock has been reintroduced. */
const CANNED_MOCK_TEXT = "I've analyzed that request";

/** Captures every POST the browser makes to the real agent endpoint and
 * answers with an orchestrator-shaped response. */
async function mockAgentChat(page: import('@playwright/test').Page, calls: string[]) {
  await page.route('**/api/v1/agent/chat', async (route) => {
    const body = route.request().postDataJSON() as {
      messages: { role: string; content: string }[];
    };
    const lastUser = [...body.messages].reverse().find((m) => m.role === 'user');
    calls.push(lastUser?.content ?? '');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'done',
        text: ORCHESTRATOR_REPLY,
        pending_tool_call: null,
        messages: [
          ...body.messages,
          { role: 'assistant', content: ORCHESTRATOR_REPLY, tool_calls: null },
        ],
      }),
    });
  });
}

test.describe('Global AI Assistant reaches the real orchestrator', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApi(page);
  });

  // Three different routes, all rendering PageShell's "Ask AI" button.
  for (const { name, path } of [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Users', path: '/users' },
    { name: 'Purchase Orders', path: '/procurement/purchase-orders' },
  ]) {
    test(`"Ask AI" on ${name} sends the question to POST /api/v1/agent/chat`, async ({ page }) => {
      const calls: string[] = [];
      await mockAgentChat(page, calls);

      await login(page);
      await page.goto(path);

      // PageShell's button is exactly "Ask AI"; the Sidebar's is
      // "Ask AI Assistant" -- exact:true keeps this unambiguous.
      await page.getByRole('button', { name: 'Ask AI', exact: true }).click();

      // Opens as the slide-over Drawer, same as the panel it replaced.
      await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();

      await page.getByPlaceholder(/ask the ai assistant/i).fill(QUESTION);
      await page.getByRole('button', { name: 'Send' }).click();

      // The real reply is rendered...
      await expect(page.getByText(ORCHESTRATOR_REPLY)).toBeVisible();
      // ...and the question actually left the browser for the real endpoint.
      expect(calls).toContain(QUESTION);
      // ...and the deleted mock's canned text never appears.
      await expect(page.getByText(CANNED_MOCK_TEXT)).toHaveCount(0);
    });
  }

  test('Sidebar "Ask AI Assistant" opens the same real assistant', async ({ page }) => {
    const calls: string[] = [];
    await mockAgentChat(page, calls);

    await login(page);
    await page.getByRole('button', { name: 'Ask AI Assistant' }).click();

    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();
    await page.getByPlaceholder(/ask the ai assistant/i).fill(QUESTION);
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText(ORCHESTRATOR_REPLY)).toBeVisible();
    expect(calls).toContain(QUESTION);
    await expect(page.getByText(CANNED_MOCK_TEXT)).toHaveCount(0);
  });
});
