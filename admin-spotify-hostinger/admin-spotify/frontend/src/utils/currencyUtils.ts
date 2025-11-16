/**
 * Formats a number as currency.
 * 
 * @param value - Numeric value to format
 * @param currency - ISO currency code (default: 'USD')
 * @param locale - Locale string (default: undefined, uses browser default)
 * @returns Formatted currency string or '—' if value is null/undefined
 * 
 * @example
 * ```tsx
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // "€1,234.56"
 * formatCurrency(null) // "—"
 * ```
 */
export const formatCurrency = (
  value: number | undefined | null,
  currency: string = 'USD',
  locale?: string
): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Formats a number with thousand separators (no currency symbol).
 * 
 * @param value - Numeric value to format
 * @param locale - Locale string (default: undefined)
 * @returns Formatted number string or '—' if value is null/undefined
 * 
 * @example
 * ```tsx
 * formatNumber(1234.56) // "1,234.56"
 * formatNumber(null) // "—"
 * ```
 */
export const formatNumber = (value: number | undefined | null, locale?: string): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(locale).format(value)
}

/**
 * Formats a percentage value.
 * 
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string or '—' if value is null/undefined
 * 
 * @example
 * ```tsx
 * formatPercentage(12.5) // "12.5%"
 * formatPercentage(12.567, 2) // "12.57%"
 * formatPercentage(null) // "—"
 * ```
 */
export const formatPercentage = (
  value: number | undefined | null,
  decimals: number = 1
): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}%`
}

