import { describe, it, expect } from 'vitest'
import { formatDate, formatRelativeTime } from '../dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should return "—" for null or undefined', () => {
      expect(formatDate(null)).toBe('—')
      expect(formatDate(undefined)).toBe('—')
    })

    it('should format date in default format', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should format date in short format', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = formatDate(date, 'short')
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should format date in long format', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = formatDate(date, 'long')
      expect(result).toMatch(/January 15, 2024/)
    })

    it('should format date in datetime format', () => {
      const date = '2024-01-15T10:30:00Z'
      const result = formatDate(date, 'datetime')
      expect(result).toMatch(/Jan 15, 2024/)
      expect(result).toMatch(/10:30/)
    })

    it('should return "—" for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('—')
    })
  })

  describe('formatRelativeTime', () => {
    it('should return "—" for null or undefined', () => {
      expect(formatRelativeTime(null)).toBe('—')
      expect(formatRelativeTime(undefined)).toBe('—')
    })

    it('should format relative time', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
      const result = formatRelativeTime(pastDate)
      expect(result).toMatch(/ago/)
    })
  })
})

