import { test, expect } from '@playwright/test';
import { mockCommonApi, login } from './fixtures/mockApi';

/**
 * Flow (c): Create an invoice through the UI -> confirm it appears in the
 * invoice list with correct GST fields.
 *
 * The create form is a single-line-item form (item/quantity/unit price,
 * not a bare total-amount field) -- app/(main)/omnichannel-billing/
 * invoices/page.tsx was fixed, during a frontend/backend API contract
 * audit, from posting {customer_id, invoice_number, subtotal,
 * total_amount} with no `items` array at all (UniversalTaxInvoiceCreate
 * requires a non-empty items array -- every submission 422'd) to build a
 * real items array, mirroring omnichannel-billing/quotations/page.tsx's
 * existing single-line-item pattern. This spec both exercises the fixed
 * form and asserts the POST payload actually carries `items` now.
 *
 * NOTE on "GST fields": the list view only renders invoice_number/
 * customer/type/amount/status columns -- it does not render CGST/SGST/
 * IGST even though the backend schema (universal_invoices.py) carries
 * total_cgst/total_sgst/total_igst per invoice. Real product gap, flagged
 * separately in this suite's own report rather than silently asserted
 * against UI that doesn't exist.
 */
test.describe('Create Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApi(page);
    await page.route('**/api/v1/omnichannel-billing/customers/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'cust-1', name: 'Acme Textiles Pvt Ltd' }] }),
      });
    });
    await page.route('**/api/v1/universal-inventory/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'item-1', name: 'Cotton Saree Blue' }] }),
      });
    });
  });

  test('creates a tax invoice and it appears in the list', async ({ page }) => {
    const createdInvoices: Record<string, unknown>[] = [];

    await page.route('**/api/v1/omnichannel-billing/invoices/tax', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const payload = route.request().postDataJSON();
        const created = {
          id: 'inv-new-1',
          customer_id: payload.customer_id,
          invoice_number: payload.invoice_number,
          status: 'DRAFT',
          total_amount: Number(payload.total_amount).toFixed(2),
          total_cgst: '450.00',
          total_sgst: '450.00',
          total_igst: '0.00',
        };
        createdInvoices.push({ ...created, _rawPayload: payload });
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: createdInvoices }),
      });
    });
    await page.route('**/api/v1/omnichannel-billing/invoices/proforma', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });

    await login(page);
    await page.goto('/omnichannel-billing/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices Engine' })).toBeVisible();

    await page.getByRole('button', { name: 'Create Invoice' }).click();
    await page.getByLabel('Customer').selectOption({ label: 'Acme Textiles Pvt Ltd' });
    await page.getByLabel('Invoice Number').fill('INV/2026/0001');
    await page.getByLabel('Item').selectOption({ label: 'Cotton Saree Blue' });
    await page.getByLabel('Quantity').fill('10');
    await page.getByLabel('Unit Price').fill('500');
    await page.getByRole('button', { name: 'Save Invoice' }).click();

    const table = page.getByTestId('invoices-table');
    await expect(table).toBeVisible();
    await expect(table).toContainText('INV/2026/0001');
    await expect(table).toContainText('Acme Textiles Pvt Ltd');
    await expect(table).toContainText('₹5,000.00');

    expect(createdInvoices).toHaveLength(1);
    expect(createdInvoices[0]).toMatchObject({ invoice_number: 'INV/2026/0001' });

    // The regression this spec exists to catch: a non-empty items array
    // must actually be in the POST payload (UniversalTaxInvoiceCreate's
    // one required field this form previously never sent).
    const rawPayload = createdInvoices[0]._rawPayload as { items?: unknown[] };
    expect(rawPayload.items).toHaveLength(1);
    expect(rawPayload.items?.[0]).toMatchObject({ item_id: 'item-1', quantity: 10 });
  });
});
