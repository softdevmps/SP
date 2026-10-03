# Arquitectura

Monorepo con pnpm workspaces. Dos frontends Vue 3 (desktop y mobile) que comparten
toda la lógica que no es visual a través de `packages/`.

```
Sp/
├── apps/
│   ├── desktop/                # Frontend PC (Vue 3 + Vite + TS)
│   │   ├── public/
│   │   └── src/
│   │       ├── app/            # main.ts, App.vue, router/, plugins/ (pinia, i18n...)
│   │       ├── assets/         # images/, fonts/, icons/
│   │       ├── styles/         # estilos globales, variables, reset
│   │       ├── layouts/        # layouts de página (sidebar, header, auth...)
│   │       ├── pages/          # vistas enrutables (una por ruta)
│   │       ├── components/     # componentes UI genéricos propios de esta app
│   │       └── features/       # módulos por dominio: features/<modulo>/{components,composables}
│   └── mobile/                 # Frontend celular — misma estructura que desktop
├── packages/
│   ├── core/                   # @sp/core — lógica compartida SIN UI
│   │   └── src/
│   │       ├── api/            # cliente HTTP (axios/fetch), interceptores, endpoints
│   │       ├── services/       # llamadas a la API por dominio
│   │       ├── stores/         # stores Pinia compartidos
│   │       ├── composables/    # composables reutilizables (useAuth, usePagination...)
│   │       ├── types/          # tipos/interfaces (modelos del backend)
│   │       ├── utils/          # helpers puros (formato de fechas, moneda...)
│   │       ├── constants/
│   │       └── validations/    # esquemas de validación de formularios
│   ├── ui/                     # @sp/ui — design tokens y componentes base compartidos
│   │   └── src/{tokens,components}
│   └── config/                 # tsconfig y eslint base para todos los paquetes
├── backend/                    # API (se define después del roadmap del front)
└── docs/                       # documentación, roadmap, contexto del proyecto
```

## Reglas

1. **Las apps solo tienen UI.** Todo lo que sea datos, estado, llamadas a la API o
   reglas de negocio vive en `@sp/core`. Así desktop y mobile se comportan igual.
2. **`pages/` es delgado:** una página compone layouts + componentes de `features/`.
3. **`features/<modulo>`** agrupa lo visual de un dominio (ej. `features/auth`,
   `features/products`). La misma feature existe en ambas apps con UI distinta.
4. **`packages/ui`** solo contiene lo que realmente se ve igual en ambas apps
   (colores, tipografía, iconos, botones base). El resto de la UI es propia de cada app.
5. Imports entre paquetes por nombre: `import { useAuth } from '@sp/core'`.
