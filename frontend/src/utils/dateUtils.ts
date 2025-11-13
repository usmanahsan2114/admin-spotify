import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export type DateFormat = 'short' | 'long' | 'datetime' | 'time' | 'full'

/**
 * Formats a date string to a human-readable format.
 * 
 * @param value - ISO date string or null/undefined
 * @param format - Format type: 'short' (MMM D, YYYY), 'long' (MMMM D, YYYY), 'datetime' (MMM D, YYYY h:mm A), 'time' (h:mm A), 'full' (full ISO)
 * @returns Formatted date string or '—' if invalid/missing
 * 
 * @example
 * ```tsx
 * formatDate('2024-01-15T10:30:00Z', 'short') // "Jan 15, 2024"
 * formatDate('2024-01-15T10:30:00Z', 'datetime') // "Jan 15, 2024 10:30 AM"
 * formatDate(null) // "—"
 * ```
 */
export const formatDate = (value?: string | null, format: DateFormat = 'short'): string => {
  if (!value) return '—'
  try {
    const date = dayjs(value)
    if (!date.isValid()) return '—'
    
    switch (format) {
      case 'short':
        return date.format('MMM D, YYYY')
      case 'long':
        return date.format('MMMM D, YYYY')
      case 'datetime':
        return date.format('MMM D, YYYY h:mm A')
      case 'time':
        return date.format('h:mm A')
      case 'full':
        return date.format('MMMM D, YYYY [at] h:mm A')
      default:
        return date.format('MMM D, YYYY')
    }
  } catch {
    return '—'
  }
}

/**
 * Formats a date as relative time (e.g., "2 hours ago", "in 3 days").
 * 
 * @param value - ISO date string or null/undefined
 * @returns Relative time string or '—' if invalid/missing
 * 
 * @example
 * ```tsx
 * formatRelativeTime('2024-01-15T10:30:00Z') // "2 hours ago"
 * formatRelativeTime(null) // "—"
 * ```
 */
export const formatRelativeTime = (value?: string | null): string => {
  if (!value) return '—'
  try {
    const date = dayjs(value)
    if (!date.isValid()) return '—'
    return date.fromNow()
  } catch {
    return '—'
  }
}

/**
 * Formats a date range for display.
 * 
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @returns Formatted date range string
 * 
 * @example
 * ```tsx
 * formatDateRange('2024-01-01', '2024-01-31') // "Jan 1 - Jan 31, 2024"
 * ```
 */
export const formatDateRange = (startDate?: string | null, endDate?: string | null): string => {
  if (!startDate || !endDate) return '—'
  try {
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    if (!start.isValid() || !end.isValid()) return '—'
    
    if (start.year() === end.year()) {
      if (start.month() === end.month()) {
        return `${start.format('MMM D')} - ${end.format('D, YYYY')}`
      }
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
    }
    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`
  } catch {
    return '—'
  }
}

