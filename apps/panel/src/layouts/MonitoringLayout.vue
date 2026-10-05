<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { useAllLotsHardware } from '@/features/admin-hardware/useAllLotsHardware'

// Encabezado e indicadores compartidos por Monitoreo › Alertas y Monitoreo › Salud por playa.
const route = useRoute()
const { devices, sensors, alerts } = useAllLotsHardware()

const stats = computed(() => {
  const installed = devices.value.filter((device) => device.lastSeenAt !== null)
  return [
    { label: 'Equipos en línea', value: `${installed.filter((d) => d.online).length} / ${installed.length}` },
    { label: 'Sensores funcionando', value: `${sensors.value.filter((s) => s.health === 'ok').length} / ${sensors.value.length}` },
    { label: 'Alertas críticas', value: String(alerts.value.filter((a) => a.severity === 'critical').length), tone: 'danger' },
    { label: 'Advertencias', value: String(alerts.value.filter((a) => a.severity === 'warning').length), tone: 'warning' },
  ]
})
</script>

<template>
  <section class="page">
    <PageHeader :title="`Monitoreo · ${route.meta.title ?? ''}`" subtitle="Hardware de todas las playas suscriptas" />

    <dl class="stats">
      <div v-for="stat in stats" :key="stat.label" class="stat" :class="stat.tone && `is-${stat.tone}`">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>

    <RouterView />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.stat {
  padding: 16px 18px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.stat dt {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.stat dd {
  margin: 6px 0 0;
  font-family: var(--sp-font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat.is-danger dd {
  color: #f08a8d;
}

.stat.is-warning dd {
  color: var(--sp-warning);
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
