import type { Lot } from '../lots'
import type { Device, Sensor } from './types'

// MOCK: equipos y sensores de ejemplo. Con backend, el estado llega por la telemetría MQTT y
// los comandos viajan a la playa por el topic de comandos.

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const PER_PORT = 30

/** Un equipo EG228 con hub de 4 líneas RS-485 por cada 120 cocheras, y un sensor por cochera. */
export function buildMockHardware(lot: Lot, options: { installed: boolean }) {
  const spaces = lot.floors.flatMap((floor) => floor.sectors.flatMap((sector) => sector.spaces))
  const deviceCount = Math.max(1, Math.ceil(spaces.length / (PER_PORT * 4)))

  const devices: Device[] = Array.from({ length: deviceCount }, (_, index) => ({
    id: `${lot.id}-dev${index + 1}`,
    lotId: lot.id,
    code: `98:D8:63:${(17 + index).toString(16).toUpperCase()}:${lot.id.length.toString(16).toUpperCase()}A:0${index + 1}`,
    name: deviceCount === 1 ? 'Tablero principal' : `Tablero ${index + 1}`,
    type: 'usr-eg228',
    online: options.installed,
    lastSeenAt: options.installed ? minutesAgo(1) : null,
    ports: [1, 2, 3, 4].map((number) => ({ number, ok: true })),
    telemetry: options.installed
      ? { uptimeSeconds: 86_400 * 6 + 3_600 * index, signal4gDbm: -68 - index * 4, cpuTempC: 42.5, ramPercent: 34.2 }
      : null,
  }))

  if (!options.installed) return { devices, sensors: [] as Sensor[] }

  const sensors: Sensor[] = spaces.map((space, index) => {
    const deviceIndex = Math.floor(index / (PER_PORT * 4))
    const local = index % (PER_PORT * 4)
    return {
      id: `${lot.id}-sen${index + 1}`,
      lotId: lot.id,
      deviceId: devices[deviceIndex]!.id,
      port: Math.floor(local / PER_PORT) + 1,
      slaveId: (local % PER_PORT) + 1,
      spaceId: space.id,
      health: 'ok',
      occupied: Math.random() < 0.55,
      presetHeightM: 2.4,
      detectedHeightM: null,
      firmware: 'P08-1.3',
      lastReadingAt: minutesAgo(0.1),
      colors: { free: '#00C853', occupied: '#D50000' },
    }
  })
  for (const sensor of sensors) {
    sensor.detectedHeightM = sensor.occupied ? 1.1 + Math.round(Math.random() * 4) / 10 : 2.4
  }
  return { devices, sensors }
}

/** Alguna falla suelta en el resto de las playas, para que Monitoreo tenga qué mostrar. */
export function applyGenericFaults(lotId: string, devices: Device[], sensors: Sensor[]) {
  const seed = [...lotId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  sensors.forEach((sensor, index) => {
    if ((index + seed) % 47 === 0) Object.assign(sensor, { health: 'no_echo', detectedHeightM: null })
  })
  const device = devices[0]
  if (device?.telemetry && seed % 3 === 0) device.telemetry.signal4gDbm = -99
}

/** Fallas de ejemplo en Playa Centro, iguales a las que ve el playero en su mapa. */
export function applyMockFaults(devices: Device[], sensors: Sensor[]) {
  const byId = (spaceId: string) => sensors.find((sensor) => sensor.spaceId === spaceId)
  const noEcho = byId('s17')
  if (noEcho) Object.assign(noEcho, { health: 'no_echo', detectedHeightM: null })
  const offline = byId('s93')
  if (offline) Object.assign(offline, { health: 'offline', detectedHeightM: null, lastReadingAt: minutesAgo(150) })

  // Dos sensores recién instalados en la línea 4 que todavía no tienen cochera asignada.
  const first = sensors[0]
  if (first) {
    for (const slaveId of [31, 32]) {
      sensors.push({
        ...first,
        id: `${first.lotId}-sen-new${slaveId}`,
        port: 4,
        slaveId,
        spaceId: null,
        occupied: false,
        detectedHeightM: 2.4,
      })
    }
  }

  const device = devices[0]
  const port = device?.ports.find((candidate) => candidate.number === 4)
  if (port) {
    port.ok = false
    port.alert = 'Timeout Modbus intermitente. Revisar empalme o resistencia de terminación.'
  }
}
