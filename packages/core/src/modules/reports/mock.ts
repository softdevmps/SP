import type { DailyMovement, DailyRevenue, LotReport, OccupancyBucket } from './types'

// MOCK: históricos de ejemplo de los últimos 30 días. Con backend salen de EventosOcupacion,
// Reservas, Pagos y CobrosExcedente agregados por día y por hora.

const DAYS = 30

/** Curva típica de una playa céntrica: picos de media mañana y de tarde. */
function hourlyShape(hour: number) {
  if (hour < 7) return 0.08
  if (hour < 9) return 0.35 + (hour - 7) * 0.15
  if (hour < 13) return 0.82 + (hour === 11 ? 0.08 : 0)
  if (hour < 15) return 0.62
  if (hour < 20) return 0.78 + (hour === 18 ? 0.1 : 0)
  if (hour < 22) return 0.45
  return 0.18
}

const WEEKDAY_FACTOR = [0.45, 0.92, 0.95, 0.97, 1, 1.05, 0.7] // domingo … sábado

export function buildMockLotReport(lotId: string, totalSpaces: number, reservationPricePerHour = 1800): LotReport {
  const seed = [...lotId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const jitter = (index: number, spread: number) => (Math.sin(seed * 13 + index * 7.31) * 0.5 + 0.5) * spread

  const byHour: OccupancyBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    key: hour,
    percent: Math.round(Math.min(98, (hourlyShape(hour) + jitter(hour, 0.08)) * 100)),
  }))
  const byWeekday: OccupancyBucket[] = WEEKDAY_FACTOR.map((factor, weekday) => ({
    key: weekday,
    percent: Math.round(Math.min(96, 68 * factor + jitter(weekday + 30, 6))),
  }))

  const movements: DailyMovement[] = []
  const revenue: DailyRevenue[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const factor = WEEKDAY_FACTOR[date.getDay()] ?? 1
    const entries = Math.round(totalSpaces * 2.6 * factor + jitter(offset + 50, totalSpaces * 0.4))
    const reservationArrivals = Math.round(entries * (0.18 + jitter(offset + 90, 0.06)))
    movements.push({
      date: date.toISOString(),
      entries,
      exits: Math.max(0, entries - Math.round(jitter(offset + 70, 6) - 3)),
      reservationArrivals,
    })
    revenue.push({
      date: date.toISOString(),
      reservations: Math.round(reservationArrivals * reservationPricePerHour * (1.6 + jitter(offset + 110, 0.8))),
      overstay: Math.round(reservationArrivals * 0.22 * (500 + jitter(offset + 130, 900))),
    })
  }

  return { lotId, byHour, byWeekday, movements, revenue }
}
