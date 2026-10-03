/** Equipos de borde que se instalan en una playa (según la documentación de hardware). */
export type DeviceType = 'usr-eg228' | 'usr-eg628' | 'usr-n720' | 'usr-n520'

export interface DeviceTelemetry {
  uptimeSeconds: number
  signal4gDbm: number | null
  cpuTempC: number
  ramPercent: number
}

/** Una línea RS-485 del equipo (un pasillo de sensores en cadena). */
export interface DevicePort {
  number: number
  ok: boolean
  /** Mensaje de la telemetría cuando la línea tiene problemas. */
  alert?: string
}

export interface Device {
  id: string
  lotId: string
  /** Identificador del equipo (gateway_id o MAC). */
  code: string
  name: string
  type: DeviceType
  online: boolean
  lastSeenAt: string | null
  ports: DevicePort[]
  telemetry: DeviceTelemetry | null
}

/**
 * Salud del sensor P08 según su registro de estado (0003H):
 * ok · no_echo (bit 2: el ultrasonido no volvió) · offline (bit 5 o sin respuesta) ·
 * eeprom_error (bit 1).
 */
export type SensorHealth = 'ok' | 'no_echo' | 'offline' | 'eeprom_error'

export interface Sensor {
  id: string
  lotId: string
  deviceId: string
  port: number
  slaveId: number
  /** Cochera asignada; null si el sensor todavía no está mapeado. */
  spaceId: string | null
  health: SensorHealth
  /** Lectura actual (bit 0): hay un vehículo debajo. */
  occupied: boolean
  /** Altura de calibración (registro 0001H), en metros. */
  presetHeightM: number
  /** Distancia medida (registro 0002H), en metros. */
  detectedHeightM: number | null
  /** Versión de firmware (registro 000EH). */
  firmware: string
  lastReadingAt: string | null
  /** Colores del LED (registros 0008H–000BH). */
  colors: { free: string; occupied: string }
}

/** Comandos que el admin puede enviar a un sensor desde el panel. */
export type SensorCommandType = 'restart' | 'recalibrate' | 'set_colors' | 'factory_reset'

export type SensorCommandPayload =
  | { type: 'restart' }
  | { type: 'factory_reset' }
  | { type: 'recalibrate'; heightM: number }
  | { type: 'set_colors'; free: string; occupied: string }

export interface SensorCommand {
  id: string
  sensorId: string
  type: SensorCommandType
  status: 'pending' | 'done' | 'failed'
  requestedAt: string
  completedAt?: string
}
