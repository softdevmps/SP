<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import StatusPill from '@/components/StatusPill.vue'
import { LOT_STATUSES } from '@/features/admin-lots/statuses'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'

const { lot, isSubscribed, platform, hardware } = useAdminLot()

// Carga perezosa: la lista de playas, y para la playa elegida su plano y su hardware.
watchEffect(() => {
  platform.load()
  if (!lot.value) return
  platform.ensureSettings(lot.value.id)
  const layout = platform.ensureLayout(lot.value.id)
  if (layout) hardware.loadLot(layout, { installed: lot.value.status !== 'onboarding' })
})

const tabs = computed(() => [
  { name: 'admin-lot-info', label: 'Información', always: true },
  { name: 'admin-lot-layout', label: 'Plano' },
  { name: 'admin-lot-settings', label: 'Tarifas y horarios' },
  { name: 'admin-lot-devices', label: 'Equipos' },
  { name: 'admin-lot-sensors', label: 'Sensores' },
  { name: 'admin-lot-live', label: 'Estado en vivo' },
].filter((tab) => tab.always || isSubscribed.value))
</script>

<template>
  <section v-if="lot" class="page">
    <RouterLink :to="{ name: 'admin-lots' }" class="back">
      <ArrowLeft :size="16" /> Playas
    </RouterLink>

    <header class="header">
      <div>
        <div class="header__title">
          <h1>{{ lot.name }}</h1>
          <StatusPill :label="LOT_STATUSES[lot.status].label" :tone="LOT_STATUSES[lot.status].tone" />
        </div>
        <p>{{ lot.address }}<template v-if="lot.neighborhood"> · {{ lot.neighborhood }}</template></p>
      </div>
    </header>

    <nav class="tabs" aria-label="Secciones de la playa">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name, params: { lotId: lot.id } }"
        class="tab"
        active-class="is-active"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>

    <RouterView />
  </section>

  <section v-else class="missing">
    <p>No encontramos esa playa.</p>
    <RouterLink :to="{ name: 'admin-lots' }" class="btn">Volver a Playas</RouterLink>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-self: start;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.back:hover {
  color: var(--sp-text);
}

.header__title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header h1 {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.header p {
  margin: 4px 0 0;
  color: var(--sp-text-muted);
}

.tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid var(--sp-border);
}

.tab {
  position: relative;
  padding: 10px 14px;
  color: var(--sp-text-muted);
  font-weight: 600;
  white-space: nowrap;
  transition: color var(--sp-duration) var(--sp-ease);
}

.tab:hover {
  color: var(--sp-text);
}

.tab.is-active {
  color: var(--sp-text);
}

.tab.is-active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--sp-accent-hover);
}

.missing {
  display: grid;
  justify-items: start;
  gap: 12px;
  color: var(--sp-text-muted);
}
</style>
