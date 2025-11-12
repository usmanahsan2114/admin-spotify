import { apiFetch } from './apiClient'
import type {
  ReturnCreatePayload,
  ReturnRequest,
  ReturnUpdatePayload,
} from '../types/return'

export const fetchReturns = () => apiFetch<ReturnRequest[]>('/api/returns')

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


