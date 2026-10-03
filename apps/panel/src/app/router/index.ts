import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, type UserRole } from '@sp/core'
import PanelLayout from '@/layouts/PanelLayout.vue'
import OccupancyLayout from '@/layouts/OccupancyLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import PlaceholderPage from '@/pages/PlaceholderPage.vue'
import OccupancyMapPage from '@/pages/occupancy/OccupancyMapPage.vue'
import OccupancyAvailabilityPage from '@/pages/occupancy/OccupancyAvailabilityPage.vue'
import ReservationsLayout from '@/layouts/ReservationsLayout.vue'
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
    return { name: 'home' }
  }
  // Cada rol solo entra a sus secciones, aunque escriba la URL a mano.
  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · SP Panel` : 'SP Panel'
})
