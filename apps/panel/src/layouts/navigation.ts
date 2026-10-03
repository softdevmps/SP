import type { Component } from 'vue'
import type { UserRole } from '@sp/core'
import {
  Activity,
  Building2,
  CalendarClock,
  ChartColumn,
  CreditCard,
  Cpu,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  UserCog,
  Users,
  Wallet,
} from 'lucide-vue-next'

export interface NavLeaf {
  name: string
  label: string
  to: string
}

export interface NavItem extends NavLeaf {
  icon: Component
  /** Subsecciones: el ítem se despliega en el sidebar y redirige a la primera. */
  children?: NavLeaf[]
}

export interface NavSection {
  title: string
  /** Roles que ven la sección y pueden entrar a sus rutas. */
  roles: UserRole[]
  items: NavItem[]
}

export const navigation: NavSection[] = [
  {
    title: 'Operación',
    roles: ['attendant', 'owner'],
    items: [
      {
        name: 'occupancy',
        label: 'Ocupación',
        to: '/ocupacion',
        icon: LayoutGrid,
        children: [
          { name: 'occupancy-map', label: 'Mapa de la playa', to: '/ocupacion/mapa' },
          { name: 'occupancy-availability', label: 'Disponibilidad', to: '/ocupacion/disponibilidad' },
          { name: 'occupancy-arrivals', label: 'Próximas llegadas', to: '/ocupacion/llegadas' },
        ],
      },
      { name: 'reservations', label: 'Reservas', to: '/reservas', icon: CalendarClock },
    ],
  },
  {
    title: 'Gestión',
    roles: ['owner'],
    items: [
      { name: 'lot-summary', label: 'Resumen', to: '/resumen', icon: LayoutDashboard },
      { name: 'reports', label: 'Reportes', to: '/reportes', icon: ChartColumn },
      { name: 'lot-settings', label: 'Configuración', to: '/configuracion', icon: Settings },
      { name: 'devices', label: 'Dispositivos', to: '/dispositivos', icon: Cpu },
      { name: 'staff', label: 'Personal', to: '/personal', icon: Users },
      { name: 'lot-settlements', label: 'Liquidaciones', to: '/liquidaciones', icon: Wallet },
    ],
  },
  {
    title: 'Plataforma',
    roles: ['platform_admin'],
    items: [
      { name: 'platform-summary', label: 'Resumen', to: '/plataforma', icon: LayoutDashboard },
      { name: 'admin-lots', label: 'Playas', to: '/plataforma/playas', icon: Building2 },
      { name: 'admin-users', label: 'Usuarios', to: '/plataforma/usuarios', icon: UserCog },
      { name: 'admin-payments', label: 'Pagos', to: '/plataforma/pagos', icon: CreditCard },
      { name: 'admin-settlements', label: 'Liquidaciones', to: '/plataforma/liquidaciones', icon: Wallet },
      { name: 'admin-monitoring', label: 'Monitoreo', to: '/plataforma/monitoreo', icon: Activity },
    ],
  },
]

/** Pantalla de inicio de cada rol al ingresar. */
export function homeRouteFor(role: UserRole): string {
  return role === 'platform_admin' ? 'platform-summary' : 'occupancy-map'
}
