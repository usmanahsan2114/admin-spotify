import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { apiFetch, setStoredToken, getStoredToken } from '../services/apiClient'
import type { User } from '../types/user'
import { AuthContext, type AuthState, type SignupPayload, STORAGE_KEY } from './AuthContext'

type LoginResponse = {
  token: string
  user: User
  needsPasswordChange?: boolean
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = getStoredToken()
    const storedUser =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(STORAGE_KEY)
        : null

    if (savedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User
        setToken(savedToken)
        setUser(parsedUser)
      } catch {
        // Invalid stored user data - clear it
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    })
    setStoredToken(result.token)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
    setNeedsPasswordChange(result.needsPasswordChange || false)
    return { needsPasswordChange: result.needsPasswordChange || false }
  }, [])

  const signup = useCallback(async (payload: SignupPayload) => {
    const result = await apiFetch<LoginResponse>('/api/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    })
    setStoredToken(result.token)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setStoredToken(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
      setToken(null)
      setUser(null)
      setNeedsPasswordChange(false)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: Boolean(token),
      user,
      token,
      needsPasswordChange,
      login,
      signup,
      logout,
      loading,
    }),
    [token, user, needsPasswordChange, login, signup, logout, loading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


