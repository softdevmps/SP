import type { PaymentMethod, PaymentStatus, SettlementRules } from '@sp/core'
import type { StatusTone } from '@/components/StatusPill.vue'

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: StatusTone }> = {
  approved: { label: 'Aprobado', tone: 'success' },
  pending: { label: 'Pendiente', tone: 'warning' },
  rejected: { label: 'Rechazado', tone: 'danger' },
}

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  account_money: 'Dinero en cuenta',
}

export const FREQUENCY: Record<NonNullable<SettlementRules['frequency']>, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

/** Inicio del día y del mes actuales (hora local), para los totales. */
export function periodStarts() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const month = new Date(today.getFullYear(), today.getMonth(), 1)
  return { today: today.getTime(), month: month.getTime() }
}
