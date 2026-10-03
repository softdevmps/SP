import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, type UserRole } from '@sp/core'
import PanelLayout from '@/layouts/PanelLayout.vue'
import OccupancyLayout from '@/layouts/OccupancyLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ChangePasswordPage from '@/pages/ChangePasswordPage.vue'
import PlaceholderPage from '@/pages/PlaceholderPage.vue'
import OccupancyMapPage from '@/pages/occupancy/OccupancyMapPage.vue'
import OccupancyAvailabilityPage from '@/pages/occupancy/OccupancyAvailabilityPage.vue'
import ReservationsLayout from '@/layouts/ReservationsLayout.vue'
import MessagesPage from '@/pages/MessagesPage.vue'
import PlatformLotsPage from '@/pages/platform/PlatformLotsPage.vue'
import PlatformSummaryPage from '@/pages/platform/PlatformSummaryPage.vue'
import PlatformUsersPage from '@/pages/platform/PlatformUsersPage.vue'
import PlatformPaymentsPage from '@/pages/platform/PlatformPaymentsPage.vue'
import PlatformSettlementsPage from '@/pages/platform/PlatformSettlementsPage.vue'
import PlatformMonitoringPage from '@/pages/platform/PlatformMonitoringPage.vue'
import PlatformLotLayout from '@/layouts/PlatformLotLayout.vue'
import LotInfoPage from '@/pages/platform/lot/LotInfoPage.vue'
import LotLayoutPage from '@/pages/platform/lot/LotLayoutPage.vue'
import LotDevicesPage from '@/pages/platform/lot/LotDevicesPage.vue'
import LotSensorsPage from '@/pages/platform/lot/LotSensorsPage.vue'
import LotSettingsPage from '@/pages/platform/lot/LotSettingsPage.vue'
import LotLivePage from '@/pages/platform/lot/LotLivePage.vue'
import ReservationsArrivalsPage from '@/pages/reservations/ReservationsArrivalsPage.vue'
import ReservationsParkedPage from '@/pages/reservations/ReservationsParkedPage.vue'
import ReservationsHistoryPage from '@/pages/reservations/ReservationsHistoryPage.vue'
import { homeRouteFor, navigation } from '@/layouts/navigation'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean
    roles?: UserRole[]
  }
}

// Secciones ya construidas; el resto muestra la página "en construcción".
const pages: Record<string, Component> = {
  'occupancy-map': OccupancyMapPage,
  'occupancy-availability': OccupancyAvailabilityPage,
  'reservations-arrivals': ReservationsArrivalsPage,
  'reservations-parked': ReservationsParkedPage,
  'reservations-history': ReservationsHistoryPage,
  messages: MessagesPage,
  'platform-summary': PlatformSummaryPage,
  'admin-lots': PlatformLotsPage,
  'admin-users': PlatformUsersPage,
  'admin-payments': PlatformPaymentsPage,
  'admin-settlements': PlatformSettlementsPage,
  'admin-monitoring': PlatformMonitoringPage,
}

// Contenedores de las secciones con submenú (estado compartido entre sus pantallas).
const sectionLayouts: Record<string, Component> = {
  occupancy: OccupancyLayout,
  reservations: ReservationsLayout,
}

const sectionRoutes: RouteRecordRaw[] = navigation.flatMap((section) =>
  section.items.map((item): RouteRecordRaw => {
    const meta = { title: item.label, roles: section.roles }
    const [firstChild] = item.children ?? []

    if (!item.children || !firstChild) {
      return {
        path: item.to.slice(1),
        name: item.name,
        component: pages[item.name] ?? PlaceholderPage,
        meta,
      }
    }

    return {
      path: item.to.slice(1),
      component: sectionLayouts[item.name] ?? PlaceholderPage,
      meta,
      children: [
        { path: '', name: item.name, redirect: { name: firstChild.name } },
        ...item.children.map((child) => ({
          path: child.to.slice(item.to.length + 1),
          name: child.name,
          component: pages[child.name] ?? PlaceholderPage,
          meta: { title: child.label },
        })),
      ],
    }
  }),
)

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { title: 'Ingresar', guestOnly: true },
    },
    {
      path: '/cambiar-contrasena',
      name: 'change-password',
      component: ChangePasswordPage,
      meta: { title: 'Cambiar contraseña', requiresAuth: true },
    },
    {
      path: '/',
      component: PanelLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          redirect: () => ({ name: homeRouteFor(useAuthStore().user?.role ?? 'attendant') }),
        },
        ...sectionRoutes,
        // Ficha de una playa (admin de plataforma): configuración y hardware.
        {
          path: 'plataforma/playas/:lotId',
          component: PlatformLotLayout,
          meta: { roles: ['platform_admin'] },
          children: [
            { path: '', name: 'admin-lot', redirect: { name: 'admin-lot-info' } },
            { path: 'informacion', name: 'admin-lot-info', component: LotInfoPage, meta: { title: 'Playa · Información' } },
            { path: 'plano', name: 'admin-lot-layout', component: LotLayoutPage, meta: { title: 'Playa · Plano' } },
            { path: 'tarifas', name: 'admin-lot-settings', component: LotSettingsPage, meta: { title: 'Playa · Tarifas y horarios' } },
            { path: 'equipos', name: 'admin-lot-devices', component: LotDevicesPage, meta: { title: 'Playa · Equipos' } },
            { path: 'sensores', name: 'admin-lot-sensors', component: LotSensorsPage, meta: { title: 'Playa · Sensores' } },
            { path: 'en-vivo', name: 'admin-lot-live', component: LotLivePage, meta: { title: 'Playa · Estado en vivo' } },
          ],
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: auth.user?.mustChangePassword ? 'change-password' : 'home' }
  }
  // Con contraseña temporal no se puede usar el panel hasta cambiarla.
  if (auth.user?.mustChangePassword && to.name !== 'change-password') {
    return { name: 'change-password' }
  }
  // Cada rol solo entra a sus secciones, aunque escriba la URL a mano.
  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · SP Panel` : 'SP Panel'
})
