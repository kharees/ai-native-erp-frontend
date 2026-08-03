/**
 * services/gstReportsService.ts
 * ==================================
 * Maps to backend router: `/api/v1/finance-reports/gst` (app/api/v1/
 * endpoints/gst_reports.py). GSTR-1/GSTR-3B are downloaded as .xlsx blobs
 * (same pattern as universal-inventory/reports/standard's exportCsv --
 * a plain <a href> can't carry the JWT/X-Tenant-ID auth headers) or
 * fetched as JSON for the summary preview.
 */

import apiClient from '@/lib/apiClient'

const GST_REPORTS_BASE = '/api/v1/finance-reports/gst'

export interface GstReportPeriod {
  financialYear: string // e.g. "24-25"
  month: number // 1-12
}

export interface Gstr3bSummary {
  financial_year: string
  month: number
  period_start: string
  period_end_exclusive: string
  invoice_count: number
  total_taxable_value: number
  total_cgst: number
  total_sgst: number
  total_igst: number
  total_tax_liability: number
  total_invoice_value: number
  credit_debit_notes_value: number
}

async function downloadFile(path: string, params: Record<string, unknown>, filename: string): Promise<void> {
  const res = await apiClient.get(path, { params: { ...params, format: 'xlsx' }, responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function downloadGstr1({ financialYear, month }: GstReportPeriod): Promise<void> {
  await downloadFile(
    `${GST_REPORTS_BASE}/gstr1`,
    { financial_year: financialYear, month },
    `GSTR1_${financialYear}_${String(month).padStart(2, '0')}.xlsx`
  )
}

export async function downloadGstr3b({ financialYear, month }: GstReportPeriod): Promise<void> {
  await downloadFile(
    `${GST_REPORTS_BASE}/gstr3b`,
    { financial_year: financialYear, month },
    `GSTR3B_${financialYear}_${String(month).padStart(2, '0')}.xlsx`
  )
}

export async function getGstr3bSummary({ financialYear, month }: GstReportPeriod): Promise<Gstr3bSummary> {
  const response = await apiClient.get<Gstr3bSummary>(`${GST_REPORTS_BASE}/gstr3b`, {
    params: { financial_year: financialYear, month, format: 'json' },
  })
  return response.data
}

export const gstReportsService = {
  downloadGstr1,
  downloadGstr3b,
  getGstr3bSummary,
} as const
