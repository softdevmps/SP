<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatAgo, type HardwareAlert } from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import StatusPill from '@/components/StatusPill.vue'
import { SEVERITY, alertTarget } from '@/features/admin-hardware/alertMeta'
import { useAllLotsHardware } from '@/features/admin-hardware/useAllLotsHardware'
import { useNow } from '@/composables/useNow'

const { lotsById, alerts } = useAllLotsHardware()
const now = useNow()

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
</script>

<template>
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
</template>

<style scoped>
.alert {
  display: grid;
}

.alert span,
.muted {
  font-size: 12px;
  color: var(--sp-text-muted);
}
</style>
