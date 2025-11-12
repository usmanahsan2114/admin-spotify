import { apiFetch } from './apiClient'
import { ensureDevAuthToken } from './authService'
import type { Product, ProductPayload } from '../types/product'

export const fetchProducts = () => apiFetch<Product[]>('/api/products')

export const createProduct = async (payload: ProductPayload) => {
  await ensureDevAuthToken()
  return apiFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateProduct = async (productId: string, payload: ProductPayload) => {
  await ensureDevAuthToken()
  return apiFetch<Product>(`/api/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteProduct = async (productId: string) => {
  await ensureDevAuthToken()
  await apiFetch<Product>(`/api/products/${productId}`, {
    method: 'DELETE',
  })
  return productId
}


