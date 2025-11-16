import { apiFetch } from './apiClient'
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateCurrentUserPayload,
  BusinessSettings,
  UpdateBusinessSettingsPayload,
} from '../types/user'

export const fetchUsers = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const query = params.toString()
  return apiFetch<User[]>(`/api/users${query ? `?${query}` : ''}`)
}

export const createUser = async (payload: CreateUserPayload) => {
  return apiFetch<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateUser = async (userId: string, payload: UpdateUserPayload) => {
  return apiFetch<User>(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteUser = async (userId: string) => {
  await apiFetch(`/api/users/${userId}`, {
    method: 'DELETE',
  })
  return userId
}

export const fetchCurrentUser = async () => {
  return apiFetch<User>('/api/users/me')
}

export const updateCurrentUser = async (payload: UpdateCurrentUserPayload) => {
  return apiFetch<User>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const fetchBusinessSettings = async () => {
  return apiFetch<BusinessSettings>('/api/settings/business')
}

export const updateBusinessSettings = async (payload: UpdateBusinessSettingsPayload) => {
  return apiFetch<BusinessSettings>('/api/settings/business', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}



