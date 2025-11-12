export type UserRole = 'admin' | 'staff'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  active?: boolean
  createdAt?: string
  updatedAt?: string
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



