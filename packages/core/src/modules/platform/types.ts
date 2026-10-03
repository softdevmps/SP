/**
 * Estado comercial de una playa en la plataforma:
 * - active: suscripta y operando (sensores, reservas, panel)
 * - onboarding: suscripta pero en instalación (todavía sin reservas)
 * - suspended: suscripta pero suspendida (p. ej. falta de pago); en la app se ve como no suscripta
 * - not_subscribed: no usa el servicio; solo figura "apagada" en el mapa de la app
 */
import type { OverstayTariff } from '../lots'

export type LotStatus = 'active' | 'onboarding' | 'suspended' | 'not_subscribed'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Owner {
  id: string
  name: string
  email: string
  phone: string
}

/** Playa vista desde la plataforma (todas las playas, con sus números principales). */
export interface PlatformLot {
  id: string
  name: string
  address: string
  neighborhood: string
  location: GeoPoint
  status: LotStatus
  ownerId: string | null
  /** Identificador de la playa en los topics MQTT; solo playas suscriptas. */
  mqttCode: string | null
  /** Cocheras: las del plano en playas suscriptas, aproximadas en las no suscriptas. */
  totalSpaces: number
  /** Solo playas activas (con sensores funcionando). */
  freeSpaces: number | null
  faultySensors: number | null
  reservationsToday: number | null
  createdAt: string
}

/** Cuánto cuesta reservar desde la app (se paga por adelantado). */
export interface ReservationTariff {
  pricePerHour: number
  /** Duración mínima de una reserva. */
  minMinutes: number
  /** Las franjas se eligen en saltos de estos minutos (ej. 30 → 10:00, 10:30…). */
  stepMinutes: number
}

/** Horario de un día de la semana (0 = domingo … 6 = sábado). */
export interface OpeningDay {
  weekday: number
  open: boolean
  allDay: boolean
  /** "HH:mm". Si `to` es menor que `from`, cierra al día siguiente. */
  from: string
  to: string
}

/** Configuración comercial y operativa que define el admin para cada playa. */
export interface LotSettings {
  reservationTariff: ReservationTariff
  overstayTariff: OverstayTariff
  openingHours: OpeningDay[]
}

/** Datos que carga el admin al dar de alta o editar una playa. */
export interface PlatformLotInput {
  name: string
  address: string
  neighborhood: string
  location: GeoPoint
  status: LotStatus
  ownerId: string | null
  totalSpaces: number
}
