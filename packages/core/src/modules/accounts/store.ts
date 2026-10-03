import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildMockAccounts } from './mock'
import type { StaffAccount, StaffAccountInput } from './types'

const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Contraseña temporal legible (sin caracteres ambiguos). La real la genera y hashea el backend. */
function temporaryPassword() {
  const values = crypto.getRandomValues(new Uint32Array(10))
  return Array.from(values, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join('')
}

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<StaffAccount[]>(buildMockAccounts())
  /** MOCK: contraseñas en claro solo para poder probar el login. El backend guarda hashes. */
  const mockPasswords = ref<Record<string, string>>({})

  function mockPasswordOf(username: string) {
    return mockPasswords.value[username] ?? '123456'
  }

  const owners = computed(() => accounts.value.filter((account) => account.role === 'owner'))

  function isUsernameTaken(username: string, exceptId?: string) {
    const normalized = username.trim().toLowerCase()
    return accounts.value.some((account) => account.username === normalized && account.id !== exceptId)
  }

  /** MOCK: con backend será POST /api/admin/usuarios. Devuelve la contraseña temporal para mostrarla una vez. */
  function createAccount(input: StaffAccountInput): { account: StaffAccount; password: string } {
    const account: StaffAccount = {
      id: `u-${Date.now()}`,
      ...input,
      username: input.username.trim().toLowerCase(),
      lotIds: input.role === 'attendant' ? input.lotIds : [],
      active: true,
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    }
    accounts.value.unshift(account)
    const password = temporaryPassword()
    mockPasswords.value[account.username] = password
    return { account, password }
  }

  /** MOCK: con backend será PUT /api/admin/usuarios/{id}. */
  function updateAccount(id: string, input: StaffAccountInput) {
    const account = accounts.value.find((candidate) => candidate.id === id)
    if (!account) return
    Object.assign(account, {
      ...input,
      username: input.username.trim().toLowerCase(),
      lotIds: input.role === 'attendant' ? input.lotIds : [],
    })
  }

  /** MOCK: con backend será POST /api/admin/usuarios/{id}/restablecer-contrasena. */
  function resetPassword(id: string): string {
    const account = accounts.value.find((candidate) => candidate.id === id)
    const password = temporaryPassword()
    if (account) {
      account.mustChangePassword = true
      mockPasswords.value[account.username] = password
    }
    return password
  }

  /** MOCK: el cambio de contraseña del propio usuario. Con backend: POST /api/auth/cambiar-contrasena. */
  function changeOwnPassword(id: string, password: string) {
    const account = accounts.value.find((candidate) => candidate.id === id)
    if (!account) return
    mockPasswords.value[account.username] = password
    account.mustChangePassword = false
  }

  /** MOCK: con backend será POST /api/admin/usuarios/{id}/estado. */
  function setActive(id: string, active: boolean) {
    const account = accounts.value.find((candidate) => candidate.id === id)
    if (account) account.active = active
  }

  return { accounts, owners, mockPasswordOf, changeOwnPassword, isUsernameTaken, createAccount, updateAccount, resetPassword, setActive }
})
