import { apiFetch } from './apiClient'

export type Store = {
  id: string
  name: string
  dashboardName: string
  domain: string
  category: string
  isDemo?: boolean
  createdAt: string
  defaultCurrency?: string
  country?: string
  logoUrl?: string | null
  brandColor?: string
}

export type StoreWithStats = Store & {
  userCount: number
  orderCount: number
  productCount: number
  customerCount: number
  totalRevenue: number
  pendingOrdersCount: number
  lowStockCount: number
  adminUser: {
    id: string
    email: string
    name: string
    active: boolean
  } | null
}

export type CreateStorePayload = {
  name: string
  dashboardName: string
  domain: string
  category: string
  defaultCurrency?: string
  country?: string
  logoUrl?: string
  brandColor?: string
  isDemo?: boolean
}

export type UpdateStorePayload = Partial<CreateStorePayload>

export type StoreAdminCredentialsPayload = {
  email: string
  password?: string
  name?: string
}

export const fetchStores = () => apiFetch<Store[]>('/api/stores')

export const fetchStoresWithStats = () => apiFetch<StoreWithStats[]>('/api/stores/admin')

export const createStore = (payload: CreateStorePayload) =>
  apiFetch<Store>('/api/stores', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateStore = (storeId: string, payload: UpdateStorePayload) =>
  apiFetch<Store>(`/api/stores/${storeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const createOrUpdateStoreAdminCredentials = (storeId: string, payload: StoreAdminCredentialsPayload) =>
  apiFetch<{ id: string; email: string; name: string; role: string; active: boolean; storeId: string }>(
    `/api/stores/${storeId}/admin-credentials`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )

