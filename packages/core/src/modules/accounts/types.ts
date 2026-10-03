import type { UserRole } from '../auth'

/** Cuenta del personal (admin, dueño o playero). Las crea el admin de plataforma. */
export interface StaffAccount {
  id: string
  name: string
  username: string
  role: UserRole
  email: string
  phone: string
  /** Playas a las que accede un playero. La de un dueño sale de las playas que tiene asignadas. */
  lotIds: string[]
  active: boolean
  /** Debe cambiar la contraseña temporal al ingresar. */
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface StaffAccountInput {
  name: string
  username: string
  role: UserRole
  email: string
  phone: string
  lotIds: string[]
}
