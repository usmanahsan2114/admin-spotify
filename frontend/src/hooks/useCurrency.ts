import { useBusinessSettings } from '../context/BusinessSettingsContext'
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils'

/**
 * Hook to get currency from business settings and format values
 */
export const useCurrency = () => {
  const { settings } = useBusinessSettings()
  const currency = settings?.defaultCurrency || 'USD'
  const country = settings?.country || 'US'

  const getLocale = (countryStr: string | undefined): string => {
    if (!countryStr) return 'en-US'
    const normalized = countryStr.toUpperCase()

    // Map common country names/codes to locales
    const localeMap: Record<string, string> = {
      'USA': 'en-US',
      'US': 'en-US',
      'UNITED STATES': 'en-US',
      'PAKISTAN': 'en-PK',
      'PK': 'en-PK',
      'UK': 'en-GB',
      'GB': 'en-GB',
      'UNITED KINGDOM': 'en-GB',
      'CANADA': 'en-CA',
      'CA': 'en-CA',
      'AUSTRALIA': 'en-AU',
      'AU': 'en-AU',
    }

    return localeMap[normalized] || 'en-US'
  }

  const formatCurrency = (value: number | undefined | null) => {
    const locale = getLocale(settings?.country)
    return formatCurrencyUtil(value, currency, locale)
  }

  return {
    currency,
    country,
    formatCurrency,
  }
}


