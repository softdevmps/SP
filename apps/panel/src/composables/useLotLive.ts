import { onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useActiveLotStore, useOccupancyStore } from '@sp/core'

/** Mantiene las actualizaciones en vivo de la playa activa mientras la pantalla está abierta. */
export function useLotLive() {
  const occupancy = useOccupancyStore()
  const { activeLot } = storeToRefs(useActiveLotStore())

  // Si el usuario cambia de playa desde el header, la pantalla pasa a mostrar la nueva.
  watch(
    () => activeLot.value?.id,
    (lotId) => {
      if (lotId && activeLot.value?.status !== 'onboarding') occupancy.connect(lotId)
      else occupancy.disconnect()
    },
    { immediate: true },
  )
  onBeforeUnmount(() => occupancy.disconnect())
  return occupancy
}
