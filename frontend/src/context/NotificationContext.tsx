import { createContext, useContext } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}
