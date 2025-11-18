import { apiDownload, apiFetch } from './apiClient'
import type { Order, OrderUpdatePayload } from '../types/order'

export const fetchOrders = (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const query = params.toString()
  return apiFetch<Order[]>(`/api/orders${query ? `?${query}` : ''}`)
}

export const updateOrder = async (orderId: string, payload: OrderUpdatePayload) => {
  return apiFetch<Order>(`/api/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const fetchOrderById = (orderId: string) =>
  apiFetch<Order>(`/api/orders/${orderId}`)

export const downloadOrdersExport = () => apiDownload('/api/export/orders')

export type CreateOrderPayload = {
  productName: string
  customerName: string
  email: string
  phone?: string
  quantity: number
  notes?: string
}

export const createOrder = async (payload: CreateOrderPayload) => {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const importOrders = async (rows: Array<Record<string, unknown>>) => {
  return apiFetch<{
    created: number
    updated: number
    failed: number
    errors: Array<{ index: number; message: string }>
  }>('/api/import/orders', {
    method: 'POST',
    body: JSON.stringify(rows),
  })
}



