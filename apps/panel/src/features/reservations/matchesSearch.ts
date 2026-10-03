import type { Reservation } from '@sp/core'

/** Coincidencia por nombre, patente o código, sin distinguir mayúsculas. */
export function matchesSearch(reservation: Reservation, term: string): boolean {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  return [reservation.driverName, reservation.vehiclePlate, reservation.code].some((value) =>
    value.toLowerCase().includes(needle),
  )
}
