import { describe, expect, it } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('renders the ₹ symbol, never $', () => {
    expect(formatCurrency(123456)).toContain('₹')
    expect(formatCurrency(123456)).not.toContain('$')
  })

  it('uses Indian digit grouping (lakh/crore), not US thousands grouping', () => {
    // 123456 grouped the Indian way is 1,23,456 -- US grouping would be
    // 123,456. This is the exact case that motivated this whole fix: the
    // Dashboard's Total Revenue stat card.
    expect(formatCurrency(123456, { whole: true })).toBe('₹1,23,456')
  })

  it('matches the task\'s literal example style for a larger value', () => {
    // 12345678 -> ₹1,23,45,678 (crore grouping kicks in after the first
    // two lakh-groups) -- confirms grouping is correct at a second
    // magnitude, not a coincidence of one specific input.
    expect(formatCurrency(12345678, { whole: true })).toBe('₹1,23,45,678')
  })

  it('defaults to 2 decimal places, matching invoices/GST reports elsewhere in the app', () => {
    expect(formatCurrency(123456)).toBe('₹1,23,456.00')
    expect(formatCurrency(99.5)).toBe('₹99.50')
  })

  it('accepts a numeric string -- backend Decimal fields serialize as JSON strings, not numbers', () => {
    expect(formatCurrency('1234.50')).toBe('₹1,234.50')
    expect(formatCurrency('99')).toBe('₹99.00')
  })

  it('treats null, undefined, and non-numeric input as zero rather than throwing or rendering "₹NaN"', () => {
    expect(formatCurrency(null)).toBe('₹0.00')
    expect(formatCurrency(undefined)).toBe('₹0.00')
    expect(formatCurrency('not-a-number')).toBe('₹0.00')
  })

  it('handles zero and negative values without crashing', () => {
    expect(formatCurrency(0)).toBe('₹0.00')
    expect(formatCurrency(-500)).toContain('₹')
    expect(formatCurrency(-500)).not.toContain('$')
  })

  it('never produces a plain unformatted number string', () => {
    const result = formatCurrency(123456)
    expect(result).not.toBe('123456')
    expect(result).not.toBe('123456.00')
  })
})
