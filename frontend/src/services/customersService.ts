import { apiDownload, apiFetch } from './apiClient'
import type { Customer, CustomerDetail, CustomerPayload } from '../types/customer'

export const fetchCustomers = () => apiFetch<Customer[]>('/api/customers')

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



