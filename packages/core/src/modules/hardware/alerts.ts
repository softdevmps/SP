import type { Device, Sensor } from './types'

export type AlertSeverity = 'critical' | 'warning' | 'info'

/** Problema de hardware que el admin tiene que revisar. */
export interface HardwareAlert {
  id: string
  lotId: string
  severity: AlertSeverity
  /** Qué falla: el equipo, una línea, un sensor o la señal. */
  kind: 'device_offline' | 'port_fault' | 'sensor_fault' | 'sensor_unassigned' | 'weak_signal'
  title: string
  detail: string
  deviceId?: string
  sensorId?: string
  port?: number
  since: string | null
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }

/** Arma las alertas a partir del estado del hardware. Con backend vienen de la telemetría. */
export function buildHardwareAlerts(devices: Device[], sensors: Sensor[]): HardwareAlert[] {
  const alerts: HardwareAlert[] = []

  for (const device of devices) {
    if (!device.online) {
      alerts.push({
        id: `${device.id}-offline`,
        lotId: device.lotId,
        severity: device.lastSeenAt ? 'critical' : 'info',
        kind: 'device_offline',
        title: device.lastSeenAt ? 'Equipo sin conexión' : 'Equipo pendiente de conexión',
        detail: device.name,
        deviceId: device.id,
        since: device.lastSeenAt,
      })
      continue
    }
    for (const port of device.ports) {
      if (port.ok) continue
      alerts.push({
        id: `${device.id}-port${port.number}`,
        lotId: device.lotId,
        severity: 'warning',
        kind: 'port_fault',
        title: `Línea ${port.number} con problemas`,
        detail: port.alert ?? device.name,
        deviceId: device.id,
        port: port.number,
        since: device.lastSeenAt,
      })
    }
    const dbm = device.telemetry?.signal4gDbm
    if (dbm !== null && dbm !== undefined && dbm < -95) {
      alerts.push({
        id: `${device.id}-signal`,
        lotId: device.lotId,
        severity: 'warning',
        kind: 'weak_signal',
        title: 'Señal 4G débil',
        detail: `${device.name} · ${dbm} dBm`,
        deviceId: device.id,
        since: device.lastSeenAt,
      })
    }
  }

  const HEALTH_TEXT = { no_echo: 'Sin eco', offline: 'Sin conexión', eeprom_error: 'Error de memoria' } as const
  for (const sensor of sensors) {
    if (sensor.health !== 'ok') {
      alerts.push({
        id: `${sensor.id}-health`,
        lotId: sensor.lotId,
        severity: sensor.health === 'no_echo' ? 'warning' : 'critical',
        kind: 'sensor_fault',
        title: `Sensor: ${HEALTH_TEXT[sensor.health]}`,
        detail: `Línea ${sensor.port} · Slave ${sensor.slaveId}`,
        deviceId: sensor.deviceId,
        sensorId: sensor.id,
        port: sensor.port,
        since: sensor.lastReadingAt,
      })
    } else if (!sensor.spaceId) {
      alerts.push({
        id: `${sensor.id}-unassigned`,
        lotId: sensor.lotId,
        severity: 'info',
        kind: 'sensor_unassigned',
        title: 'Sensor sin cochera asignada',
        detail: `Línea ${sensor.port} · Slave ${sensor.slaveId}`,
        deviceId: sensor.deviceId,
        sensorId: sensor.id,
        port: sensor.port,
        since: null,
      })
    }
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
