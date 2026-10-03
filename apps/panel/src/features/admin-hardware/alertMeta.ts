import type { AlertSeverity, HardwareAlert } from '@sp/core'
import type { RouteLocationRaw } from 'vue-router'
import type { StatusTone } from '@/components/StatusPill.vue'

export const SEVERITY: Record<AlertSeverity, { label: string; tone: StatusTone }> = {
  critical: { label: 'Crítica', tone: 'danger' },
  warning: { label: 'Advertencia', tone: 'warning' },
  info: { label: 'Aviso', tone: 'muted' },
}

/** A qué pestaña de la ficha de la playa lleva cada alerta. */
export function alertTarget(alert: HardwareAlert): RouteLocationRaw {
  const params = { lotId: alert.lotId }
  if (alert.kind === 'sensor_fault' || alert.kind === 'sensor_unassigned' || alert.kind === 'port_fault') {
    return { name: 'admin-lot-sensors', params, query: { equipo: alert.deviceId, linea: alert.port } }
  }
  return { name: 'admin-lot-devices', params }
}
