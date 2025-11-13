import { useState, useCallback } from 'react'
import { useApiErrorHandler } from './useApiErrorHandler'

/**
 * Custom hook for managing async operations with loading, error, and data states.
 * Reduces boilerplate code for common async patterns.
 * 
 * @template T - The type of data returned by the async function
 * @returns Object containing data, loading, error states and execute function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsyncState<Order[]>()
 * 
 * useEffect(() => {
 *   execute(() => fetchOrders())
 * }, [])
 * 
 * if (loading) return <CircularProgress />
 * if (error) return <Alert>{error}</Alert>
 * return <OrdersList orders={data} />
 * ```
 */
export const useAsyncState = <T>() => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleError = useApiErrorHandler()

  const execute = useCallback(
    async (asyncFn: () => Promise<T>, fallbackError?: string): Promise<T | undefined> => {
      try {
        setLoading(true)
        setError(null)
        const result = await asyncFn()
        setData(result)
        return result
      } catch (err) {
        const errorMessage = handleError(err, fallbackError || 'An error occurred')
        setError(errorMessage)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [handleError],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
    setError,
  }
}

