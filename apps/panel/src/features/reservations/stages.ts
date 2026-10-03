import type { ReservationStage } from '@sp/core'

export type StageTone = 'neutral' | 'warning' | 'success' | 'danger' | 'muted'

export const STAGES: Record<ReservationStage, { label: string; tone: StageTone }> = {
  upcoming: { label: 'Pendiente', tone: 'neutral' },
  waiting: { label: 'Esperando llegada', tone: 'warning' },
  parked: { label: 'En la playa', tone: 'success' },
  overstay: { label: 'Excedida', tone: 'danger' },
  completed: { label: 'Finalizada', tone: 'muted' },
  no_show: { label: 'No se presentó', tone: 'muted' },
}
