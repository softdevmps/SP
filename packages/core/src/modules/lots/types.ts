export interface Space {
  id: string
  /** Número visible de la cochera dentro de la playa. */
  number: number
}

export interface Sector {
  id: string
  name: string
  spaces: Space[]
}

export interface Floor {
  id: string
  name: string
  sectors: Sector[]
}

/** Cómo se cobra el tiempo que un conductor se pasa de su reserva. */
export interface OverstayTariff {
  /** Precio por hora en pesos. */
  pricePerHour: number
  /** El excedente se cobra en fracciones de estos minutos, redondeando hacia arriba. */
  fractionMinutes: number
}

export interface Lot {
  id: string
  name: string
  address: string
  floors: Floor[]
  overstayTariff: OverstayTariff
}
