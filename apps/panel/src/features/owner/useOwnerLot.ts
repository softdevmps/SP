import { computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import {
  buildHardwareAlerts,
  useActiveLotStore,
  useHardwareStore,
  usePaymentsStore,
  usePlatformStore,
  useReportsStore,
} from '@sp/core'

/** Playa activa del dueño con todo lo que muestran sus pantallas de gestión. */
export function useOwnerLot() {
  const platform = usePlatformStore()
  const hardware = useHardwareStore()
  const reports = useReportsStore()
  const { activeLot } = storeToRefs(useActiveLotStore())
  const { layouts, settings } = storeToRefs(platform)
  const { devicesByLot, sensorsByLot } = storeToRefs(hardware)
  const { payments, settlements, pendingByLot, rules } = storeToRefs(usePaymentsStore())

  // Carga perezosa del plano, la configuración y el hardware de la playa elegida.
  watchEffect(() => {
    const lot = activeLot.value
    if (!lot) return
    platform.ensureSettings(lot.id)
    const layout = platform.ensureLayout(lot.id)
    if (layout) hardware.loadLot(layout, { installed: lot.status !== 'onboarding' })
  })

  const lotId = computed(() => activeLot.value?.id ?? '')
  const layout = computed(() => layouts.value[lotId.value] ?? null)
  const lotSettings = computed(() => settings.value[lotId.value] ?? null)
  const devices = computed(() => devicesByLot.value[lotId.value] ?? [])
  const sensors = computed(() => sensorsByLot.value[lotId.value] ?? [])
  const alerts = computed(() => buildHardwareAlerts(devices.value, sensors.value))
  const lotPayments = computed(() => payments.value.filter((payment) => payment.lotId === lotId.value))
  const lotSettlements = computed(() => settlements.value.filter((s) => s.lotId === lotId.value))
  const pending = computed(() => pendingByLot.value.find((item) => item.lotId === lotId.value) ?? null)
  const report = computed(() =>
    activeLot.value
      ? reports.reportFor(lotId.value, activeLot.value.totalSpaces, lotSettings.value?.reservationTariff.pricePerHour)
      : null,
  )

  return {
    activeLot,
    lotId,
    layout,
    lotSettings,
    devices,
    sensors,
    alerts,
    lotPayments,
    lotSettlements,
    pending,
    rules,
    report,
  }
}
