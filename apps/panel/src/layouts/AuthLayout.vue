<script setup lang="ts">
// Pantallas de acceso (login, cambio de contraseña): columna de marca a la izquierda y el
// formulario de cada pantalla a la derecha.
defineProps<{ title: string; subtitle: string }>()

import { CalendarClock, Cpu, LayoutGrid } from 'lucide-vue-next'

const highlights = [
  {
    icon: LayoutGrid,
    title: 'Ocupación en tiempo real',
    text: 'Cada cochera de tu playa, piso por piso, detectada por sensores.',
  },
  {
    icon: CalendarClock,
    title: 'Reservas con pago previo',
    text: 'Los conductores reservan desde la app y vos validás su llegada.',
  },
  {
    icon: Cpu,
    title: 'Monitoreo de sensores',
    text: 'Alertas cuando un sensor o una línea de la playa deja de responder.',
  },
]
</script>

<template>
  <div class="login">
    <aside class="brand-panel">
      <div class="brand-panel__column">
        <div class="brand">
          <span class="brand__badge">SP</span>
          <span class="brand__name">Smart Parking</span>
        </div>

        <div class="brand-panel__body">
          <h2 class="brand-panel__title">Gestión de playas de estacionamiento</h2>
          <p class="brand-panel__text">Todo lo que pasa en tu playa, en un solo panel.</p>

          <ul class="highlights">
            <li v-for="item in highlights" :key="item.title" class="highlight">
              <span class="highlight__icon">
                <component :is="item.icon" :size="18" :stroke-width="1.8" />
              </span>
              <span>
                <strong>{{ item.title }}</strong>
                <small>{{ item.text }}</small>
              </span>
            </li>
          </ul>
        </div>

        <p class="brand-panel__footer">© {{ new Date().getFullYear() }} SP · Córdoba</p>
      </div>
    </aside>

    <main class="form-panel">
      <div class="form-panel__inner">
        <div class="brand brand--compact">
          <span class="brand__badge">SP</span>
          <span class="brand__name">Smart Parking</span>
        </div>

        <h1 class="form-panel__title">{{ title }}</h1>
        <p class="form-panel__subtitle">{{ subtitle }}</p>

        <slot />

        <p v-if="$slots.help" class="form-panel__help"><slot name="help" /></p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--sp-bg);
}

/* Panel de marca: una columna centrada que alinea logo, contenido y pie */
.brand-panel {
  display: flex;
  justify-content: center;
  padding: 40px 48px;
  background: linear-gradient(180deg, var(--sp-surface) 0%, var(--sp-bg) 100%);
  border-right: 1px solid var(--sp-border);
}

.brand-panel__column {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand__badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-accent);
  color: #fff;
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: 14px;
}

.brand__name {
  font-family: var(--sp-font-display);
  font-weight: 600;
  font-size: 17px;
}

.brand-panel__body {
  margin-block: auto;
  padding-block: 48px;
}

.brand-panel__title {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 34px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.brand-panel__text {
  margin: 12px 0 36px;
  color: var(--sp-text-muted);
  font-size: 15px;
}

.highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 22px;
}

.highlight {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.highlight__icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  color: var(--sp-accent-hover);
}

.highlight strong {
  display: block;
  margin-bottom: 2px;
  font-weight: 600;
}

.highlight small {
  display: block;
  color: var(--sp-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.brand-panel__footer {
  margin: 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

/* Panel del formulario */
.form-panel {
  display: grid;
  place-items: center;
  padding: 40px 24px;
}

.form-panel__inner {
  width: 100%;
  max-width: 380px;
}

.brand--compact {
  display: none;
  margin-bottom: 36px;
}

.form-panel__title {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.form-panel__subtitle {
  margin: 6px 0 28px;
  color: var(--sp-text-muted);
}

.form-panel__help {
  margin: 28px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--sp-border);
  font-size: 13px;
  color: var(--sp-text-faint);
}

@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .brand--compact {
    display: flex;
  }
}
</style>
