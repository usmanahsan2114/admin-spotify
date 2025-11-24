import { createContext, useContext } from 'react'
import type { User } from '../types/user'

export type SignupPayload = {
    name: string
    email: string
    password: string
    role?: User['role']
}

export type AuthState = {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    needsPasswordChange: boolean
    login: (email: string, password: string) => Promise<{ needsPasswordChange?: boolean }>
    signup: (payload: SignupPayload) => Promise<void>
    logout: () => Promise<void>
    loading: boolean
}

export const AuthContext = createContext<AuthState | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const STORAGE_KEY = 'dashboard.user'
