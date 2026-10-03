import type { LotStatus } from '@sp/core'
import type { StatusTone } from '@/components/StatusPill.vue'

export const LOT_STATUSES: Record<LotStatus, { label: string; tone: StatusTone; description: string }> = {
  active: {
    label: 'Activa',
    tone: 'success',
    description: 'Suscripta y operando: sensores, reservas y panel.',
  },
  onboarding: {
    label: 'En instalación',
    tone: 'info',
    description: 'Suscripta, instalando sensores. Todavía no recibe reservas.',
  },
  suspended: {
    label: 'Suspendida',
    tone: 'danger',
    description: 'No recibe reservas y en la app se ve como no suscripta.',
  },
  not_subscribed: {
    label: 'No suscripta',
    tone: 'muted',
    description: 'Solo figura en gris en el mapa de la app, sin disponibilidad ni reservas.',
  },
}
