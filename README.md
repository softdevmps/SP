# SP — Smart Parking Córdoba

Plataforma de estacionamiento inteligente: sensores por cochera, panel web para cada playa
y app para que los conductores vean disponibilidad en tiempo real y reserven con pago previo.

Monorepo con pnpm workspaces.

## Estructura

```
Sp/
├── apps/
│   ├── panel/                    # Panel web de playas (Vue 3 + Vite) — Cloudflare
│   │   └── src/
│   │       ├── app/              # main.ts, App.vue, router/, plugins/
│   │       ├── assets/           # images/, fonts/, icons/
│   │       ├── styles/
│   │       ├── layouts/          # auth, playa (playero/dueño), admin de plataforma
│   │       ├── pages/            # vistas enrutables, una por ruta
│   │       ├── components/       # UI genérica propia del panel
│   │       └── features/
│   │           ├── auth/              # login, sesión, selección de playa
│   │           ├── occupancy/         # mapa en vivo por piso/sector + contador (pantalla principal)
│   │           ├── reservations/      # agenda, validar llegada, registrar salida, excedente
│   │           ├── lot-settings/      # datos de la playa, pisos, sectores, cocheras, horarios, tarifas
│   │           ├── devices/           # sensores, mapeo sensor→cochera, alertas de hardware
│   │           ├── reports/           # ocupación, ingresos/egresos, rotación, recaudación
│   │           ├── staff/             # playeros de la playa
│   │           ├── chat/              # chat del header + pantalla Mensajes con conductores
│   │           ├── admin-lots/        # (plataforma) alta de playas, dueños, suscripciones
│   │           └── admin-settlements/ # (plataforma) pagos recibidos y liquidaciones
│   │
│   └── mobile/                   # App de conductores (Vue 3 + Capacitor) — Play Store / App Store
│       └── src/
│           ├── app/ assets/ styles/ layouts/ pages/ components/   # igual que panel
│           └── features/
│               ├── auth/              # registro, login
│               ├── map/               # mapa de Córdoba: playas suscriptas vs. no suscriptas
│               ├── lot-detail/        # ficha de la playa, disponibilidad, precios
│               ├── booking/           # franja + duración → pago Mercado Pago → confirmación
│               ├── tickets/           # ticket/código de la reserva, reserva activa, historial
│               ├── chat/              # mensajes con la playa
│               ├── vehicles/          # vehículos y patentes
│               ├── profile/
│               └── notifications/     # push
│
├── packages/
│   ├── core/                     # @sp/core — lógica compartida SIN UI
│   │   └── src/
│   │       ├── http/             # cliente HTTP, auth headers, manejo de errores
│   │       ├── realtime/         # WebSocket/SSE para ocupación en vivo
│   │       ├── modules/          # un módulo por dominio: types + service (API) + store (Pinia)
│   │       │   ├── auth/  users/  lots/  occupancy/  reservations/  tickets/
│   │       │   └── payments/  vehicles/  devices/  reports/  settlements/  chat/
│   │       └── shared/           # utils/, constants/, validations/, types/
│   ├── ui/                       # @sp/ui — design tokens y componentes base compartidos
│   └── config/                   # tsconfig y eslint base
│
├── backend/
│   └── api/                      # API en la nube (se desarrolla después del front)
│
└── edge/
    └── sensor-p08/               # software de borde para los sensores P08 (Modbus → MQTT)
```

## Reglas

1. **Las apps solo tienen UI.** Datos, estado, llamadas a la API y reglas de negocio viven
   en `@sp/core/modules/<dominio>`, así panel y mobile comparten el mismo comportamiento.
2. **`pages/` es delgado:** una página compone un layout + componentes de `features/`.
3. **`features/<dominio>`** agrupa lo visual de un dominio dentro de cada app.
4. **`packages/ui`** solo tiene lo que se ve igual en ambas apps (colores, tipografía,
   iconos, componentes base). El resto de la UI es propio de cada app.
5. **Multi-playa:** todo dato de operación pertenece a una playa; el panel siempre trabaja
   dentro de la playa seleccionada.
6. Imports entre paquetes por nombre: `import { useReservations } from '@sp/core'`.
7. Nombres de carpetas y código en inglés; textos de la interfaz en español.
8. `docs/` es documentación interna y no se versiona.
