import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { apiFetch } from '../services/apiClient'
import { useAuth } from './AuthContext'
import type { BusinessSettings } from '../types/user'

type BusinessSettingsContextValue = {
  settings: BusinessSettings | null
  loading: boolean
  refreshSettings: () => Promise<void>
}

const BusinessSettingsContext = createContext<BusinessSettingsContextValue | undefined>(undefined)

export const BusinessSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true)
      // Always fetch public settings first (no auth required)
      const publicSettings = await apiFetch<{ logoUrl?: string | null; dashboardName?: string; defaultCurrency?: string; country?: string }>(
        '/api/settings/business/public',
        { skipAuth: true }
      )

      // Check if we have a token before trying authenticated endpoint
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('dashboard.authToken') : null

      if (token) {
        // Try to get full settings if authenticated (will fail silently if not)
        try {
          const fullSettings = await apiFetch<BusinessSettings>('/api/settings/business')
          setSettings(fullSettings)
        } catch {
          // If authenticated endpoint fails, use public settings
          setSettings({
            logoUrl: publicSettings.logoUrl || undefined,
            dashboardName: publicSettings.dashboardName,
            defaultCurrency: publicSettings.defaultCurrency || 'USD',
            country: publicSettings.country || 'US',
          })
        }
      } else {
        // If not authenticated, use generic settings (don't show store-specific branding)
        setSettings({
          logoUrl: undefined, // No logo on public pages
          dashboardName: 'Shopify Admin Dashboard', // Generic title for public pages
          defaultCurrency: publicSettings.defaultCurrency || 'USD',
          country: publicSettings.country || 'US',
        })
      }
    } catch (err) {
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

  return (
    <BusinessSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </BusinessSettingsContext.Provider>
  )
}

export const useBusinessSettings = () => {
  const context = useContext(BusinessSettingsContext)
  if (!context) {
    throw new Error('useBusinessSettings must be used within BusinessSettingsProvider')
  }
  return context
}


