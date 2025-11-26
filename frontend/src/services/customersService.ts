import { apiDownload, apiFetch } from './apiClient'
import type { Customer, CustomerDetail, CustomerPayload } from '../types/customer'

export const fetchCustomers = (startDate?: string, endDate?: string, page: number = 1, limit: number = 100, search?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  params.append('offset', ((page - 1) * limit).toString())
  params.append('limit', limit.toString())
  if (search) params.append('search', search)

  const query = params.toString()
  return apiFetch<{ data: Customer[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } } | Customer[]>(`/api/customers${query ? `?${query}` : ''}`)
}

export const searchCustomers = (query: string) =>
  apiFetch<Customer[]>(`/api/customers/search?query=${encodeURIComponent(query)}`)

export const createCustomer = (payload: CustomerPayload) =>
  apiFetch<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const fetchCustomerById = (customerId: string) =>
  apiFetch<CustomerDetail>(`/api/customers/${customerId}`)

export const updateCustomer = (customerId: string, payload: CustomerPayload) =>
  apiFetch<Customer>(`/api/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const downloadCustomersExport = () => apiDownload('/api/export/customers')



