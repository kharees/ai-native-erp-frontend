import path from 'path';
import { test, expect } from '@playwright/test';
import { mockCommonApi, login } from './fixtures/mockApi';

const DRAFT_ID = 'draft-1';

/**
 * Flow (d): Open the photo-capture page -> upload a test fixture image ->
 * confirm the review table renders with confidence indicators.
 */
test.describe('Photo Capture', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApi(page);
    await page.route('**/api/v1/omnichannel-billing/customers/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });
    await page.route('**/api/v1/universal-warehousing/warehouses', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });
  });

  test('uploads a photo and renders the review table with confidence indicators', async ({ page }) => {
    await page.route('**/api/v1/omnichannel-billing/order-capture/upload**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: DRAFT_ID,
          tenant_id: 'tenant-1',
          customer_id: null,
          warehouse_id: null,
          uploaded_image_ref: 'tenant-1/photo.jpg',
          status: 'NEEDS_REVIEW',
          target_type: 'invoice',
          resulting_invoice_id: null,
          resulting_quotation_id: null,
          created_at: '2026-07-30T10:00:00Z',
          updated_at: '2026-07-30T10:00:00Z',
          parsed_line_items: [
            {
              raw_text: '5m Cotton Saree Blue',
              matched_item_id: 'item-1',
              match_confidence: 0.94,
              quantity: 5,
              uom: 'meter',
              unit_price: 450,
              needs_review: false,
            },
            {
              raw_text: 'Silk thred asst',
              matched_item_id: null,
              match_confidence: 0.42,
              quantity: 2,
              uom: null,
              unit_price: 0,
              needs_review: true,
            },
          ],
        }),
      });
    });
    await page.route(`**/api/v1/omnichannel-billing/order-capture/${DRAFT_ID}/image-url`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://example-storage.test/signed/photo.jpg', expires_in_seconds: 300 }),
      });
    });

    await login(page);
    await page.goto('/omnichannel-billing/capture');
    await expect(page.getByRole('heading', { name: 'Capture Order from Photo' })).toBeVisible();

    const fixtureImage = path.join(__dirname, 'fixtures', 'sample-order.jpg');
    await page.locator('input[type="file"]').setInputFiles(fixtureImage);
    await page.getByRole('button', { name: 'Upload & Parse' }).click();

    const table = page.getByTestId('capture-review-table');
    await expect(table).toBeVisible();
    await expect(page.getByTestId('capture-review-row-0')).toContainText('5m Cotton Saree Blue');
    await expect(page.getByTestId('capture-review-row-1')).toContainText('Silk thred asst');

    // The confidence indicator only renders for a needs_review line (see
    // capture/page.tsx) -- row 1 (42% match) must show it, row 0 (94%,
    // auto-accepted) must not.
    await expect(page.getByTestId('capture-confidence-1')).toContainText('42%');
    await expect(page.getByTestId('capture-confidence-1')).toContainText('Needs review');
    await expect(page.getByTestId('capture-confidence-0')).toHaveCount(0);

    await expect(page.getByText('Resolve every highlighted line before confirming.')).toBeVisible();
  });
});
