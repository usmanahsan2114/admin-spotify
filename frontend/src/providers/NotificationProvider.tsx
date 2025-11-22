import { useState, useCallback, type ReactNode } from 'react'
import { Snackbar, Alert, type AlertColor } from '@mui/material'
import { NotificationContext, type NotificationType } from '../context/NotificationContext'

interface NotificationProviderProps {
    children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<NotificationType>('info')

    const showNotification = useCallback((msg: string, type: NotificationType = 'info') => {
        setMessage(msg)
        setSeverity(type)
        setOpen(true)
    }, [])

    const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return
        }
        setOpen(false)
    }

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={severity as AlertColor}
                    variant="filled"
                    sx={{ width: '100%', boxShadow: 3 }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    )
}
