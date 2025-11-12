export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  createdAt: string
  orderIds: string[]
  orderCount?: number
  lastOrderDate?: string | null
}

export type CustomerDetail = Customer & {
  orders: Array<{
    id: string
    productName: string
    status: string
    createdAt?: string
    total?: number
  }>
}

export type CustomerPayload = {
  name: string
  email: string
  phone?: string
}


