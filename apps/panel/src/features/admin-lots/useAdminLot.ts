import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useHardwareStore, usePlatformStore } from '@sp/core'

/** Playa elegida en la ficha (/plataforma/playas/:lotId/...) con su plano y su hardware. */
export function useAdminLot() {
  const route = useRoute()
  const platform = usePlatformStore()
  const hardware = useHardwareStore()
  const { lots, layouts, settings, ownersById } = storeToRefs(platform)
  const { devicesByLot, sensorsByLot } = storeToRefs(hardware)

  const lotId = computed(() => String(route.params.lotId ?? ''))
  const lot = computed(() => lots.value.find((candidate) => candidate.id === lotId.value) ?? null)
  const layout = computed(() => layouts.value[lotId.value] ?? null)
  const lotSettings = computed(() => settings.value[lotId.value] ?? null)
  const owner = computed(() => (lot.value?.ownerId ? ownersById.value[lot.value.ownerId] : undefined))
  const devices = computed(() => devicesByLot.value[lotId.value] ?? [])
  const sensors = computed(() => sensorsByLot.value[lotId.value] ?? [])
  const isSubscribed = computed(() => !!lot.value && lot.value.status !== 'not_subscribed')

  return { lotId, lot, layout, lotSettings, owner, devices, sensors, isSubscribed, platform, hardware }
}
