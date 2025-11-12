import { apiFetch, setStoredToken } from './apiClient'

const DEV_EMAIL = import.meta.env.VITE_DEV_ADMIN_EMAIL ?? 'admin@example.com'
const DEV_PASSWORD =
  import.meta.env.VITE_DEV_ADMIN_PASSWORD ?? 'admin123'

type LoginResponse = {
  token: string
}

let inFlightAuthPromise: Promise<string | null> | null = null

export const ensureDevAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null
  }

  const existing = window.localStorage.getItem('dashboard.authToken')
  if (existing) {
    return existing
  }

  if (!inFlightAuthPromise) {
    inFlightAuthPromise = (async () => {
      try {
        const result = await apiFetch<LoginResponse>('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
          skipAuth: true,
        })
        setStoredToken(result.token)
        return result.token
      } catch (error) {
        console.error('Failed to retrieve dev auth token', error)
        return null
      } finally {
        inFlightAuthPromise = null
      }
    })()
  }

  return inFlightAuthPromise
}

export const clearAuthToken = () => {
  setStoredToken(null)
}


