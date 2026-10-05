import { defineStore } from 'pinia'
import { ref } from 'vue'
import { buildMockLotReport } from './mock'
import type { LotReport } from './types'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref<Record<string, LotReport>>({})

  /** MOCK: con backend será GET /api/dueno/playas/{id}/reportes?desde=&hasta=. */
  function reportFor(lotId: string, totalSpaces: number, reservationPricePerHour?: number): LotReport {
    reports.value[lotId] ??= buildMockLotReport(lotId, totalSpaces, reservationPricePerHour)
    return reports.value[lotId]!
  }

  return { reports, reportFor }
})
