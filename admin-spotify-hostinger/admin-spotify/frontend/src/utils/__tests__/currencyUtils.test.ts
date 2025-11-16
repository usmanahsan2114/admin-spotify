import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatPercentage } from '../currencyUtils'

describe('currencyUtils', () => {
  describe('formatCurrency', () => {
    it('should return "—" for null or undefined', () => {
      expect(formatCurrency(null)).toBe('—')
      expect(formatCurrency(undefined)).toBe('—')
    })

    it('should format currency in USD by default', () => {
      expect(formatCurrency(100)).toMatch(/\$|USD/)
      expect(formatCurrency(100)).toMatch(/100/)
    })

    it('should format currency with different currency codes', () => {
      const result = formatCurrency(100, 'EUR')
      expect(result).toMatch(/100/)
    })

    it('should handle decimal values', () => {
      const result = formatCurrency(99.99)
      expect(result).toMatch(/99/)
    })
  })

  describe('formatNumber', () => {
    it('should return "—" for null or undefined', () => {
      expect(formatNumber(null)).toBe('—')
      expect(formatNumber(undefined)).toBe('—')
    })

    it('should format numbers', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })
  })

  describe('formatPercentage', () => {
    it('should return "—" for null or undefined', () => {
      expect(formatPercentage(null)).toBe('—')
      expect(formatPercentage(undefined)).toBe('—')
    })

    it('should format percentages', () => {
      expect(formatPercentage(50)).toMatch(/50/)
      expect(formatPercentage(50, 1)).toMatch(/50/)
    })
  })
})

