/**
 * services/quotationService.ts
 * ================================
 * Maps to backend router: `/api/v1/omnichannel-billing/sales` (app/api/v1/
 * endpoints/universal_sales.py) for quotation reads/PDF/convert, and
 * `/api/v1/omnichannel-billing/order-capture` for the optional
 * "via photo" origin lookup.
 */

import apiClient from '@/lib/apiClient'

const SALES_BASE = '/api/v1/omnichannel-billing/sales'
const ORDER_CAPTURE_BASE = '/api/v1/omnichannel-billing/order-capture'

export interface QuotationItem {
  id: string
  item_id: string
  quantity: number
  // Decimal server-side (Numeric(15,2)) -- Pydantic v2 serializes Decimal
  // as a JSON string, same convention as ConfirmedInvoiceSummary.total_amount
  // (see types/orderCapture.ts). Parse with Number(...) for display.
  unit_price: string
}

export interface Quotation {
  id: string
  tenant_id: string
  customer_id: string
  quotation_number: string
  status: string
  valid_until: string | null
  total_amount: string
  revision_number: number
  items: QuotationItem[]
  created_at: string
  updated_at: string
}

export interface ConvertedInvoiceSummary {
  id: string
  invoice_number: string
  total_amount: string
  status: string
}

export async function getQuotation(id: string): Promise<Quotation> {
  const response = await apiClient.get<Quotation>(`${SALES_BASE}/quotations/${id}`)
  return response.data
}

async function fetchQuotationPdfBlob(id: string): Promise<Blob> {
  const res = await apiClient.get(`${SALES_BASE}/quotations/${id}/pdf`, { responseType: 'blob' })
  return new Blob([res.data], { type: 'application/pdf' })
}

/** Plain <a download> -- a direct <a href> can't carry the JWT/X-Tenant-ID
 * auth headers the endpoint requires, so this goes through apiClient and
 * triggers a Blob download instead (same pattern as gstReportsService.ts). */
export async function downloadQuotationPdf(id: string, quotationNumber: string): Promise<void> {
  const blob = await fetchQuotationPdfBlob(id)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `quotation-${quotationNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/** Web Share API (navigator.share) on mobile -- lets staff share the PDF
 * directly via WhatsApp or any installed app that accepts a file, without
 * a manual "download then attach" round trip. Falls back to a plain
 * download wherever Web Share (or specifically file-sharing support --
 * canShare's file check) isn't available, e.g. desktop browsers. */
export async function shareOrDownloadQuotationPdf(id: string, quotationNumber: string): Promise<void> {
  const filename = `quotation-${quotationNumber}.pdf`
  const blob = await fetchQuotationPdfBlob(id)

  if (typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([blob], filename, { type: 'application/pdf' })
    const shareData = { files: [file], title: filename }
    if (!navigator.canShare || navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        // AbortError -- the user just closed the share sheet without
        // picking anything; not a failure worth falling back for.
        if (err instanceof Error && err.name === 'AbortError') return
        // Any other error (e.g. no app can handle the file): fall through
        // to a plain download below rather than surfacing an error.
      }
    }
  }

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function convertQuotationToInvoice(id: string, idempotencyKey: string): Promise<ConvertedInvoiceSummary> {
  const response = await apiClient.post<ConvertedInvoiceSummary>(
    `${SALES_BASE}/quotations/${id}/convert-to-invoice`,
    undefined,
    { headers: { 'Idempotency-Key': idempotencyKey } }
  )
  return response.data
}

/** Set of quotation ids that originated from the photo-capture pipeline
 * (app/services/order_capture.py's confirm_draft with target_type=
 * "quotation") -- backs the optional "via photo" origin tag on the
 * quotations list page. One call for the whole list. */
export async function getPhotoOriginatedQuotationIds(): Promise<string[]> {
  const response = await apiClient.get<{ quotation_ids: string[] }>(
    `${ORDER_CAPTURE_BASE}/photo-originated-quotation-ids`
  )
  return response.data.quotation_ids
}

export const quotationService = {
  getQuotation,
  downloadQuotationPdf,
  shareOrDownloadQuotationPdf,
  convertQuotationToInvoice,
  getPhotoOriginatedQuotationIds,
} as const
