/**
 * lib/formatCurrency.ts
 * ========================
 * The ONE shared money-formatting utility for the whole app. This is an
 * India-only ERP -- every monetary value must render as ₹ with Indian
 * numbering (lakh/crore grouping, e.g. ₹1,23,456.00, not
 * ₹123,456.00) -- never a raw "$" prefix or US-style thousands grouping.
 *
 * Before this existed, ~50 components each hand-rolled their own
 * `${value.toFixed(2)}` or `${value.toLocaleString()}` -- every one of
 * them a US-dollar-shaped string with no currency symbol logic at all,
 * which is how the Dashboard's "Total Revenue" (and everywhere else)
 * ended up showing $ instead of ₹. Every call site should use this
 * function instead of formatting money inline, so the whole app can
 * never drift out of sync with itself again.
 *
 * Backend money fields are Decimal (Numeric columns), which Pydantic v2
 * serializes as JSON strings, not numbers (e.g. "1234.50", not 1234.5)
 * -- see the many "total_amount is a string, not a number" comments
 * throughout frontend/src/types/*.ts. This function accepts both
 * `number` and `string` for exactly that reason, so callers never need
 * their own `Number(...)` conversion first.
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const INR_FORMATTER_NO_DECIMALS = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export interface FormatCurrencyOptions {
  /** Show whole rupees only (no paise) -- useful for large dashboard
   * headline stats where ".00" is just noise. Defaults to false (2
   * decimal places), matching how money is shown everywhere else in the
   * app (invoices, GST reports). */
  whole?: boolean
}

/**
 * Formats a monetary value as Indian Rupees with Indian-style digit
 * grouping, e.g. formatCurrency(1234567) -> "₹12,34,567.00".
 *
 * Accepts number, numeric string (Decimal-as-JSON-string from the
 * backend), null, or undefined -- null/undefined/non-numeric input is
 * treated as 0 rather than throwing or rendering "₹NaN", since every
 * call site here is a display context (a stat card, a table cell) where
 * a missing value should read as zero, not crash the page.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const numeric = typeof value === 'number' ? value : Number(value)
  const safe = Number.isFinite(numeric) ? numeric : 0
  const formatter = options.whole ? INR_FORMATTER_NO_DECIMALS : INR_FORMATTER
  return formatter.format(safe)
}

export default formatCurrency
