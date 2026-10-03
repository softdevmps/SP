import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useChatStore } from '@sp/core'
import { useChatSound } from './useChatSound'

// MOCK: la playa del usuario logueado. Con backend sale de la sesión.
const CURRENT_LOT_ID = 'lot-centro'

/** Conecta el chat de la playa mientras el panel está abierto y avisa con sonido cada mensaje nuevo. */
export function useChatLive() {
  const chat = useChatStore()
  const { notify } = useChatSound()

  watch(
    () => chat.lastIncoming,
    (message) => {
      if (message) notify()
    },
  )

  onMounted(() => chat.connect(CURRENT_LOT_ID))
  onBeforeUnmount(() => chat.disconnect())
}
