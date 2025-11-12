import { apiFetch } from './apiClient'
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user'

export const fetchUsers = async () => {
  return apiFetch<User[]>('/api/users')
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



