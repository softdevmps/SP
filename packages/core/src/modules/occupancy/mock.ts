import type { Lot } from '../lots'
import type { Reservation } from '../reservations'
import type { OccupancyEvent, OccupancySince, OccupancySnapshot, SpaceStatus } from './types'

// MOCK: datos de una playa de ejemplo y simulación de sensores. Se reemplaza por la API
// (snapshot inicial) y el canal en tiempo real (cambios de sensores) cuando exista el backend.

const FLOORS = 3
const SECTORS = ['A', 'B', 'C', 'D']
const SPACES_PER_SECTOR = 10

export function buildMockLot(): Lot {
  let number = 1
  return {
    id: 'lot-centro',
    name: 'Playa Centro',
    address: 'Av. Colón 1234, Córdoba',
    floors: Array.from({ length: FLOORS }, (_, floorIndex) => ({
      id: `f${floorIndex + 1}`,
      name: `Piso ${floorIndex + 1}`,
      sectors: SECTORS.map((sector) => ({
        id: `f${floorIndex + 1}-${sector}`,
        name: `Sector ${sector}`,
        spaces: Array.from({ length: SPACES_PER_SECTOR }, () => {
          const id = `s${number}`
          return { id, number: number++ }
        }),
      })),
    })),
  }
}

export function buildMockSnapshot(lot: Lot): OccupancySnapshot {
  const snapshot: OccupancySnapshot = {}
  // Cada piso con un nivel de ocupación distinto para que el ejemplo sea realista.
  const occupancyByFloor = [0.85, 0.55, 0.3]
  lot.floors.forEach((floor, floorIndex) => {
    for (const sector of floor.sectors) {
      for (const space of sector.spaces) {
        snapshot[space.id] = Math.random() < (occupancyByFloor[floorIndex] ?? 0.5) ? 'occupied' : 'free'
      }
    }
  })
  snapshot.s17 = 'fault'
  snapshot.s93 = 'fault'
  return snapshot
}

/** Hora del último cambio de cada cochera: ocupadas desde hace un rato, libres desde hace menos. */
export function buildMockSince(snapshot: OccupancySnapshot): OccupancySince {
  const minutesAgo = (min: number, max: number) =>
    new Date(Date.now() - (min + Math.random() * (max - min)) * 60_000).toISOString()
  const since: OccupancySince = {}
  for (const [spaceId, status] of Object.entries(snapshot)) {
    since[spaceId] =
      status === 'occupied' ? minutesAgo(3, 330) : status === 'fault' ? minutesAgo(90, 160) : minutesAgo(1, 90)
  }
  return since
}

/** Actividad inicial: los cambios más recientes que ya ocurrieron antes de abrir el panel. */
export function buildMockEvents(snapshot: OccupancySnapshot, since: OccupancySince): OccupancyEvent[] {
  return Object.keys(snapshot)
    .filter((spaceId) => snapshot[spaceId] !== 'fault')
    .sort((a, b) => (since[b] ?? '').localeCompare(since[a] ?? ''))
    .slice(0, 8)
    .map((spaceId) => ({
      id: `seed-${spaceId}`,
      spaceId,
      status: snapshot[spaceId] ?? 'free',
      at: since[spaceId] ?? new Date().toISOString(),
    }))
}

export function buildMockReservations(lotId: string): Reservation[] {
  const at = (minutesFromNow: number) =>
    new Date(Date.now() + minutesFromNow * 60_000).toISOString()

  // [código, conductor, patente, inicio y fin en minutos desde ahora]
  const rows: Array<[string, string, string, number, number]> = [
    ['SP-8F6D', 'Julián Moreno', 'AA 903 PL', -35, 85],
    ['SP-4K7Q', 'Lucía Fernández', 'AE 512 KD', -20, 100],
    ['SP-9M2X', 'Martín Gómez', 'AC 098 JT', -5, 115],
    ['SP-2H8R', 'Sofía Herrera', 'AF 331 LP', 15, 135],
    ['SP-7T3N', 'Diego Paz', 'AB 774 QS', 40, 160],
    ['SP-5W1C', 'Carla Ruiz', 'AD 205 MV', 75, 195],
    ['SP-3B9K', 'Tomás Acosta', 'AE 118 RX', 150, 270],
    ['SP-6Y4M', 'Valentina Ríos', 'AG 467 BN', 240, 360],
  ]

  // Un día con mucho movimiento: reservas extra repartidas en las próximas horas.
  const firstNames = ['Ana', 'Bruno', 'Camila', 'Emilia', 'Federico', 'Gonzalo', 'Inés', 'Joaquín', 'Lautaro', 'Micaela', 'Nicolás', 'Paula', 'Renata', 'Santiago']
  const lastNames = ['Álvarez', 'Benítez', 'Castro', 'Domínguez', 'Ferreyra', 'Giménez', 'López', 'Molina', 'Navarro', 'Ortiz', 'Peralta', 'Romero', 'Sosa', 'Vega']
  const letters = 'ABCDEFGHJKLMNPRSTVWXYZ'
  const pick = (text: string) => text.charAt(Math.floor(Math.random() * text.length))
  for (let index = 0; index < 34; index++) {
    const start = 20 + index * 15 + Math.floor(Math.random() * 10)
    rows.push([
      `SP-${Math.floor(Math.random() * 9) + 1}${pick(letters)}${Math.floor(Math.random() * 9) + 1}${pick(letters)}`,
      `${firstNames[index % firstNames.length]} ${lastNames[(index * 5) % lastNames.length]}`,
      `A${pick('ABCDEFG')} ${String(Math.floor(Math.random() * 900) + 100)} ${pick(letters)}${pick(letters)}`,
      start,
      start + 60 + Math.floor(Math.random() * 4) * 30,
    ])
  }

  return rows.map(([code, driverName, vehiclePlate, start, end], index) => ({
    id: `r${index + 1}`,
    code,
    lotId,
    driverName,
    vehiclePlate,
    startsAt: at(start),
    endsAt: at(end),
    status: 'pending',
  }))
}

/** Cambia al azar el estado de una cochera cada tantos segundos, como harían los sensores. */
export function startMockSensorFeed(
  snapshot: OccupancySnapshot,
  onChange: (spaceId: string, status: SpaceStatus) => void,
  intervalMs = 3500,
): () => void {
  const timer = setInterval(() => {
    const candidates = Object.keys(snapshot).filter((id) => snapshot[id] !== 'fault')
    const spaceId = candidates[Math.floor(Math.random() * candidates.length)]
    if (!spaceId) return
    onChange(spaceId, snapshot[spaceId] === 'free' ? 'occupied' : 'free')
  }, intervalMs)
  return () => clearInterval(timer)
}
