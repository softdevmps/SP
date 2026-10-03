export type PaymentStatus = 'approved' | 'pending' | 'rejected'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'account_money'

/**
 * Pago previo de una reserva hecho desde la app. Lo cobra la plataforma (Mercado Pago, con
 * posibilidad de sumar otros medios). El admin ve el pago completo, con los datos del conductor.
 */
export interface Payment {
  id: string
  provider: 'mercadopago'
  providerPaymentId: string
  lotId: string
  reservationCode: string
  driverName: string
  driverEmail: string
  vehiclePlate: string
  method: PaymentMethod
  /** Lo que pagó el conductor. */
  amount: number
  /** Comisión del medio de pago. */
  providerFee: number
  status: PaymentStatus
  createdAt: string
  /** Liquidación en la que se le pagó a la playa, si ya se liquidó. */
  settlementId: string | null
}

/** Reglas de liquidación. Todavía sin definir: se dejan configurables y vacías. */
export interface SettlementRules {
  /** Porcentaje que se queda la plataforma sobre lo cobrado (null = sin definir). */
  platformFeePercent: number | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | null
}

/** Pago de la plataforma a una playa por las reservas cobradas en un período. */
export interface Settlement {
  id: string
  lotId: string
  periodFrom: string
  periodTo: string
  paymentsCount: number
  /** Cobrado neto de comisión del medio de pago. */
  netCollected: number
  platformFee: number
  /** Lo que se le transfirió a la playa. */
  amount: number
  reference: string
  paidAt: string
}
