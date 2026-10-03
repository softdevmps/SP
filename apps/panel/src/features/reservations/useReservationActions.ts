import { inject, provide, type InjectionKey } from 'vue'
import type { Reservation } from '@sp/core'

export interface ReservationActions {
  openArrival: (reservation: Reservation) => void
  openExit: (reservation: Reservation) => void
}

const KEY: InjectionKey<ReservationActions> = Symbol('reservation-actions')

/** El layout de Reservas aloja los diálogos; las pantallas de adentro los abren con esto. */
export function provideReservationActions(actions: ReservationActions) {
  provide(KEY, actions)
}

export function useReservationActions(): ReservationActions {
  const actions = inject(KEY)
  if (!actions) throw new Error('useReservationActions se usa dentro de ReservationsLayout')
  return actions
}
