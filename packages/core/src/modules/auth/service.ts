import type { LoginCredentials, Session, User } from './types'

export class AuthError extends Error {}

// MOCK: usuarios fijos hasta que exista el backend. Reemplazar por POST /auth/login.
const MOCK_PASSWORD = '123456'
const MOCK_USERS: User[] = [
  { id: 'mock-attendant', name: 'Playero', username: 'playero', role: 'attendant' },
  { id: 'mock-admin', name: 'Admin', username: 'admin', role: 'platform_admin' },
]

export async function login({ username, password }: LoginCredentials): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = MOCK_USERS.find((candidate) => candidate.username === username.toLowerCase())
  if (!user || password !== MOCK_PASSWORD) {
    throw new AuthError('Usuario o contraseña incorrectos.')
  }

  return { token: `mock-token-${user.id}`, user }
}
