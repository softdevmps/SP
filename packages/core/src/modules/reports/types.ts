/** Ocupación promedio (0–100) de una franja: una hora del día o un día de la semana. */
export interface OccupancyBucket {
  key: number
  percent: number
}

/** Movimiento de vehículos de un día, según los sensores (cada ocupación/liberación de cochera). */
export interface DailyMovement {
  date: string
  entries: number
  exits: number
  /** Ingresos de conductores con reserva (validados por el playero). */
  reservationArrivals: number
}

/** Recaudación de un día. */
export interface DailyRevenue {
  date: string
  /** Cobrado por la plataforma por reservas (aprobado, antes de comisiones). */
  reservations: number
  /** Excedentes que cobró el playero en efectivo. */
  overstay: number
}

export interface LotReport {
  lotId: string
  byHour: OccupancyBucket[]
  byWeekday: OccupancyBucket[]
  movements: DailyMovement[]
  revenue: DailyRevenue[]
}
