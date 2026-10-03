import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Lot } from '../lots'
import { applyGenericFaults, applyMockFaults, buildMockHardware } from './mock'
import type { Device, Sensor, SensorCommand, SensorCommandPayload } from './types'

export const useHardwareStore = defineStore('hardware', () => {
  const devices = ref<Device[]>([])
  const sensors = ref<Sensor[]>([])
  const commands = ref<SensorCommand[]>([])
  const loadedLots = new Set<string>()

  const devicesByLot = computed(() => groupBy(devices.value, (device) => device.lotId))
  const sensorsByLot = computed(() => groupBy(sensors.value, (sensor) => sensor.lotId))

  function groupBy<T>(items: T[], key: (item: T) => string) {
    const result: Record<string, T[]> = {}
    for (const item of items) (result[key(item)] ??= []).push(item)
    return result
  }

  /** MOCK: arma el hardware de una playa a partir de su plano. Con backend: GET /api/plataforma/playas/{id}/equipos. */
  function loadLot(lot: Lot, options: { installed: boolean }) {
    if (loadedLots.has(lot.id)) return
    loadedLots.add(lot.id)
    const generated = buildMockHardware(lot, options)
    if (lot.id === 'lot-centro') applyMockFaults(generated.devices, generated.sensors)
    else applyGenericFaults(lot.id, generated.devices, generated.sensors)
    devices.value.push(...generated.devices)
    sensors.value.push(...generated.sensors)
  }

  function addDevice(device: Omit<Device, 'id' | 'online' | 'lastSeenAt' | 'telemetry'>) {
    devices.value.push({ ...device, id: `dev-${Date.now()}`, online: false, lastSeenAt: null, telemetry: null })
  }

  /** Asigna (o desasigna) la cochera de un sensor. Una cochera tiene un solo sensor. */
  function assignSensor(sensorId: string, spaceId: string | null) {
    const sensor = sensors.value.find((candidate) => candidate.id === sensorId)
    if (!sensor) return
    if (spaceId) {
      for (const other of sensors.value) {
        if (other.lotId === sensor.lotId && other.spaceId === spaceId) other.spaceId = null
      }
    }
    sensor.spaceId = spaceId
  }

  /**
   * MOCK: el comando queda pendiente y el sensor "responde" a los segundos.
   * Con backend: POST /api/plataforma/sensores/{id}/comandos → el borde lo escribe por Modbus.
   */
  function sendCommand(sensorId: string, payload: SensorCommandPayload): SensorCommand {
    const command: SensorCommand = {
      id: `cmd-${Date.now()}`,
      sensorId,
      type: payload.type,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    }
    commands.value.unshift(command)

    setTimeout(() => {
      const stored = commands.value.find((candidate) => candidate.id === command.id)
      const sensor = sensors.value.find((candidate) => candidate.id === sensorId)
      if (!stored || !sensor) return
      const offline = sensor.health === 'offline'
      stored.status = offline ? 'failed' : 'done'
      stored.completedAt = new Date().toISOString()
      if (offline) return

      if (payload.type === 'recalibrate') sensor.presetHeightM = payload.heightM
      if (payload.type === 'set_colors') sensor.colors = { free: payload.free, occupied: payload.occupied }
      if (payload.type === 'factory_reset') {
        sensor.presetHeightM = 2.4
        sensor.colors = { free: '#00C853', occupied: '#D50000' }
      }
      if (payload.type === 'restart' || payload.type === 'factory_reset') {
        sensor.health = 'ok'
        sensor.lastReadingAt = new Date().toISOString()
      }
    }, 1800)

    return command
  }

  /**
   * MOCK: lecturas en vivo de los sensores de una playa (un cambio cada pocos segundos).
   * Con backend llegan por SignalR (`sensor.reading`). Devuelve la función para cortar.
   */
  function startLiveFeed(lotId: string, intervalMs = 3000): () => void {
    const timer = setInterval(() => {
      const candidates = sensors.value.filter((s) => s.lotId === lotId && s.health === 'ok' && s.spaceId)
      const sensor = candidates[Math.floor(Math.random() * candidates.length)]
      if (!sensor) return
      sensor.occupied = !sensor.occupied
      sensor.detectedHeightM = sensor.occupied ? 1.2 + Math.round(Math.random() * 3) / 10 : sensor.presetHeightM
      sensor.lastReadingAt = new Date().toISOString()
    }, intervalMs)
    return () => clearInterval(timer)
  }

  return {
    devices,
    sensors,
    commands,
    devicesByLot,
    sensorsByLot,
    loadLot,
    addDevice,
    assignSensor,
    sendCommand,
    startLiveFeed,
  }
})
