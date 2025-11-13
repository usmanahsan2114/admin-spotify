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



