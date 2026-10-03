import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { buildHardwareAlerts, useHardwareStore, usePlatformStore } from '@sp/core'

/** Carga plano y hardware de todas las playas suscriptas (Monitoreo y Resumen las miran juntas). */
export function useAllLotsHardware() {
  const platform = usePlatformStore()
  const hardware = useHardwareStore()
  const { lots } = storeToRefs(platform)
  const { devices, sensors } = storeToRefs(hardware)

  platform.load()
  for (const lot of lots.value) {
    platform.ensureSettings(lot.id)
    const layout = platform.ensureLayout(lot.id)
    if (layout) hardware.loadLot(layout, { installed: lot.status !== 'onboarding' })
  }

  const alerts = computed(() => buildHardwareAlerts(devices.value, sensors.value))
  const lotsById = computed(() => Object.fromEntries(lots.value.map((lot) => [lot.id, lot])))

  return { lots, lotsById, devices, sensors, alerts }
}
