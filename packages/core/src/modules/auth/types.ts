export type UserRole = 'platform_admin' | 'owner' | 'attendant'

export interface User {
  id: string
  name: string
  username: string
  role: UserRole
}

export interface Session {
  token: string
  user: User
}

export interface LoginCredentials {
  username: string
  password: string
}
