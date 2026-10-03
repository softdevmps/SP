import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildMockPayments, buildMockSettlements } from './mock'
import type { Payment, Settlement, SettlementRules } from './types'

export interface PendingSettlement {
  lotId: string
  payments: Payment[]
  periodFrom: string | null
  netCollected: number
  platformFee: number | null
  amount: number
}

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref<Payment[]>(buildMockPayments())
  const settlements = ref<Settlement[]>(buildMockSettlements(payments.value))
  const rules = ref<SettlementRules>({ platformFeePercent: null, frequency: null })

  /** Lo que se le debe a cada playa: pagos aprobados todavía sin liquidar. */
  const pendingByLot = computed<PendingSettlement[]>(() => {
    const groups: Record<string, Payment[]> = {}
    for (const payment of payments.value) {
      if (payment.status === 'approved' && !payment.settlementId) (groups[payment.lotId] ??= []).push(payment)
    }
    return Object.entries(groups).map(([lotId, list]) => {
      const netCollected = list.reduce((sum, p) => sum + p.amount - p.providerFee, 0)
      const percent = rules.value.platformFeePercent
      const platformFee = percent === null ? null : Math.round((netCollected * percent) / 100)
      return {
        lotId,
        payments: list,
        periodFrom: list.map((p) => p.createdAt).sort()[0] ?? null,
        netCollected,
        platformFee,
        amount: netCollected - (platformFee ?? 0),
      }
    })
  })

  /** MOCK: con backend será POST /api/admin/liquidaciones. */
  function registerSettlement(lotId: string, reference: string): Settlement | null {
    const pending = pendingByLot.value.find((item) => item.lotId === lotId)
    if (!pending || !pending.payments.length) return null
    const times = pending.payments.map((p) => p.createdAt).sort()
    const settlement: Settlement = {
      id: `set-${Date.now()}`,
      lotId,
      periodFrom: times[0]!,
      periodTo: times[times.length - 1]!,
      paymentsCount: pending.payments.length,
      netCollected: pending.netCollected,
      platformFee: pending.platformFee ?? 0,
      amount: pending.amount,
      reference: reference.trim(),
      paidAt: new Date().toISOString(),
    }
    for (const payment of pending.payments) {
      const stored = payments.value.find((p) => p.id === payment.id)
      if (stored) stored.settlementId = settlement.id
    }
    settlements.value.unshift(settlement)
    return settlement
  }

  /** MOCK: con backend será PUT /api/admin/liquidaciones/reglas. */
  function saveRules(value: SettlementRules) {
    rules.value = { ...value }
  }

  return { payments, settlements, rules, pendingByLot, registerSettlement, saveRules }
})
