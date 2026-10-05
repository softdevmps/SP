<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronRight } from 'lucide-vue-next'
import { formatMoney, usePaymentsStore } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatusPill from '@/components/StatusPill.vue'
import CollectedByDayChart from '@/features/admin-finance/CollectedByDayChart.vue'
import { periodStarts } from '@/features/admin-finance/labels'
import { SEVERITY, alertTarget } from '@/features/admin-hardware/alertMeta'
import { useAllLotsHardware } from '@/features/admin-hardware/useAllLotsHardware'

const { lots, lotsById, devices, alerts } = useAllLotsHardware()
const { payments, pendingByLot } = storeToRefs(usePaymentsStore())

const count = (status: string) => lots.value.filter((lot) => lot.status === status).length

// Cuatro números clave; el detalle está en cada sección del menú.
const operation = computed(() => {
  const active = lots.value.filter((lot) => lot.status === 'active')
  const spaces = active.reduce((sum, lot) => sum + lot.totalSpaces, 0)
  const occupied = active.reduce((sum, lot) => sum + (lot.totalSpaces - (lot.freeSpaces ?? lot.totalSpaces)), 0)
  const { today } = periodStarts()
  const collectedToday = payments.value
    .filter((p) => p.status === 'approved' && new Date(p.createdAt).getTime() >= today)
    .reduce((sum, p) => sum + p.amount, 0)
  const others = [
    count('onboarding') && `${count('onboarding')} en instalación`,
    count('suspended') && `${count('suspended')} suspendida${count('suspended') > 1 ? 's' : ''}`,
  ].filter(Boolean)
  return [
    { label: 'Playas activas', value: String(active.length), detail: others.join(' · ') || 'Todas operando', tone: 'success' },
    { label: 'Ocupación ahora', value: spaces ? `${Math.round((occupied / spaces) * 100)}%` : '—', detail: `${spaces.toLocaleString('es-AR')} cocheras con sensores` },
    { label: 'Reservas hoy', value: active.reduce((sum, lot) => sum + (lot.reservationsToday ?? 0), 0).toLocaleString('es-AR'), detail: 'En playas activas' },
    { label: 'Cobrado hoy', value: formatMoney(collectedToday), detail: 'Pagos aprobados' },
  ]
})

const hardware = computed(() => {
  const installed = devices.value.filter((device) => device.lastSeenAt !== null)
  return {
    online: installed.filter((device) => device.online).length,
    installed: installed.length,
    critical: alerts.value.filter((alert) => alert.severity === 'critical').length,
    warnings: alerts.value.filter((alert) => alert.severity === 'warning').length,
    top: alerts.value.filter((alert) => alert.severity !== 'info').slice(0, 5),
  }
})

const pendingTotal = computed(() => pendingByLot.value.reduce((sum, item) => sum + item.amount, 0))
const onboarding = computed(() => lots.value.filter((lot) => lot.status === 'onboarding'))
</script>

<template>
  <section class="page">
    <PageHeader title="Resumen" subtitle="Toda la plataforma de un vistazo" />

    <dl class="stats">
      <div v-for="stat in operation" :key="stat.label" class="stat" :class="stat.tone && `is-${stat.tone}`">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
        <span>{{ stat.detail }}</span>
      </div>
    </dl>

    <div class="row row--chart">
      <CollectedByDayChart :payments="payments" />

      <PanelCard title="Hardware">
        <template #actions>
          <RouterLink :to="{ name: 'admin-monitoring' }" class="link">Ver monitoreo</RouterLink>
        </template>
        <dl class="mini">
          <div><dt>Equipos en línea</dt><dd>{{ hardware.online }} / {{ hardware.installed }}</dd></div>
          <div><dt>Alertas críticas</dt><dd :class="{ 'is-danger': hardware.critical }">{{ hardware.critical }}</dd></div>
          <div><dt>Advertencias</dt><dd :class="{ 'is-warning': hardware.warnings }">{{ hardware.warnings }}</dd></div>
        </dl>
        <ul v-if="hardware.top.length" class="alerts">
          <li v-for="alert in hardware.top" :key="alert.id">
            <RouterLink :to="alertTarget(alert)" class="alert">
              <StatusPill :label="SEVERITY[alert.severity].label" :tone="SEVERITY[alert.severity].tone" />
              <span class="alert__text">
                <strong>{{ alert.title }}</strong>
                <span>{{ lotsById[alert.lotId]?.name }} · {{ alert.detail }}</span>
              </span>
              <ChevronRight :size="16" class="alert__chevron" />
            </RouterLink>
          </li>
        </ul>
        <p v-else class="muted">Todo el hardware responde.</p>
      </PanelCard>
    </div>

    <div class="row">
      <PanelCard title="Liquidaciones">
        <template #actions>
          <RouterLink :to="{ name: 'admin-settlements' }" class="link">Ver liquidaciones</RouterLink>
        </template>
        <p class="big">{{ formatMoney(pendingTotal) }}</p>
        <p class="muted">Pendiente de transferir a {{ pendingByLot.length }} playas.</p>
      </PanelCard>

      <PanelCard title="Playas en instalación">
        <ul v-if="onboarding.length" class="list">
          <li v-for="lot in onboarding" :key="lot.id">
            <RouterLink :to="{ name: 'admin-lot', params: { lotId: lot.id } }" class="list__item">
              <span>
                <strong>{{ lot.name }}</strong>
                <span>{{ lot.neighborhood }} · {{ lot.totalSpaces }} cocheras</span>
              </span>
              <ChevronRight :size="16" />
            </RouterLink>
          </li>
        </ul>
        <p v-else class="muted">No hay playas en instalación.</p>
      </PanelCard>
    </div>
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

.stat > span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.stat.is-success dd {
  color: var(--sp-free);
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.row--chart {
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
}

.link {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.link:hover {
  color: var(--sp-text);
}

.mini {
  display: grid;
  gap: 8px;
  margin: 0 0 14px;
}

.mini div {
  display: flex;
  justify-content: space-between;
}

.mini dt {
  color: var(--sp-text-muted);
}

.mini dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.mini .is-danger {
  color: #f08a8d;
}

.mini .is-warning {
  color: var(--sp-warning);
}

.alerts,
.list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.alert,
.list__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-top: 1px solid var(--sp-border);
  color: var(--sp-text);
}

.alert:hover,
.list__item:hover {
  background: var(--sp-surface-2);
}

.alert__text,
.list__item > span {
  flex: 1;
  display: grid;
  min-width: 0;
  font-size: 13px;
}

.alert__text span,
.list__item > span span {
  overflow: hidden;
  font-size: 12px;
  color: var(--sp-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert__chevron {
  color: var(--sp-text-faint);
}

.big {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 32px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.muted {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .row,
  .row--chart {
    grid-template-columns: 1fr;
  }
}
</style>
