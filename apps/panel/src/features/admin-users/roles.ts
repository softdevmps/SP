import type { UserRole } from '@sp/core'
import type { StatusTone } from '@/components/StatusPill.vue'

export const ROLES: Record<UserRole, { label: string; tone: StatusTone; description: string }> = {
  platform_admin: {
    label: 'Admin de plataforma',
    tone: 'info',
    description: 'Configura playas y hardware, usuarios, pagos y liquidaciones.',
  },
  owner: {
    label: 'Dueño',
    tone: 'neutral',
    description: 'Ve y gestiona las playas que tiene asignadas en Playas.',
  },
  attendant: {
    label: 'Playero',
    tone: 'muted',
    description: 'Opera las playas que se le asignan acá: ocupación, reservas y mensajes.',
  },
}
