import type { Payment, Settlement } from './types'

// MOCK: pagos de reservas de los últimos 30 días en las playas activas.

const LOTS = ['lot-centro', 'lot-2', 'lot-3', 'lot-4', 'lot-5']
const MP_FEE = 0.0629 // comisión aproximada de Mercado Pago, solo para el ejemplo

export function buildMockPayments(): Payment[] {
  const payments: Payment[] = []
  const letters = 'ABCDEFGHJKLMNPRSTVWXYZ'
  const pick = () => letters.charAt(Math.floor(Math.random() * letters.length))
  const methods: Payment['method'][] = ['credit_card', 'debit_card', 'account_money']
  const firstNames = ['Ana', 'Bruno', 'Camila', 'Diego', 'Emilia', 'Federico', 'Gonzalo', 'Inés', 'Joaquín', 'Lucía', 'Martín', 'Paula', 'Sofía', 'Tomás']
  const lastNames = ['Álvarez', 'Benítez', 'Castro', 'Fernández', 'Gómez', 'Herrera', 'López', 'Molina', 'Paz', 'Ríos', 'Ruiz', 'Sosa']
  const plain = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  for (let day = 0; day < 30; day++) {
    const count = 6 + Math.floor(Math.random() * 10)
    for (let index = 0; index < count; index++) {
      const lotId = LOTS[Math.floor(Math.random() * LOTS.length)]!
      const hours = 1 + Math.floor(Math.random() * 4)
      const amount = hours * 1800
      const first = firstNames[Math.floor(Math.random() * firstNames.length)]!
      const last = lastNames[Math.floor(Math.random() * lastNames.length)]!
      const roll = Math.random()
      const status: Payment['status'] = day === 0 && roll < 0.06 ? 'pending' : roll < 0.08 ? 'rejected' : 'approved'
      payments.push({
        id: `pay-${day}-${index}`,
        provider: 'mercadopago',
        providerPaymentId: String(80_000_000_000 + Math.floor(Math.random() * 9_000_000_000)),
        lotId,
        reservationCode: `SP-${Math.floor(Math.random() * 9) + 1}${pick()}${Math.floor(Math.random() * 9) + 1}${pick()}`,
        driverName: `${first} ${last}`,
        driverEmail: `${plain(first)}.${plain(last)}${Math.floor(Math.random() * 90) + 10}@gmail.com`,
        vehiclePlate: `A${pick()} ${Math.floor(Math.random() * 900) + 100} ${pick()}${pick()}`,
        method: methods[Math.floor(Math.random() * methods.length)]!,
        amount,
        providerFee: status === 'approved' ? Math.round(amount * MP_FEE) : 0,
        status,
        createdAt: new Date(Date.now() - day * 86_400_000 - Math.random() * 10 * 3_600_000).toISOString(),
        settlementId: null,
      })
    }
  }
  return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Liquida los pagos aprobados de hace más de 15 días (como si hubiera habido una liquidación quincenal). */
export function buildMockSettlements(payments: Payment[]): Settlement[] {
  const cutoff = Date.now() - 15 * 86_400_000
  const settlements: Settlement[] = []
  for (const lotId of LOTS) {
    const settled = payments.filter(
      (p) => p.lotId === lotId && p.status === 'approved' && new Date(p.createdAt).getTime() < cutoff,
    )
    if (!settled.length) continue
    const id = `set-${lotId}`
    const net = settled.reduce((sum, p) => sum + p.amount - p.providerFee, 0)
    for (const payment of settled) payment.settlementId = id
    const times = settled.map((p) => p.createdAt).sort()
    settlements.push({
      id,
      lotId,
      periodFrom: times[0]!,
      periodTo: times[times.length - 1]!,
      paymentsCount: settled.length,
      netCollected: net,
      platformFee: 0,
      amount: net,
      reference: `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: new Date(cutoff + 86_400_000).toISOString(),
    })
  }
  return settlements
}
