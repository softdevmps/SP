export type SpaceStatus = 'free' | 'occupied' | 'fault'

/** Estado actual de cada cochera, indexado por id de cochera. */
export type OccupancySnapshot = Record<string, SpaceStatus>

/** Momento del último cambio de estado de cada cochera (ISO 8601). */
export type OccupancySince = Record<string, string>

/** Un cambio de estado reportado por un sensor. */
export interface OccupancyEvent {
  id: string
  spaceId: string
  status: SpaceStatus
  at: string
}

/** Ubicación de una cochera dentro de la playa, para mostrarla sin recorrer el plano. */
export interface SpaceLocation {
  spaceId: string
  number: number
  floorId: string
  floorName: string
  sectorName: string
}

export interface FloorOccupancy {
  floorId: string
  name: string
  total: number
  free: number
  occupied: number
  faults: number
}

export interface SectorOccupancy {
  floorId: string
  floorName: string
  sectorId: string
  sectorName: string
  total: number
  free: number
}
