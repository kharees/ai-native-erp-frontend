/**
 * types/orderCapture.ts
 * ======================
 * TypeScript definitions for the Order Capture pipeline.
 * Matches backend Pydantic schemas defined in
 * backend/app/schemas/order_capture.py
 */

export type CapturedOrderDraftStatus =
  | 'PARSING'
  | 'NEEDS_REVIEW'
  | 'CONFIRMED'
  | 'COMMITTED'
  | 'REJECTED'

export interface CapturedOrderDraftLineItem {
  raw_text: string
  matched_item_id: string | null
  match_confidence: number
  quantity: number | null
  uom: string | null
  unit_price: number
  needs_review: boolean
}

export type OrderCaptureTargetType = 'invoice' | 'quotation'

export interface CapturedOrderDraft {
  id: string
  tenant_id: string
  customer_id: string | null
  warehouse_id: string | null
  uploaded_image_ref: string
  parsed_line_items: CapturedOrderDraftLineItem[]
  status: CapturedOrderDraftStatus
  target_type: OrderCaptureTargetType
  resulting_invoice_id: string | null
  resulting_quotation_id: string | null
  created_at: string
  updated_at: string
}

export interface UpdateDraftLinesPayload {
  corrected_lines: CapturedOrderDraftLineItem[]
  customer_id?: string | null
  warehouse_id?: string | null
}

/** A freshly-minted, short-lived signed URL for a draft's uploaded photo
 * -- never a stored/public URL (the Storage bucket is private; see
 * backend/SECURITY_NOTES.md). Request a new one each time the image needs
 * to be shown (e.g. on mount) rather than caching url past
 * expires_in_seconds. */
export interface DraftImageUrlResponse {
  url: string
  expires_in_seconds: number
}

/** Just the fields this page actually reads off the confirmed invoice --
 * the full shape is BillingInvoiceResponse-equivalent server-side, but
 * this page only needs to show a confirmation summary.
 *
 * total_amount is a string, not a number: backend/app/schemas/
 * universal_invoices.py's monetary fields are Decimal (matching the
 * Numeric(15,2) DB columns exactly, to avoid float rounding on money --
 * see that module's own comments), and Pydantic v2 serializes Decimal to
 * a JSON string by default (model_dump(mode="json")), e.g. "240.00" not
 * 240.0. Already formatted to 2 decimal places server-side -- render it
 * directly rather than calling .toFixed() on it (which only exists on
 * number, not string). */
export interface ConfirmedInvoiceSummary {
  id: string
  invoice_number: string
  customer_id: string
  total_amount: string
  status: string
}

/** Returned by POST .../confirm when target_type="quotation" -- shape
 * matches app/services/sales_fulfillment.py's create_quotation_with_
 * stock_check return value exactly (quotation_id/quotation_number/
 * short_items, nothing else -- no total_amount here, unlike the invoice
 * summary above; fetch the quotation itself via GET .../quotations/{id}
 * if the total is needed). short_items is informational, not an error --
 * the quotation and its stock reservations are created either way; see
 * that function's own docstring. */
export interface ConfirmedQuotationSummary {
  quotation_id: string
  quotation_number: string
  short_items: Array<{ item_id: string; requested: number; available: number }>
}
