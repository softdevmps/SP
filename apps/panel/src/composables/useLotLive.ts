import { onBeforeUnmount, onMounted } from 'vue'
import { useOccupancyStore } from '@sp/core'

/** Mantiene las actualizaciones en vivo de la playa mientras la pantalla está abierta. */
export function useLotLive() {
  const occupancy = useOccupancyStore()
  onMounted(() => occupancy.connect())
  onBeforeUnmount(() => occupancy.disconnect())
  return occupancy
}
