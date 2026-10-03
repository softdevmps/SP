<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { formatAgo, type HardwareAlert, type PlatformLot } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import StatusPill from '@/components/StatusPill.vue'
import { LOT_STATUSES } from '@/features/admin-lots/statuses'
import { SEVERITY, alertTarget } from '@/features/admin-hardware/alertMeta'
import { useAllLotsHardware } from '@/features/admin-hardware/useAllLotsHardware'
import { useNow } from '@/composables/useNow'

const { lots, lotsById, devices, sensors, alerts } = useAllLotsHardware()
const now = useNow()

const subscribedLots = computed(() => lots.value.filter((lot) => lot.status !== 'not_subscribed'))

const stats = computed(() => {
  const installed = devices.value.filter((device) => device.lastSeenAt !== null)
  return [
    { label: 'Equipos en línea', value: `${installed.filter((d) => d.online).length} / ${installed.length}` },
    { label: 'Sensores funcionando', value: `${sensors.value.filter((s) => s.health === 'ok').length} / ${sensors.value.length}` },
    { label: 'Alertas críticas', value: String(alerts.value.filter((a) => a.severity === 'critical').length), tone: 'danger' },
    { label: 'Advertencias', value: String(alerts.value.filter((a) => a.severity === 'warning').length), tone: 'warning' },
  ]
})

// Alertas
type AlertTab = 'all' | 'critical' | 'warning' | 'info'
const alertTab = ref<AlertTab>('all')
const alertTabs = computed<TableTab<AlertTab>[]>(() => [
  { key: 'all', label: 'Todas', count: alerts.value.length },
  { key: 'critical', label: 'Críticas', count: alerts.value.filter((a) => a.severity === 'critical').length, tone: 'danger' },
  { key: 'warning', label: 'Advertencias', count: alerts.value.filter((a) => a.severity === 'warning').length, tone: 'warning' },
  { key: 'info', label: 'Avisos', count: alerts.value.filter((a) => a.severity === 'info').length },
])
const alertRows = computed(() => alerts.value.filter((a) => alertTab.value === 'all' || a.severity === alertTab.value))

const alertColumns: DataTableColumn<HardwareAlert>[] = [
  { key: 'severity', label: 'Severidad', width: '130px' },
  { key: 'lot', label: 'Playa', sortBy: (a) => lotsById.value[a.lotId]?.name ?? '' },
  { key: 'alert', label: 'Problema' },
  { key: 'since', label: 'Último dato', sortBy: (a) => a.since ?? '', width: '150px' },
  { key: 'go', label: '', align: 'right', width: '120px' },
]

// Salud por playa
function lotHealth(lot: PlatformLot) {
  const lotDevices = devices.value.filter((device) => device.lotId === lot.id)
  const lotSensors = sensors.value.filter((sensor) => sensor.lotId === lot.id)
  const lotAlerts = alerts.value.filter((alert) => alert.lotId === lot.id)
  return {
    devicesOnline: lotDevices.filter((d) => d.online).length,
    devices: lotDevices.length,
    sensorsOk: lotSensors.filter((s) => s.health === 'ok').length,
    sensors: lotSensors.length,
    critical: lotAlerts.filter((a) => a.severity === 'critical').length,
    warnings: lotAlerts.filter((a) => a.severity === 'warning').length,
    lastSeen: lotDevices.map((d) => d.lastSeenAt).filter(Boolean).sort().pop() ?? null,
  }
}

