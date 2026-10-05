import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAccountsStore } from '../accounts'
import { useAuthStore } from '../auth'
import { usePlatformStore } from '../platform/store'
import type { PlatformLot } from '../platform/types'

const storageKey = (userId: string) => `sp.panel.active-lot.${userId}`

function readStored(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId))
  } catch {
    return null
  }
}

/**
 * Playa activa de la sesión (dueño o playero). Las playas de cada usuario salen de su cuenta:
 * el dueño, de las playas que tiene asignadas en Plataforma › Playas; el playero, de las que le
 * asignaron en Plataforma › Usuarios. Todo el panel de la playa trabaja sobre la activa.
 */
export const useActiveLotStore = defineStore('activeLot', () => {
  const auth = useAuthStore()
  const accounts = useAccountsStore()
  const platform = usePlatformStore()
  platform.load()

  const selectedId = ref<string | null>(null)

  /** Playas del usuario (las no suscriptas no tienen panel). */
  const lots = computed<PlatformLot[]>(() => {
    const user = auth.user
    if (!user) return []
    const subscribed = platform.lots.filter((lot) => lot.status !== 'not_subscribed')
    if (user.role === 'owner') return subscribed.filter((lot) => lot.ownerId === user.id)
    if (user.role === 'attendant') {
      const lotIds = accounts.accounts.find((account) => account.id === user.id)?.lotIds ?? []
      return subscribed.filter((lot) => lotIds.includes(lot.id))
    }
    return []
  })

  /** Solo quien tiene más de una playa ve el selector. */
  const hasMany = computed(() => lots.value.length > 1)

  const activeLot = computed(
    () => lots.value.find((lot) => lot.id === selectedId.value) ?? lots.value[0] ?? null,
  )

  // Al cambiar de usuario se recupera la última playa que eligió.
  watch(
    () => auth.user?.id,
    (userId) => (selectedId.value = userId ? readStored(userId) : null),
    { immediate: true },
  )

  function select(lotId: string) {
    if (!lots.value.some((lot) => lot.id === lotId)) return
    selectedId.value = lotId
    const userId = auth.user?.id
    if (!userId) return
    try {
      localStorage.setItem(storageKey(userId), lotId)
    } catch {
      // sin storage disponible: la elección dura lo que dure la pestaña
    }
  }

  return { lots, hasMany, activeLot, select }
})
