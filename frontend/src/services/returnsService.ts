import { apiFetch } from './apiClient'
import type {
  ReturnCreatePayload,
  ReturnRequest,
  ReturnUpdatePayload,
} from '../types/return'

export const fetchReturns = (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const query = params.toString()
  return apiFetch<ReturnRequest[]>(`/api/returns${query ? `?${query}` : ''}`)
}

export const fetchReturnById = (returnId: string) =>
  apiFetch<ReturnRequest>(`/api/returns/${returnId}`)

export const createReturnRequest = (payload: ReturnCreatePayload) =>
  apiFetch<ReturnRequest>('/api/returns', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateReturnRequest = (returnId: string, payload: ReturnUpdatePayload) =>
  apiFetch<ReturnRequest>(`/api/returns/${returnId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })


