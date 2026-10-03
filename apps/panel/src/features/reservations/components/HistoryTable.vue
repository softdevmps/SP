<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  formatMoney,
  formatTime,
  reservationStage,
  useOccupancyStore,
  type Reservation,
} from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StagePill from './StagePill.vue'
import { matchesSearch } from '../matchesSearch'

const { reservations, now } = storeToRefs(useOccupancyStore())

type TabKey = 'all' | 'completed' | 'no_show'

const activeTab = ref<TabKey>('all')
const search = ref('')

const closed = computed(() =>
  reservations.value
    .map((reservation) => ({ reservation, stage: reservationStage(reservation, now.value) }))
    .filter((item) => item.stage === 'completed' || item.stage === 'no_show'),
)

const byTab = computed<Record<TabKey, Reservation[]>>(() => ({
  all: closed.value.map((item) => item.reservation),
  completed: closed.value.filter((item) => item.stage === 'completed').map((item) => item.reservation),
  no_show: closed.value.filter((item) => item.stage === 'no_show').map((item) => item.reservation),
}))

const tabs = computed<TableTab<TabKey>[]>(() => [
  { key: 'all', label: 'Todas', count: byTab.value.all.length },
  { key: 'completed', label: 'Finalizadas', count: byTab.value.completed.length },
  { key: 'no_show', label: 'No se presentaron', count: byTab.value.no_show.length },
])

const rows = computed(() => byTab.value[activeTab.value].filter((r) => matchesSearch(r, search.value)))

const collected = computed(() =>
  byTab.value.completed.reduce((sum, r) => sum + (r.overstay?.amount ?? 0), 0),
)

const columns: DataTableColumn<Reservation>[] = [
  { key: 'slot', label: 'Franja', sortBy: (r) => r.startsAt, width: '150px' },
  { key: 'driver', label: 'Conductor', sortBy: (r) => r.driverName.toLowerCase() },
  { key: 'plate', label: 'Patente', sortBy: (r) => r.vehiclePlate, width: '120px' },
  { key: 'code', label: 'Código', sortBy: (r) => r.code, width: '110px' },
  { key: 'stage', label: 'Estado', width: '150px' },
  { key: 'in', label: 'Entrada', sortBy: (r) => r.checkedInAt ?? '', width: '90px' },
  { key: 'out', label: 'Salida', sortBy: (r) => r.checkedOutAt ?? '', width: '90px' },
  { key: 'charge', label: 'Excedente cobrado', sortBy: (r) => r.overstay?.amount ?? 0, align: 'right', width: '150px' },
]
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :row-key="(r) => r.id"
    :initial-sort="{ key: 'slot', direction: 'desc' }"
    :empty-text="search ? 'Ninguna reserva coincide con la búsqueda.' : 'Todavía no hay reservas cerradas hoy.'"
  >
    <template #toolbar>
      <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar historial" />
      <div class="toolbar-end">
        <span class="collected">Excedentes cobrados hoy: <strong>{{ formatMoney(collected) }}</strong></span>
        <TableSearch v-model="search" />
      </div>
    </template>

    <template #cell-slot="{ row }">
      <span class="slot">
        <strong>{{ formatTime(row.startsAt) }}</strong>
        <span>– {{ formatTime(row.endsAt) }}</span>
      </span>
    </template>
    <template #cell-driver="{ row }"><span class="driver">{{ row.driverName }}</span></template>
    <template #cell-plate="{ row }"><span class="plate">{{ row.vehiclePlate }}</span></template>
    <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
    <template #cell-stage="{ row }">
      <StagePill :stage="reservationStage(row, now)" />
    </template>
    <template #cell-in="{ row }">
      <span class="muted">{{ row.checkedInAt ? formatTime(row.checkedInAt) : '—' }}</span>
    </template>
    <template #cell-out="{ row }">
      <span class="muted">{{ row.checkedOutAt ? formatTime(row.checkedOutAt) : '—' }}</span>
    </template>
    <template #cell-charge="{ row }">
      <span v-if="row.overstay?.amount" class="money">{{ formatMoney(row.overstay.amount) }}</span>
      <span v-else class="muted">—</span>
    </template>
  </DataTable>
</template>

<style scoped src="./reservation-cells.css"></style>
<style scoped>
.toolbar-end {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.collected {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.collected strong {
  color: var(--sp-text);
  font-variant-numeric: tabular-nums;
}
</style>
