import type { DeviceType, SensorCommandType, SensorHealth } from '@sp/core'
import type { StatusTone } from '@/components/StatusPill.vue'

export const DEVICE_TYPES: Record<DeviceType, string> = {
  'usr-eg228': 'USR-EG228 · PC de borde',
  'usr-eg628': 'USR-EG628 · servidor central',
  'usr-n720': 'USR-N720 · gateway',
  'usr-n520': 'USR-N520 · gateway para playas chicas',
}

export const SENSOR_HEALTH: Record<SensorHealth, { label: string; tone: StatusTone }> = {
  ok: { label: 'Funcionando', tone: 'success' },
  no_echo: { label: 'Sin eco', tone: 'warning' },
  offline: { label: 'Sin conexión', tone: 'danger' },
  eeprom_error: { label: 'Error de memoria', tone: 'danger' },
}

export const COMMAND_LABELS: Record<SensorCommandType, string> = {
  restart: 'Reiniciar',
  recalibrate: 'Recalibrar altura',
  set_colors: 'Cambiar colores del LED',
  factory_reset: 'Restaurar de fábrica',
}

/** Calidad de la señal 4G según los dBm que informa la telemetría. */
export function signalQuality(dbm: number): { label: string; tone: StatusTone } {
  if (dbm >= -75) return { label: 'Buena', tone: 'success' }
  if (dbm >= -95) return { label: 'Regular', tone: 'warning' }
  return { label: 'Mala', tone: 'danger' }
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  return days ? `${days} d ${hours} h` : `${hours} h`
}
