import { apiDownload, apiFetch } from './apiClient'
import type { Product, ProductPayload } from '../types/product'

export const fetchProducts = (skipAuth = false) => 
  apiFetch<Product[]>(skipAuth ? '/api/products/public' : '/api/products', { skipAuth })

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

export const downloadProductsExport = () => apiDownload('/api/export/products')

export const importProducts = async (rows: Array<Record<string, unknown>>) => {
  return apiFetch<{
    created: number
    updated: number
    failed: number
    errors: Array<{ index: number; message: string }>
  }>('/api/import/products', {
    method: 'POST',
    body: JSON.stringify(rows),
  })
}



