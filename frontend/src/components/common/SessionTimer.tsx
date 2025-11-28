import { useEffect, useState, useCallback } from 'react'
import { Box, Typography, Tooltip, IconButton, CircularProgress } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useAuth } from '../../context/AuthContext'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
    exp: number
    iat: number
    id: string
    email: string
}

export const SessionTimer = () => {
    const { token, logout } = useAuth()
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const calculateTimeLeft = useCallback(() => {
        if (!token) return null
        try {
            const decoded = jwtDecode<DecodedToken>(token)
            const currentTime = Date.now() / 1000
            const remaining = decoded.exp - currentTime
            return remaining > 0 ? remaining : 0
        } catch (error) {
            console.error('Invalid token:', error)
            return 0
        }
    }, [token])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            // We can trigger a refresh by calling an authenticated endpoint that might refresh the cookie
            // Or explicitly call the refresh endpoint if available.
            // Since apiClient handles auto-refresh on 401, we might need to force it.
            // However, usually /api/refresh-token is the way.
            // Assuming we can just call fetch directly to the refresh endpoint or use a context method.
            // For now, let's try to fetch user profile which is a cheap auth check
            // If the token is close to expiry, the backend might issue a new one or we rely on the refresh token flow.

            // Actually, the best way is to have a refresh method in AuthContext.
            // But let's assume we can just reload the page or trigger a state update that causes a re-fetch.
            // A better approach: Call the refresh endpoint directly.

            const response = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            if (response.ok) {
                await response.json()
                // We need to update the token in context. 
                // Since we don't have a setToken exposed, we might need to reload or rely on the fact 
                // that if we use apiClient, it updates the token in localStorage/memory.
                // But here we are using `token` from context.
                // If AuthContext listens to storage changes or we can trigger a reload.
                window.location.reload() // Simple and effective for now to pick up new token
            }
        } catch (error) {
            console.error('Failed to refresh session:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft()
            setTimeLeft(remaining)

            if (remaining !== null && remaining <= 0) {
                // Session expired
                clearInterval(timer)
                logout()
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [calculateTimeLeft, logout])

    if (timeLeft === null) return null

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // Only show if less than 60 minutes left (or always? User asked for it to be seen)
    // Let's show it always for now.

    const isLow = timeLeft < 300 // 5 minutes

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                bgcolor: 'background.paper',
                boxShadow: 3,
                borderRadius: 2,
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                zIndex: 1300,
                border: '1px solid',
                borderColor: isLow ? 'error.main' : 'divider',
                color: isLow ? 'error.main' : 'text.primary',
            }}
        >
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2" fontWeight={600}>
                {formatTime(timeLeft)}
            </Typography>
            <Tooltip title="Extend Session">
                <IconButton size="small" onClick={handleRefresh} disabled={isRefreshing}>
                    {isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
        </Box>
    )
}
