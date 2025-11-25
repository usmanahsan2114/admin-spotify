import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { apiFetch } from '../services/apiClient'
import { useAuth } from './AuthContext'
import type { BusinessSettings } from '../types/user'
import { BusinessSettingsContext } from './BusinessSettingsContext'

export const BusinessSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true)

      // Check if we have a token before trying any API calls
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('dashboard.authToken') : null

      if (!token) {
        // If not authenticated, use default settings immediately (don't call API)
        setSettings({
          logoUrl: undefined, // No logo on public pages
          dashboardName: 'Shopify Admin Dashboard', // Generic title for public pages
          defaultCurrency: 'USD',
          country: 'US',
        })
        setLoading(false)
        return
      }

      // Only fetch settings if authenticated
      try {
        const fullSettings = await apiFetch<BusinessSettings>('/api/settings/business')
        setSettings(fullSettings)
      } catch {
        // If authenticated endpoint fails, use defaults
        setSettings({
          logoUrl: undefined,
          dashboardName: 'Shopify Admin Dashboard',
          defaultCurrency: 'USD',
          country: 'US',
        })
      }
    } catch {
      // Failed to load settings - use defaults
      setSettings({
        logoUrl: undefined,
        dashboardName: 'Shopify Admin Dashboard',
        defaultCurrency: 'USD',
        country: 'US',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings, isAuthenticated])

  const value = useMemo(
    () => ({ settings, loading, refreshSettings }),
    [settings, loading, refreshSettings]
  )

  return (
    <BusinessSettingsContext.Provider value={value}>
      {children}
    </BusinessSettingsContext.Provider>
  )
}


