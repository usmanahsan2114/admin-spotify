const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const TOKEN_STORAGE_KEY = 'dashboard.authToken'

type FetchOptions = RequestInit & { skipAuth?: boolean; retries?: number }

// Retry configuration
const DEFAULT_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504] // Server errors that might be transient

/**
 * Retry logic for failed API requests
 * Only retries on server errors (5xx) and network errors
 */
const retryFetch = async <TResponse>(
  fetchFn: () => Promise<Response>,
  retries: number = DEFAULT_RETRIES,
  delay: number = RETRY_DELAY,
): Promise<Response> => {
  try {
    const response = await fetchFn()
    
    // If response is ok or not retryable, return immediately
    if (response.ok || !RETRYABLE_STATUS_CODES.includes(response.status)) {
      return response
    }
    
    // If we have retries left and it's a retryable error, retry
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryFetch(fetchFn, retries - 1, delay * 2) // Exponential backoff
    }
    
    return response
  } catch (error) {
    // Network errors are retryable
    if (retries > 0 && error instanceof TypeError) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryFetch(fetchFn, retries - 1, delay * 2)
    }
    throw error
  }
}

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
  const { skipAuth, headers, retries = DEFAULT_RETRIES, ...rest } = options
  const token = getStoredToken()
  const headerInstance = new Headers(headers as HeadersInit | undefined)

  if (!headerInstance.has('Content-Type')) {
    headerInstance.set('Content-Type', 'application/json')
  }

  if (!skipAuth && token && !headerInstance.has('Authorization')) {
    headerInstance.set('Authorization', `Bearer ${token}`)
  }

  const fetchFn = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: headerInstance,
    })

  const response = await retryFetch(fetchFn, retries)

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
          // If skipAuth is true, this is expected for public endpoints
          if (skipAuth) {
            errorMessage = 'Access denied. This resource requires authentication.'
          } else {
            // Use the actual error message from backend if available
            errorMessage = errorBody.message || 'Your session has expired. Please sign in again.'
          }
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
    // Attach status and original message for consumers (auth can act on 401)
    ;(error as Error & { status?: number; originalMessage?: string }).status = response.status
    ;(error as Error & { status?: number; originalMessage?: string }).originalMessage = errorBody.message
    throw error
  }

  return response.json()
}

export const apiDownload = async (
  path: string,
  options: FetchOptions = {},
): Promise<Blob> => {
  const { skipAuth, headers, retries = DEFAULT_RETRIES, ...rest } = options
  const token = getStoredToken()
  const headerInstance = new Headers(headers as HeadersInit | undefined)

  if (!skipAuth && token && !headerInstance.has('Authorization')) {
    headerInstance.set('Authorization', `Bearer ${token}`)
  }

  const fetchFn = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: headerInstance,
    })

  const response = await retryFetch(fetchFn, retries)

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

