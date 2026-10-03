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
}
