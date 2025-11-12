import { apiFetch } from './apiClient'
import { ensureDevAuthToken } from './authService'
import type { Order, OrderUpdatePayload } from '../types/order'

export const fetchOrders = () => apiFetch<Order[]>('/api/orders')

export const updateOrder = async (orderId: string, payload: OrderUpdatePayload) => {
  await ensureDevAuthToken()
  return apiFetch<Order>(`/api/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const fetchOrderById = (orderId: string) =>
  apiFetch<Order>(`/api/orders/${orderId}`)



