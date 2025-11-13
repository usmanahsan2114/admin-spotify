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
    let errorMessage =
      typeof errorBody.message === 'string'
        ? errorBody.message
        : response.statusText
    
    // Provide more context based on status code
    if (!errorMessage || errorMessage === 'OK') {
      switch (response.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input and try again.'
          break
        case 401:
          errorMessage = 'Your session has expired. Please sign in again.'
          break
        case 403:
          errorMessage = 'You do not have permission to perform this action.'
          break
        case 404:
          errorMessage = 'Resource not found.'
          break
        case 409:
          errorMessage = 'A resource with this information already exists.'
          break
        case 422:
          errorMessage = 'Validation error. Please check your input.'
          break
        case 500:
        case 502:
        case 503:
          errorMessage = 'Server error. Please try again later.'
          break
        default:
          errorMessage = 'An error occurred. Please try again.'
      }
    }
    
    const error = new Error(errorMessage)
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
    let errorMessage = errorText || response.statusText || 'Download failed'
    
    // Provide more context for download errors
    if (!errorText) {
      switch (response.status) {
        case 401:
          errorMessage = 'Your session has expired. Please sign in again.'
          break
        case 403:
          errorMessage = 'You do not have permission to download this file.'
          break
        case 404:
          errorMessage = 'File not found.'
          break
        case 500:
        case 502:
        case 503:
          errorMessage = 'Server error. Please try again later.'
          break
      }
    }
    
    const error = new Error(errorMessage)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  return response.blob()
}

