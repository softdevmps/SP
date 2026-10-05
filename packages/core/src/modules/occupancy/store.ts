import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Lot } from '../lots'
import { calculateOverstay, type Reservation } from '../reservations'
import { usePlatformStore } from '../platform/store'
import {
  buildMockEvents,
  buildMockReservations,
  buildMockSince,
  buildMockSnapshot,
  startMockSensorFeed,
} from './mock'
import type {
  FloorOccupancy,
  OccupancyEvent,
  OccupancySince,
  OccupancySnapshot,
  SectorOccupancy,
  SpaceLocation,
} from './types'

const MAX_EVENTS = 50

/** Datos en vivo de una playa (se guardan por playa para poder cambiar de una a otra). */
interface LotData {
  lot: Lot
  snapshot: OccupancySnapshot
  since: OccupancySince
  events: OccupancyEvent[]
  reservations: Reservation[]
  lastUpdate: Date | null
}

export const useOccupancyStore = defineStore('occupancy', () => {
  /** Playa que se está mirando ahora; el resto queda guardada en `cache`. */
  const activeLotId = ref<string | null>(null)
  const cache = ref<Record<string, LotData>>({})

  const lot = ref<Lot | null>(null)
  const snapshot = ref<OccupancySnapshot>({})
  const since = ref<OccupancySince>({})
  /** Últimos cambios de estado, del más reciente al más viejo. */
  const events = ref<OccupancyEvent[]>([])
  const reservations = ref<Reservation[]>([])
  const lastUpdate = ref<Date | null>(null)
  /** Última cochera que cambió, para resaltarla en el mapa. */
  const lastChangedSpaceId = ref<string | null>(null)

  /** Reloj reactivo: las reservas entran en franja con el paso del tiempo. */
  const now = ref(Date.now())

  let stopFeed: (() => void) | null = null
  let clockTimer: ReturnType<typeof setInterval> | null = null

  const floors = computed<FloorOccupancy[]>(() =>
    (lot.value?.floors ?? []).map((floor) => {
      const statuses = floor.sectors.flatMap((sector) =>
        sector.spaces.map((space) => snapshot.value[space.id]),
      )
      return {
        floorId: floor.id,
        name: floor.name,
        total: statuses.length,
        free: statuses.filter((status) => status === 'free').length,
        occupied: statuses.filter((status) => status === 'occupied').length,
        faults: statuses.filter((status) => status === 'fault').length,
      }
    }),
  )

  const locations = computed<Record<string, SpaceLocation>>(() => {
    const index: Record<string, SpaceLocation> = {}
    for (const floor of lot.value?.floors ?? []) {
      for (const sector of floor.sectors) {
        for (const space of sector.spaces) {
          index[space.id] = {
            spaceId: space.id,
            number: space.number,
            floorId: floor.id,
            floorName: floor.name,
            sectorName: sector.name,
          }
        }
      }
    }
    return index
  })

  const sectors = computed<SectorOccupancy[]>(() =>
    (lot.value?.floors ?? []).flatMap((floor) =>
      floor.sectors.map((sector) => ({
        floorId: floor.id,
        floorName: floor.name,
        sectorId: sector.id,
        sectorName: sector.name,
        total: sector.spaces.length,
        free: sector.spaces.filter((space) => snapshot.value[space.id] === 'free').length,
      })),
    ),
  )

  const totals = computed(() =>
    floors.value.reduce(
      (acc, floor) => ({
        total: acc.total + floor.total,
        free: acc.free + floor.free,
        occupied: acc.occupied + floor.occupied,
        faults: acc.faults + floor.faults,
      }),
      { total: 0, free: 0, occupied: 0, faults: 0 },
    ),
  )

  /**
   * Reservas cuya franja ya empezó y cuyo conductor todavía no llegó: esos lugares
   * siguen libres en los sensores pero ya están vendidos.
   */
  const awaitingArrival = computed(() => {
    return reservations.value.filter(
      (reservation) =>
        reservation.status === 'pending' &&
        new Date(reservation.startsAt).getTime() <= now.value &&
        new Date(reservation.endsAt).getTime() > now.value,
    )
  })

  /** Lugares que el playero puede ofrecer a autos sin reserva. */
  const available = computed(() => Math.max(0, totals.value.free - awaitingArrival.value.length))

  /** Semáforo del contador: hay lugar, quedan pocos o playa completa. */
  const availabilityLevel = computed<'ok' | 'low' | 'full'>(() => {
    if (available.value === 0) return 'full'
    if (available.value <= Math.max(3, totals.value.total * 0.1)) return 'low'
    return 'ok'
  })

  /** Reservas que todavía pueden llegar (excluye las que ya terminaron sin presentarse). */
  const upcomingReservations = computed(() =>
    reservations.value
      .filter(
        (reservation) =>
          reservation.status === 'pending' && new Date(reservation.endsAt).getTime() > now.value,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  )

  const checkedInToday = computed(() =>
    reservations.value
      .filter((reservation) => reservation.status === 'checked_in')
      .sort((a, b) => (b.checkedInAt ?? '').localeCompare(a.checkedInAt ?? '')),
  )

  function findByCode(code: string): Reservation | undefined {
    const normalized = code.trim().toUpperCase()
    return reservations.value.find((reservation) => reservation.code === normalized)
  }

  /** MOCK: registra la salida y el excedente cobrado. Con backend será POST /reservations/:id/check-out. */
  function checkOut(reservationId: string) {
    const reservation = reservations.value.find((candidate) => candidate.id === reservationId)
    if (!reservation || reservation.status !== 'checked_in' || !lot.value) return
    const exitAt = new Date()
    reservation.status = 'completed'
    reservation.checkedOutAt = exitAt.toISOString()
    reservation.overstay = calculateOverstay(reservation, exitAt, lot.value.overstayTariff)
  }

  /** MOCK: marca la llegada localmente. Con backend será POST /reservations/:id/check-in. */
  function checkIn(reservationId: string) {
    const reservation = reservations.value.find((candidate) => candidate.id === reservationId)
    if (!reservation || reservation.status !== 'pending') return
    reservation.status = 'checked_in'
    reservation.checkedInAt = new Date().toISOString()
  }

  /**
   * MOCK: arma los datos de prueba de una playa a partir de su plano (el mismo que edita el admin).
   * Con backend: GET /api/playero/playas/{id}, /ocupacion y /reservas.
   */
  function buildLotData(lotId: string): LotData | null {
    const layout = usePlatformStore().ensureLayout(lotId)
    if (!layout) return null
    const snapshot = buildMockSnapshot(layout)
    const since = buildMockSince(snapshot)
    return {
      lot: layout,
      snapshot,
      since,
      events: buildMockEvents(snapshot, since),
      reservations: buildMockReservations(lotId),
      lastUpdate: new Date(),
    }
  }

  function ensureLotData(lotId: string): LotData | null {
    if (!cache.value[lotId]) {
      const data = buildLotData(lotId)
      if (data) cache.value[lotId] = data
    }
    return cache.value[lotId] ?? null
  }

  /** Guarda el estado de la playa activa y carga el de otra. */
  function activate(lotId: string) {
    if (activeLotId.value === lotId && lot.value) return
    if (activeLotId.value && lot.value) {
      cache.value[activeLotId.value] = {
        lot: lot.value,
        snapshot: snapshot.value,
        since: since.value,
        events: events.value,
        reservations: reservations.value,
        lastUpdate: lastUpdate.value,
      }
    }
    const data = ensureLotData(lotId)
    activeLotId.value = lotId
    lot.value = data?.lot ?? null
    snapshot.value = data?.snapshot ?? {}
    since.value = data?.since ?? {}
    events.value = data?.events ?? []
    reservations.value = data?.reservations ?? []
    lastUpdate.value = data?.lastUpdate ?? null
    lastChangedSpaceId.value = null
  }

  /**
   * Carga la playa (si hace falta) y arranca las actualizaciones en vivo. Las pantallas de la
   * playa comparten este estado: salir de una solo pausa el feed; cambiar de playa lo reinicia.
   */
  function connect(lotId: string) {
    if (stopFeed && activeLotId.value === lotId) return
    disconnect()
    activate(lotId)
    if (!lot.value) return
    now.value = Date.now()
    clockTimer = setInterval(() => (now.value = Date.now()), 15_000)

    stopFeed = startMockSensorFeed(snapshot.value, (spaceId, status) => {
      const at = new Date()
      snapshot.value[spaceId] = status
      since.value[spaceId] = at.toISOString()
      events.value = [
        { id: `${spaceId}-${at.getTime()}`, spaceId, status, at: at.toISOString() },
        ...events.value,
      ].slice(0, MAX_EVENTS)
      lastChangedSpaceId.value = spaceId
      lastUpdate.value = at
    })
  }

  /** Reservas del día de cualquier playa (el admin las consulta en la ficha, solo lectura). */
  function reservationsFor(lotId: string): Reservation[] {
    // Una playa en instalación todavía no recibe reservas.
    const status = usePlatformStore().lots.find((candidate) => candidate.id === lotId)?.status
    if (status !== 'active' && status !== 'suspended') return []
    if (lotId === activeLotId.value) return reservations.value
    return ensureLotData(lotId)?.reservations ?? []
  }

  function disconnect() {
    stopFeed?.()
    stopFeed = null
    if (clockTimer) clearInterval(clockTimer)
    clockTimer = null
  }

  return {
    now,
    lot,
    snapshot,
    since,
    events,
    locations,
    floors,
    sectors,
    totals,
    awaitingArrival,
    available,
    availabilityLevel,
    upcomingReservations,
    checkedInToday,
    findByCode,
    checkIn,
    checkOut,
    reservations,
    lastUpdate,
    lastChangedSpaceId,
    activeLotId,
    connect,
    disconnect,
    reservationsFor,
  }
})
