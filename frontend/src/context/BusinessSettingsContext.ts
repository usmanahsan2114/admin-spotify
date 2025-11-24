import { createContext, useContext } from 'react'
import type { BusinessSettings } from '../types/user'

export type BusinessSettingsContextValue = {
    settings: BusinessSettings | null
    loading: boolean
    refreshSettings: () => Promise<void>
}

export const BusinessSettingsContext = createContext<BusinessSettingsContextValue | undefined>(undefined)

export const useBusinessSettings = () => {
    const context = useContext(BusinessSettingsContext)
    if (!context) {
        throw new Error('useBusinessSettings must be used within BusinessSettingsProvider')
    }
    return context
}
