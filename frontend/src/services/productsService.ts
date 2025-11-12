import { apiFetch } from './apiClient'
import type { Product, ProductPayload } from '../types/product'

export const fetchProducts = () => apiFetch<Product[]>('/api/products')

export const fetchLowStockProducts = () =>
  apiFetch<Product[]>('/api/products/low-stock')

export const createProduct = async (payload: ProductPayload) => {
  return apiFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateProduct = async (productId: string, payload: ProductPayload) => {
  return apiFetch<Product>(`/api/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteProduct = async (productId: string) => {
  await apiFetch<Product>(`/api/products/${productId}`, {
    method: 'DELETE',
  })
  return productId
}

export const markProductReordered = async (productId: string) => {
  return apiFetch<Product>(`/api/products/${productId}/mark-reordered`, {
    method: 'PUT',
  })
}


