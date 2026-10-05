import { onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useActiveLotStore, useChatStore } from '@sp/core'
import { useChatSound } from './useChatSound'

/** Conecta el chat de la playa activa mientras el panel está abierto y avisa cada mensaje nuevo. */
export function useChatLive() {
  const chat = useChatStore()
  const { activeLot } = storeToRefs(useActiveLotStore())
  const { notify } = useChatSound()

  watch(
    () => chat.lastIncoming,
    (message) => {
      if (message) notify()
    },
  )

  watch(
    () => activeLot.value?.id,
    (lotId) => (lotId ? chat.connect(lotId) : chat.disconnect()),
    { immediate: true },
  )
  onBeforeUnmount(() => chat.disconnect())
}
