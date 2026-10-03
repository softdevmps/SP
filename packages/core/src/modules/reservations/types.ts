export type ReservationStatus = 'pending' | 'checked_in' | 'completed' | 'no_show'

export interface Reservation {
  id: string
  /** Código que el conductor muestra en su ticket. */
  code: string
  lotId: string
  driverName: string
  vehiclePlate: string
  /** Inicio y fin de la franja reservada (ISO 8601). */
  startsAt: string
  endsAt: string
  status: ReservationStatus
  /** Momento en que el playero validó la llegada (ISO 8601). */
  checkedInAt?: string
  /** Momento en que el playero registró la salida (ISO 8601). */
  checkedOutAt?: string
  /** Excedente cobrado al salir, si se pasó de la franja. */
  overstay?: OverstayCharge
}

export interface OverstayCharge {
  minutes: number
  amount: number
}

/**
 * Etapa de una reserva en el día, derivada del estado y la hora:
 * - upcoming: todavía no empezó su franja
 * - waiting: su franja empezó y el conductor no llegó
 * - no_show: su franja terminó sin que llegara
 * - parked: llegó y está dentro de su franja
 * - overstay: llegó y ya se pasó del fin de su franja
 * - completed: registró la salida
 */
export type ReservationStage = 'upcoming' | 'waiting' | 'no_show' | 'parked' | 'overstay' | 'completed'
