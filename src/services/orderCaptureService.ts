/**
 * services/orderCaptureService.ts
 * ==================================
 * Async client service layer for the Order Capture pipeline (photo of a
 * handwritten order -> draft invoice).
 *
 * Maps to backend router: `/api/v1/omnichannel-billing/order-capture`
 * The `X-Tenant-ID` header is automatically injected by `apiClient` interceptors.
 */

import apiClient from '@/lib/apiClient'
import type {
  CapturedOrderDraft,
  ConfirmedInvoiceSummary,
  ConfirmedQuotationSummary,
  DraftImageUrlResponse,
  OrderCaptureTargetType,
  UpdateDraftLinesPayload,
} from '@/types/orderCapture'

const ORDER_CAPTURE_BASE = '/api/v1/omnichannel-billing/order-capture'

/**
 * Uploads a photo of a handwritten order and returns the resulting draft
 * (already parsed -- upload_and_parse runs synchronously server-side).
 *
 * Maps to: `POST /api/v1/omnichannel-billing/order-capture/upload`
 *
 * customerId/warehouseId are optional -- a photo taken on the shop floor
 * often precedes knowing which customer/warehouse the order is for; both
 * can be set here or corrected later via updateDraftLines().
 */
export async function uploadOrderPhoto(
  file: File,
  customerId?: string,
  warehouseId?: string
): Promise<CapturedOrderDraft> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<CapturedOrderDraft>(
    `${ORDER_CAPTURE_BASE}/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: {
        ...(customerId ? { customer_id: customerId } : {}),
        ...(warehouseId ? { warehouse_id: warehouseId } : {}),
      },
    }
  )
  return response.data
}

/**
 * Replaces a draft's line items wholesale with the caller's corrected
 * version (matched by array index -- lines have no stable id of their
 * own), optionally also setting customer_id/warehouse_id.
 *
 * Maps to: `PATCH /api/v1/omnichannel-billing/order-capture/{id}/lines`
 */
export async function updateDraftLines(
  draftId: string,
  payload: UpdateDraftLinesPayload
): Promise<CapturedOrderDraft> {
  const response = await apiClient.patch<CapturedOrderDraft>(
    `${ORDER_CAPTURE_BASE}/${draftId}/lines`,
    payload
  )
  return response.data
}

/**
 * Confirms a fully-reviewed draft, creating either a real invoice with
 * real stock deduction (targetType="invoice", the default -- app/
 * services/sales_fulfillment.py's create_invoice_with_stock_deduction)
 * or a quotation with a soft stock reservation only (targetType=
 * "quotation" -- create_quotation_with_stock_check). The response shape
 * differs accordingly: ConfirmedInvoiceSummary vs
 * ConfirmedQuotationSummary -- check which targetType you passed to know
 * which one you got back.
 *
 * Maps to: `POST /api/v1/omnichannel-billing/order-capture/{id}/confirm`
 *
 * idempotencyKey should be a fresh UUID generated once per confirm attempt
 * (and reused verbatim on any client-side retry of that same attempt) so a
 * network retry can't double-create the invoice. Not currently enforced
 * for the quotation path -- create_quotation_with_stock_check has no
 * idempotency support of its own yet (a pre-existing gap, not introduced
 * here); the header is still sent for forward compatibility and because
 * it's harmless for the backend to ignore.
 */
export async function confirmDraft(
  draftId: string,
  idempotencyKey: string,
  targetType: OrderCaptureTargetType = 'invoice'
): Promise<ConfirmedInvoiceSummary | ConfirmedQuotationSummary> {
  const response = await apiClient.post<ConfirmedInvoiceSummary | ConfirmedQuotationSummary>(
    `${ORDER_CAPTURE_BASE}/${draftId}/confirm`,
    { target_type: targetType },
    { headers: { 'Idempotency-Key': idempotencyKey } }
  )
  return response.data
}

/**
 * Requests a fresh, short-lived signed URL for a draft's uploaded photo --
 * the only sanctioned way to view it (the Storage bucket is private; see
 * backend/SECURITY_NOTES.md). Never store/reuse the returned url past
 * expires_in_seconds -- call this again to get a new one (e.g. on mount
 * of whatever screen displays the image).
 *
 * Maps to: `GET /api/v1/omnichannel-billing/order-capture/{id}/image-url`
 */
export async function getDraftImageUrl(draftId: string): Promise<DraftImageUrlResponse> {
  const response = await apiClient.get<DraftImageUrlResponse>(
    `${ORDER_CAPTURE_BASE}/${draftId}/image-url`
  )
  return response.data
}

export const orderCaptureService = {
  uploadOrderPhoto,
  updateDraftLines,
  confirmDraft,
  getDraftImageUrl,
} as const
