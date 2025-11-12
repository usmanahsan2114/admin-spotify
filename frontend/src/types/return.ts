export type ReturnStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Refunded'

export type ReturnHistoryEntry = {
  id: string
  timestamp: string
  status: ReturnStatus
  actor?: string
  note?: string
}

export type ReturnCustomer = {
  id: string
  name: string
  email: string
} | null

export type ReturnOrder = {
  id: string
  productName: string
  status?: string
  quantity: number
  createdAt: string
} | null

export type ReturnRequest = {
  id: string
  orderId: string
  customerId: string | null
  reason: string
  returnedQuantity: number
  dateRequested: string
  status: ReturnStatus
  history: ReturnHistoryEntry[]
  customer: ReturnCustomer
  order: ReturnOrder
}

export type ReturnCreatePayload = {
  orderId: string
  reason: string
  returnedQuantity: number
  customerId?: string | null
  status?: ReturnStatus
}

export type ReturnUpdatePayload = {
  status: ReturnStatus
  note?: string
}


