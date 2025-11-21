export type OrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Paid'
  | 'Shipped'
  | 'Refunded'
  | 'Completed'

import type { ReturnRequest } from './return'

export type Order = {
  id: string
  productName: string
  customerName: string
  email: string
  phone: string
  quantity: number
  status: OrderStatus
  isPaid: boolean
  paymentMethod?: string
  notes: string
  createdAt: string
  updatedAt?: string
  submittedBy?: string | null
  total?: number
  timeline?: Array<{
    id: string
    description: string
    timestamp: string
    actor?: string
  }>
  returns?: ReturnRequest[]
}

export type OrderUpdatePayload = Partial<
  Pick<Order, 'status' | 'notes' | 'quantity' | 'phone' | 'isPaid'>
>


