import type { Component } from 'vue'
import type { UserRole } from '@sp/core'
import {
  Activity,
  Building2,
  CalendarClock,
  ChartColumn,
  LayoutDashboard,
  LayoutGrid,
  MessageCircle,
  UserCog,
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
  /** Contador a mostrar al lado del ítem. */
  badge?: 'chat-unread'
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
        ],
      },
      {
        name: 'reservations',
        label: 'Reservas',
        to: '/reservas',
        icon: CalendarClock,
        children: [
          { name: 'reservations-arrivals', label: 'Llegadas', to: '/reservas/llegadas' },
          { name: 'reservations-parked', label: 'En la playa', to: '/reservas/en-la-playa' },
          { name: 'reservations-history', label: 'Historial', to: '/reservas/historial' },
        ],
      },
    ],
  },
  {
    title: 'Comunicación',
    roles: ['attendant', 'owner'],
    items: [
      { name: 'messages', label: 'Mensajes', to: '/mensajes', icon: MessageCircle, badge: 'chat-unread' },
    ],
  },
  {
    title: 'Gestión',
    roles: ['owner'],
    items: [
      { name: 'owner-summary', label: 'Resumen', to: '/resumen', icon: LayoutDashboard },
      {
        name: 'owner-reports',
        label: 'Reportes',
        to: '/reportes',
        icon: ChartColumn,
        children: [
          { name: 'owner-report-occupancy', label: 'Ocupación', to: '/reportes/ocupacion' },
          { name: 'owner-report-movements', label: 'Movimiento de vehículos', to: '/reportes/movimiento' },
          { name: 'owner-report-revenue', label: 'Recaudación', to: '/reportes/recaudacion' },
        ],
      },
      {
        name: 'owner-settlements',
        label: 'Liquidaciones',
        to: '/liquidaciones',
        icon: Wallet,
        children: [
          { name: 'owner-settlements-pending', label: 'Pendiente de cobrar', to: '/liquidaciones/pendiente' },
          { name: 'owner-settlements-history', label: 'Historial', to: '/liquidaciones/historial' },
        ],
      },
      {
        name: 'owner-lot',
        label: 'Mi playa',
        to: '/mi-playa',
        icon: Building2,
        children: [
          { name: 'owner-lot-info', label: 'Datos y tarifas', to: '/mi-playa/datos' },
          { name: 'owner-lot-hardware', label: 'Equipos y sensores', to: '/mi-playa/equipos' },
          { name: 'owner-lot-staff', label: 'Personal', to: '/mi-playa/personal' },
        ],
      },
    ],
  },
  {
    title: 'Plataforma',
    roles: ['platform_admin'],
    items: [{ name: 'platform-summary', label: 'Resumen', to: '/plataforma', icon: LayoutDashboard }],
  },
  {
    title: 'Playas',
    roles: ['platform_admin'],
    items: [
      { name: 'admin-lots', label: 'Playas', to: '/plataforma/playas', icon: Building2 },
      {
        name: 'admin-monitoring',
        label: 'Monitoreo',
        to: '/plataforma/monitoreo',
        icon: Activity,
        children: [
          { name: 'admin-monitoring-alerts', label: 'Alertas', to: '/plataforma/monitoreo/alertas' },
          { name: 'admin-monitoring-lots', label: 'Salud por playa', to: '/plataforma/monitoreo/playas' },
        ],
      },
    ],
  },
  {
    title: 'Administración',
    roles: ['platform_admin'],
    items: [
      { name: 'admin-users', label: 'Usuarios', to: '/plataforma/usuarios', icon: UserCog },
      {
        name: 'admin-finance',
        label: 'Finanzas',
        to: '/plataforma/finanzas',
        icon: Wallet,
        children: [
          { name: 'admin-payments', label: 'Pagos', to: '/plataforma/finanzas/pagos' },
          { name: 'admin-settlements', label: 'Liquidaciones pendientes', to: '/plataforma/finanzas/liquidaciones' },
          { name: 'admin-settlements-history', label: 'Historial de liquidaciones', to: '/plataforma/finanzas/historial' },
          { name: 'admin-settlement-rules', label: 'Reglas de liquidación', to: '/plataforma/finanzas/reglas' },
        ],
      },
    ],
  },
]

/** Pantalla de inicio de cada rol al ingresar. */
export function homeRouteFor(role: UserRole): string {
  if (role === 'platform_admin') return 'platform-summary'
  return role === 'owner' ? 'owner-summary' : 'occupancy-map'
}
