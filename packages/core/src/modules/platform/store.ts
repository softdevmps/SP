import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Floor, Lot } from '../lots'
import { useAccountsStore } from '../accounts'
import { buildMockLayout, buildMockPlatformLots } from './mock'
import type { LotSettings, LotStatus, Owner, PlatformLot, PlatformLotInput } from './types'

export const usePlatformStore = defineStore('platform', () => {
  const lots = ref<PlatformLot[]>([])
  const accounts = useAccountsStore()
  /** Los dueños son las cuentas con rol "owner" (las crea el admin en Usuarios). */
  const owners = computed<Owner[]>(() =>
    accounts.owners.map(({ id, name, email, phone }) => ({ id, name, email, phone })),
  )
  /** Plano de cada playa suscripta (pisos, sectores, cocheras), por id de playa. */
  const layouts = ref<Record<string, Lot>>({})
  /** Tarifas y horarios de cada playa suscripta. */
  const settings = ref<Record<string, LotSettings>>({})

  const ownersById = computed(() => Object.fromEntries(owners.value.map((o) => [o.id, o])))

  function load() {
    if (lots.value.length) return
    lots.value = buildMockPlatformLots()
  }

  function nextMqttCode() {
    const used = lots.value.map((lot) => Number(lot.mqttCode?.split('-').pop() ?? 0))
    return `ARG-CBA-${String(Math.max(0, ...used) + 1).padStart(3, '0')}`
  }

  /** MOCK: alta local. Con backend será POST /api/plataforma/playas. */
  function createLot(input: PlatformLotInput): PlatformLot {
    const lot: PlatformLot = {
      id: `lot-${Date.now()}`,
      ...input,
      mqttCode: input.status === 'not_subscribed' ? null : nextMqttCode(),
      freeSpaces: null,
      faultySensors: null,
      reservationsToday: null,
      createdAt: new Date().toISOString(),
    }
    lots.value.unshift(lot)
    return lot
  }

  /** MOCK: edición local. Con backend será PUT /api/plataforma/playas/{id}. */
  function updateLot(id: string, input: PlatformLotInput) {
    const lot = lots.value.find((candidate) => candidate.id === id)
    if (!lot) return
    Object.assign(lot, input)
    applyStatusSideEffects(lot)
  }

  /** MOCK: cambio de estado. Con backend será POST /api/plataforma/playas/{id}/estado. */
  function setStatus(id: string, status: LotStatus) {
    const lot = lots.value.find((candidate) => candidate.id === id)
    if (!lot) return
    lot.status = status
    applyStatusSideEffects(lot)
  }

  // Una playa que pasa a suscripta recibe su código MQTT; los números en vivo solo existen si está activa.
  function applyStatusSideEffects(lot: PlatformLot) {
    if (lot.status !== 'not_subscribed' && !lot.mqttCode) lot.mqttCode = nextMqttCode()
    if (lot.status !== 'active') {
      lot.freeSpaces = null
      lot.faultySensors = null
      lot.reservationsToday = null
    } else if (lot.freeSpaces === null) {
      lot.freeSpaces = lot.totalSpaces
      lot.faultySensors = 0
      lot.reservationsToday = 0
    }
  }

  /** MOCK: con backend será GET /api/playas/{id} (el mismo plano que usa el panel de la playa). */
  function ensureLayout(lotId: string): Lot | null {
    const lot = lots.value.find((candidate) => candidate.id === lotId)
    if (!lot || lot.status === 'not_subscribed') return null
    layouts.value[lotId] ??= buildMockLayout(lot)
    return layouts.value[lotId] ?? null
  }

  /**
   * Guarda el plano y renumera las cocheras de forma correlativa (1..N) en el orden de pisos y
   * sectores. MOCK: con backend será PUT /api/plataforma/playas/{id}/plano.
   */
  function saveLayout(lotId: string, floors: Floor[]) {
    const layout = layouts.value[lotId]
    const lot = lots.value.find((candidate) => candidate.id === lotId)
    if (!layout || !lot) return
    let number = 1
    for (const floor of floors) {
      for (const sector of floor.sectors) {
        for (const space of sector.spaces) space.number = number++
      }
    }
    layout.floors = floors
    lot.totalSpaces = number - 1
  }

  /** MOCK: con backend será GET /api/admin/playas/{id}/configuracion. */
  function ensureSettings(lotId: string): LotSettings | null {
    const lot = lots.value.find((candidate) => candidate.id === lotId)
    if (!lot || lot.status === 'not_subscribed') return null
    settings.value[lotId] ??= {
      reservationTariff: { pricePerHour: 1800, minMinutes: 60, stepMinutes: 30 },
      overstayTariff: { pricePerHour: 2000, fractionMinutes: 15 },
      openingHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        open: weekday !== 0,
        allDay: false,
        from: weekday === 6 ? '08:00' : '07:00',
        to: weekday === 6 ? '14:00' : '22:00',
      })),
    }
    return settings.value[lotId] ?? null
  }

  /** MOCK: con backend será PUT /api/admin/playas/{id}/configuracion. */
  function saveSettings(lotId: string, value: LotSettings) {
    settings.value[lotId] = JSON.parse(JSON.stringify(value)) as LotSettings
    // El plano lleva la tarifa de excedente que usa el panel de la playa al registrar salidas.
    const layout = layouts.value[lotId]
    if (layout) layout.overstayTariff = { ...value.overstayTariff }
  }

  return {
    lots,
    owners,
    ownersById,
    layouts,
    settings,
    load,
    createLot,
    updateLot,
    setStatus,
    ensureLayout,
    saveLayout,
    ensureSettings,
    saveSettings,
  }
})
