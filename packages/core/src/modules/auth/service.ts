import { useAccountsStore } from '../accounts'
import type { LoginCredentials, PasswordChange, Session, User } from './types'

export class AuthError extends Error {}

/**
 * MOCK: valida contra las cuentas que administra el admin (Plataforma › Usuarios). Las cuentas
 * de ejemplo usan la contraseña 123456; las nuevas, la temporal que se muestra al crearlas.
 * Reemplazar por POST /api/auth/login.
 */
export async function login({ username, password }: LoginCredentials): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const accounts = useAccountsStore()
  const normalized = username.trim().toLowerCase()
  const account = accounts.accounts.find((candidate) => candidate.username === normalized)

  if (!account || password !== accounts.mockPasswordOf(normalized)) {
    throw new AuthError('Usuario o contraseña incorrectos.')
  }
  if (!account.active) {
    throw new AuthError('Tu usuario está desactivado. Contactá al administrador.')
  }

  account.lastLoginAt = new Date().toISOString()
  return {
    token: `mock-token-${account.id}`,
    user: {
      id: account.id,
      name: account.name,
      username: account.username,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
    },
  }
}

/** Reglas de la contraseña nueva (las mismas que valida el backend). */
export function passwordChecks(change: PasswordChange) {
  return {
    length: change.next.length >= 8,
    letterAndNumber: /[a-zA-Z]/.test(change.next) && /\d/.test(change.next),
    different: change.next.length > 0 && change.next !== change.current,
  }
}

/** MOCK: con backend será POST /api/auth/cambiar-contrasena. */
export async function changePassword(user: User, change: PasswordChange): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const accounts = useAccountsStore()
  if (change.current !== accounts.mockPasswordOf(user.username)) {
    throw new AuthError('La contraseña actual no es correcta.')
  }
  if (!Object.values(passwordChecks(change)).every(Boolean)) {
    throw new AuthError('La contraseña nueva no cumple los requisitos.')
  }
  accounts.changeOwnPassword(user.id, change.next)
  return { ...user, mustChangePassword: false }
}
