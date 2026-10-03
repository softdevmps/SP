export type UserRole = 'platform_admin' | 'owner' | 'attendant'

export interface User {
  id: string
  name: string
  username: string
  role: UserRole
  /** Ingresó con una contraseña temporal: tiene que cambiarla antes de usar el panel. */
  mustChangePassword?: boolean
}

export interface Session {
  token: string
  user: User
}

export interface PasswordChange {
  current: string
  next: string
}

export interface LoginCredentials {
  username: string
  password: string
}
