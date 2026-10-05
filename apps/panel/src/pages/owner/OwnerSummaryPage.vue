<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronRight } from 'lucide-vue-next'
import { formatMoney, reservationStage } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatTiles, { type StatTile } from '@/components/StatTiles.vue'
import BarChart, { type BarItem } from '@/components/BarChart.vue'
import StatusPill from '@/components/StatusPill.vue'
import LotGate from '@/components/LotGate.vue'
import { SEVERITY } from '@/features/admin-hardware/alertMeta'
import { periodStarts } from '@/features/admin-finance/labels'
import { useOwnerLot } from '@/features/owner/useOwnerLot'
import { useLotLive } from '@/composables/useLotLive'

const occupancy = useLotLive()
const { totals, available, reservations, now } = storeToRefs(occupancy)
const { activeLot, devices, alerts, lotPayments, pending, report } = useOwnerLot()

const tiles = computed<StatTile[]>(() => {
  const { today } = periodStarts()
  const todayReservations = reservations.value.filter((r) => reservationStage(r, now.value) !== 'no_show')
  const arrived = reservations.value.filter((r) => r.checkedInAt).length
  const fromApp = lotPayments.value
    .filter((p) => p.status === 'approved' && new Date(p.createdAt).getTime() >= today)
    .reduce((sum, p) => sum + p.amount, 0)
  const overstay = reservations.value.reduce((sum, r) => sum + (r.overstay?.amount ?? 0), 0)
  const occupiedPercent = totals.value.total ? Math.round((totals.value.occupied / totals.value.total) * 100) : 0
  const online = devices.value.filter((d) => d.online).length
  const critical = alerts.value.filter((a) => a.severity === 'critical').length
  return [
    { label: 'Disponibles ahora', value: String(available.value), detail: `${occupiedPercent}% ocupada`, tone: 'success' },
    { label: 'Reservas hoy', value: String(todayReservations.length), detail: `${arrived} ya llegaron` },
    { label: 'Cobrado hoy', value: formatMoney(fromApp + overstay), detail: `App ${formatMoney(fromApp)} · Excedentes ${formatMoney(overstay)}` },
    {
      label: 'Equipos en línea',
      value: `${online} / ${devices.value.length}`,
      detail: critical ? `${critical} alertas críticas` : 'Sin alertas críticas',
      tone: critical ? 'danger' : undefined,
    },
  ]
})

const hourItems = computed<BarItem[]>(() => {
  const currentHour = new Date(now.value).getHours()
  return (report.value?.byHour ?? []).map((bucket) => ({
    label: bucket.key % 3 === 0 ? String(bucket.key) : '',
    title: `${String(bucket.key).padStart(2, '0')}:00`,
    value: bucket.percent,
    highlight: bucket.key === currentHour,
  }))
})
</script>

<template>
  <section class="page">
    <PageHeader title="Resumen" :subtitle="activeLot ? `${activeLot.name} · hoy` : undefined" />

    <LotGate>
      <div class="content">
        <StatTiles :tiles="tiles" />

        <div class="row">
          <PanelCard title="Ocupación habitual por hora">
            <template #actions><span class="caption">Promedio de los últimos 30 días</span></template>
            <BarChart :items="hourItems" :max="100" :format="(value) => `${value}% ocupada`" />
            <p class="footnote">La barra roja es la hora actual. Más detalle en Reportes › Ocupación.</p>
          </PanelCard>

          <div class="side">
            <PanelCard title="Liquidación pendiente">
              <template #actions>
                <RouterLink :to="{ name: 'owner-settlements-pending' }" class="link">Ver detalle</RouterLink>
              </template>
              <p class="big">{{ formatMoney(pending?.amount ?? 0) }}</p>
              <p class="muted">{{ pending?.payments.length ?? 0 }} pagos de reservas a transferirte.</p>
            </PanelCard>

            <PanelCard title="Hardware">
              <template #actions>
                <RouterLink :to="{ name: 'owner-lot-hardware' }" class="link">Ver equipos</RouterLink>
              </template>
              <ul v-if="alerts.length" class="alerts">
                <li v-for="alert in alerts.slice(0, 3)" :key="alert.id">
                  <StatusPill :label="SEVERITY[alert.severity].label" :tone="SEVERITY[alert.severity].tone" />
                  <span>{{ alert.title }}</span>
                </li>
              </ul>
              <p v-else class="muted">Todos los equipos y sensores responden.</p>
              <RouterLink v-if="alerts.length > 3" :to="{ name: 'owner-lot-hardware' }" class="more">
                {{ alerts.length - 3 }} más <ChevronRight :size="14" />
              </RouterLink>
            </PanelCard>
          </div>
        </div>
      </div>
    </LotGate>
  </section>
</template>

<style scoped>
.page,
.content {
  display: grid;
  gap: 20px;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: stretch;
}

.side {
  display: grid;
  gap: 20px;
}

.caption {
  font-size: 12px;
  color: var(--sp-text-faint);
}

.footnote,
.muted {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.link {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.link:hover {
  color: var(--sp-text);
}

.big {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 30px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.alerts {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.alerts li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--sp-text-muted);
}

@media (max-width: 1100px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
