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

export interface Lot {
  id: string
  name: string
  address: string
  floors: Floor[]
}
