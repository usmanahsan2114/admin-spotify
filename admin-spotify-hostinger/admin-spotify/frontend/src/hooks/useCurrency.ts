import { useBusinessSettings } from '../context/BusinessSettingsContext'
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils'

/**
 * Hook to get currency from business settings and format values
 */
export const useCurrency = () => {
  const { settings } = useBusinessSettings()
  const currency = settings?.defaultCurrency || 'USD'
  const country = settings?.country || 'US'

  const formatCurrency = (value: number | undefined | null) => {
    // Use country code to determine locale (e.g., 'US' -> 'en-US', 'PK' -> 'en-PK')
    const locale = country ? `en-${country}` : undefined
    return formatCurrencyUtil(value, currency, locale)
  }

  return {
    currency,
    country,
    formatCurrency,
  }
}


