import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Custom hook for handling API errors consistently across components.
 * Automatically handles 401 (unauthorized) errors by logging out the user.
 * 
 * @returns A function that resolves errors to user-friendly messages
 * 
 * @example
 * ```tsx
 * const handleError = useApiErrorHandler()
 * 
 * try {
 *   await someApiCall()
 * } catch (err) {
 *   setError(handleError(err, 'Failed to load data'))
 * }
 * ```
 */
export const useApiErrorHandler = () => {
  const { logout } = useAuth()
  
  return useCallback((err: unknown, fallback: string): string => {
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status?: number }).status === 401
    ) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }, [logout])
}

