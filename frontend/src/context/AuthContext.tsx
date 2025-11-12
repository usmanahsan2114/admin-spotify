import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { apiFetch, setStoredToken, getStoredToken } from '../services/apiClient'
import type { User } from '../types/user'

type AuthState = {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

type LoginResponse = {
  token: string
  user: User
}

type SignupPayload = {
  name: string
  email: string
  password: string
  role?: User['role']
}

const STORAGE_KEY = 'dashboard.user'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
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
      } catch (error) {
        console.warn('Failed to parse stored user', error)
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

  const logout = useCallback(() => {
    setStoredToken(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: Boolean(token),
      user,
      token,
      login,
      signup,
      logout,
      loading,
    }),
    [token, user, login, signup, logout, loading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


