import type { OverstayTariff } from '../lots'
import type { OverstayCharge, Reservation, ReservationStage } from './types'

export function reservationStage(reservation: Reservation, now = Date.now()): ReservationStage {
  const startsAt = new Date(reservation.startsAt).getTime()
  const endsAt = new Date(reservation.endsAt).getTime()

  switch (reservation.status) {
    case 'completed':
      return 'completed'
    case 'no_show':
      return 'no_show'
    case 'checked_in':
      return now >= endsAt ? 'overstay' : 'parked'
    default:
      if (now >= endsAt) return 'no_show'
      return now >= startsAt ? 'waiting' : 'upcoming'
  }
}

/**
 * Excedente a cobrar al salir: el tiempo después del fin de la franja reservada, cobrado en
 * fracciones completas (redondeando hacia arriba) según la tarifa de la playa.
 * El tiempo dentro de la franja ya está pago con la reserva.
 */
export function calculateOverstay(
  reservation: Reservation,
  exitAt: Date | string | number,
  tariff: OverstayTariff,
): OverstayCharge {
  const exit = new Date(exitAt).getTime()
  const minutes = Math.max(0, Math.ceil((exit - new Date(reservation.endsAt).getTime()) / 60_000))
  return { minutes, amount: overstayAmount(minutes, tariff) }
}

/** Monto por una cantidad de minutos excedidos: fracciones completas, redondeando hacia arriba. */
export function overstayAmount(minutes: number, tariff: OverstayTariff): number {
  if (minutes <= 0) return 0
  const fractions = Math.ceil(minutes / tariff.fractionMinutes)
  const pricePerFraction = (tariff.pricePerHour * tariff.fractionMinutes) / 60
  return Math.round(fractions * pricePerFraction)
}
