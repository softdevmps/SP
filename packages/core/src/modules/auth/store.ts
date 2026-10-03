import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authService from './service'
import type { LoginCredentials, PasswordChange, Session } from './types'

const STORAGE_KEY = 'sp.session.v2'

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function storeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // sin storage disponible: la sesión dura lo que dure la pestaña
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(readStoredSession())

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => session.value !== null)

  async function login(credentials: LoginCredentials) {
    session.value = await authService.login(credentials)
    storeSession(session.value)
  }

  async function changePassword(change: PasswordChange) {
    if (!session.value) return
    const user = await authService.changePassword(session.value.user, change)
    session.value = { ...session.value, user }
    storeSession(session.value)
  }

  function logout() {
    session.value = null
    storeSession(null)
  }

  return { user, isAuthenticated, login, logout, changePassword }
})
