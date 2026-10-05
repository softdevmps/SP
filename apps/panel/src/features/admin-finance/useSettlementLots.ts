import { storeToRefs } from 'pinia'
import { usePlatformStore } from '@sp/core'

/** Nombre de la playa y de su dueño, para las tablas de liquidaciones. */
export function useSettlementLots() {
  const { lots, ownersById } = storeToRefs(usePlatformStore())
  const lotOf = (lotId: string) => lots.value.find((lot) => lot.id === lotId)
  const lotName = (lotId: string) => lotOf(lotId)?.name ?? lotId
  const ownerName = (lotId: string) => {
    const ownerId = lotOf(lotId)?.ownerId
    return ownerId ? (ownersById.value[ownerId]?.name ?? '—') : '—'
  }
  return { lotName, ownerName }
}
