export type UserRole = 'admin' | 'staff' | 'superadmin'

export type NotificationPreferences = {
  newOrders: boolean
  lowStock: boolean
  returnsPending: boolean
}

export type UserPermissions = {
  viewOrders: boolean
  editOrders: boolean
  deleteOrders: boolean
  viewProducts: boolean
  editProducts: boolean
  deleteProducts: boolean
  viewCustomers: boolean
  editCustomers: boolean
  viewReturns: boolean
  processReturns: boolean
  viewReports: boolean
  manageUsers: boolean
  manageSettings: boolean
}

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  storeId?: string | null // Null for superadmin
  active?: boolean
  createdAt?: string
  updatedAt?: string
  profilePictureUrl?: string
  fullName?: string
  phone?: string
  defaultDateRangeFilter?: 'last7' | 'thisMonth' | 'lastMonth' | 'custom'
  notificationPreferences?: NotificationPreferences
  permissions?: UserPermissions
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: UserRole
  storeId?: string | null // Optional, null for superadmin
  active?: boolean
  permissions?: UserPermissions
}

export type UpdateUserPayload = Partial<
  Pick<User, 'name' | 'role' | 'active' | 'permissions'> & { password?: string }
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
  country?: string
  dashboardName?: string
  defaultOrderStatuses?: string[]
}

export type UpdateBusinessSettingsPayload = Partial<BusinessSettings>



