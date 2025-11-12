export type OrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Paid'
  | 'Shipped'
  | 'Refunded'
  | 'Completed'

export type Order = {
  id: string
  productName: string
  customerName: string
  email: string
  phone: string
  quantity: number
  status: OrderStatus
  isPaid: boolean
  notes: string
  createdAt: string
  updatedAt?: string
  submittedBy?: string | null
}

export type OrderUpdatePayload = Partial<
  Pick<Order, 'status' | 'notes' | 'quantity' | 'phone' | 'isPaid'>
>


