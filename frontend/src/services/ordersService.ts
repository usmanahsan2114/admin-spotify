import { apiFetch } from './apiClient'
import type { Order, OrderUpdatePayload } from '../types/order'

export const fetchOrders = () => apiFetch<Order[]>('/api/orders')

export const updateOrder = async (orderId: string, payload: OrderUpdatePayload) => {
  return apiFetch<Order>(`/api/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const fetchOrderById = (orderId: string) =>
  apiFetch<Order>(`/api/orders/${orderId}`)



