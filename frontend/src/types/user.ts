export type UserRole = 'admin' | 'staff'

export type NotificationPreferences = {
  newOrders: boolean
  lowStock: boolean
  returnsPending: boolean
}

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  active?: boolean
  createdAt?: string
  updatedAt?: string
  profilePictureUrl?: string
  fullName?: string
  phone?: string
  defaultDateRangeFilter?: 'last7' | 'thisMonth' | 'lastMonth' | 'custom'
  notificationPreferences?: NotificationPreferences
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: UserRole
  active?: boolean
}

export type UpdateUserPayload = Partial<
  Pick<User, 'name' | 'role' | 'active'> & { password: string }
>

export type UpdateCurrentUserPayload = {
  fullName?: string
  phone?: string
  profilePictureUrl?: string
  defaultDateRangeFilter?: 'last7' | 'thisMonth' | 'lastMonth' | 'custom'
  notificationPreferences?: NotificationPreferences
}

export type BusinessSettings = {
  logoUrl?: string
  brandColor?: string
  defaultCurrency?: string
  defaultOrderStatuses?: string[]
}

export type UpdateBusinessSettingsPayload = Partial<BusinessSettings>



