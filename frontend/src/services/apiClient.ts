const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const TOKEN_STORAGE_KEY = 'dashboard.authToken'

type FetchOptions = RequestInit & { skipAuth?: boolean }

export const getApiBaseUrl = () => API_BASE_URL

export const getStoredToken = () =>
  typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(TOKEN_STORAGE_KEY)

export const setStoredToken = (token: string | null) => {
  if (typeof window === 'undefined') return
  if (!token) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  } else {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

export const apiFetch = async <TResponse>(
  path: string,
  options: FetchOptions = {},
): Promise<TResponse> => {
  const { skipAuth, headers, ...rest } = options
  const token = getStoredToken()
  const headerInstance = new Headers(headers as HeadersInit | undefined)

  if (!headerInstance.has('Content-Type')) {
    headerInstance.set('Content-Type', 'application/json')
  }

  if (!skipAuth && token && !headerInstance.has('Authorization')) {
    headerInstance.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: headerInstance,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const errorMessage =
      typeof errorBody.message === 'string'
        ? errorBody.message
        : response.statusText
    const error = new Error(errorMessage || 'API request failed')
    // Attach status for consumers (auth can act on 401)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  return response.json()
}

export const apiDownload = async (
  path: string,
  options: FetchOptions = {},
): Promise<Blob> => {
  const { skipAuth, headers, ...rest } = options
  const token = getStoredToken()
  const headerInstance = new Headers(headers as HeadersInit | undefined)

  if (!skipAuth && token && !headerInstance.has('Authorization')) {
    headerInstance.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: headerInstance,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const error = new Error(errorText || response.statusText || 'Download failed')
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  return response.blob()
}