const lotColumns: DataTableColumn<PlatformLot>[] = [
  { key: 'lot', label: 'Playa', sortBy: (lot) => lot.name.toLowerCase() },
  { key: 'status', label: 'Estado', width: '140px' },
  { key: 'devices', label: 'Equipos en línea', align: 'right', width: '150px' },
  { key: 'sensors', label: 'Sensores funcionando', sortBy: (lot) => lotHealth(lot).sensorsOk / (lotHealth(lot).sensors || 1), align: 'right', width: '180px' },
  { key: 'alerts', label: 'Alertas', sortBy: (lot) => lotHealth(lot).critical * 100 + lotHealth(lot).warnings, width: '170px' },
  { key: 'seen', label: 'Último contacto', width: '150px' },
  { key: 'go', label: '', align: 'right', width: '60px' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Monitoreo" subtitle="Estado del hardware de todas las playas suscriptas" />

    <dl class="stats">
      <div v-for="stat in stats" :key="stat.label" class="stat" :class="stat.tone && `is-${stat.tone}`">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>

    <div class="block">
      <h2 class="block__title">Alertas</h2>
      <DataTable
        :columns="alertColumns"
        :rows="alertRows"
        :row-key="(a) => a.id"
        empty-text="No hay alertas. Todo el hardware responde."
      >
        <template #toolbar>
          <TableTabs v-model="alertTab" :tabs="alertTabs" label="Filtrar alertas" />
        </template>
        <template #cell-severity="{ row }">
          <StatusPill :label="SEVERITY[row.severity].label" :tone="SEVERITY[row.severity].tone" />
        </template>
        <template #cell-lot="{ row }">
          <strong>{{ lotsById[row.lotId]?.name }}</strong>
        </template>
        <template #cell-alert="{ row }">
          <span class="alert">
            <strong>{{ row.title }}</strong>
            <span>{{ row.detail }}</span>
          </span>
        </template>
        <template #cell-since="{ row }">
          <span class="muted">{{ row.since ? formatAgo(row.since, now) : '—' }}</span>
        </template>
        <template #cell-go="{ row }">
          <RouterLink :to="alertTarget(row)" class="btn btn--sm btn--subtle">Revisar</RouterLink>
        </template>
      </DataTable>
    </div>

    <div class="block">
      <h2 class="block__title">Por playa</h2>
      <DataTable :columns="lotColumns" :rows="subscribedLots" :row-key="(lot) => lot.id" :initial-sort="{ key: 'alerts', direction: 'desc' }">
        <template #cell-lot="{ row }">
          <span class="alert">
            <strong>{{ row.name }}</strong>
            <span>{{ row.neighborhood }}</span>
          </span>
        </template>
        <template #cell-status="{ row }">
          <StatusPill :label="LOT_STATUSES[row.status].label" :tone="LOT_STATUSES[row.status].tone" />
        </template>
        <template #cell-devices="{ row }">
          <span class="number">{{ lotHealth(row).devicesOnline }} / {{ lotHealth(row).devices }}</span>
        </template>
        <template #cell-sensors="{ row }">
          <span v-if="lotHealth(row).sensors" class="number">{{ lotHealth(row).sensorsOk }} / {{ lotHealth(row).sensors }}</span>
          <span v-else class="muted">Sin sensores</span>
        </template>
        <template #cell-alerts="{ row }">
          <span class="pills">
            <StatusPill v-if="lotHealth(row).critical" :label="`${lotHealth(row).critical} críticas`" tone="danger" />
            <StatusPill v-if="lotHealth(row).warnings" :label="`${lotHealth(row).warnings} adv.`" tone="warning" />
            <StatusPill v-if="!lotHealth(row).critical && !lotHealth(row).warnings" label="Sin problemas" tone="success" />
          </span>
        </template>
        <template #cell-seen="{ row }">
          <span class="muted">{{ lotHealth(row).lastSeen ? formatAgo(lotHealth(row).lastSeen!, now) : 'Nunca' }}</span>
        </template>
        <template #cell-go="{ row }">
          <RouterLink :to="{ name: 'admin-lot-devices', params: { lotId: row.id } }" class="open" :aria-label="`Abrir ${row.name}`">
            <ChevronRight :size="18" />
          </RouterLink>
        </template>
      </DataTable>
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

.stat.is-danger dd {
  color: #f08a8d;
}

.stat.is-warning dd {
  color: var(--sp-warning);
}

.block {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.block__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-text-muted);
}

.alert {
  display: grid;
}

.alert span,
.muted {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.open {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  color: var(--sp-text-muted);
}

.open:hover {
  background: var(--sp-surface-3);
  color: var(--sp-text);
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
