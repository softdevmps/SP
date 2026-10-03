<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  formatDuration,
  formatTime,
  minutesUntil,
  useOccupancyStore,
  type Reservation,
} from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StagePill from './StagePill.vue'
import { matchesSearch } from '../matchesSearch'
import { useReservationActions } from '../useReservationActions'

const { openArrival } = useReservationActions()
const { upcomingReservations, now } = storeToRefs(useOccupancyStore())

type TabKey = 'pending' | 'waiting' | 'next' | 'later'

const activeTab = ref<TabKey>('pending')
const search = ref('')

function startsIn(reservation: Reservation) {
  return minutesUntil(reservation.startsAt, now.value)
}

const byTab = computed<Record<TabKey, Reservation[]>>(() => {
  const pending = upcomingReservations.value
  return {
    pending,
    waiting: pending.filter((r) => startsIn(r) <= 0),
    next: pending.filter((r) => startsIn(r) > 0 && startsIn(r) <= 60),
    later: pending.filter((r) => startsIn(r) > 60),
  }
})

const tabs = computed<TableTab<TabKey>[]>(() => [
  { key: 'pending', label: 'Todas', count: byTab.value.pending.length },
  { key: 'waiting', label: 'Esperando llegada', count: byTab.value.waiting.length, tone: 'warning' },
  { key: 'next', label: 'Próxima hora', count: byTab.value.next.length },
  { key: 'later', label: 'Más tarde', count: byTab.value.later.length },
])

const rows = computed(() => byTab.value[activeTab.value].filter((r) => matchesSearch(r, search.value)))

const columns: DataTableColumn<Reservation>[] = [
  { key: 'slot', label: 'Franja', sortBy: (r) => r.startsAt, width: '150px' },
  { key: 'driver', label: 'Conductor', sortBy: (r) => r.driverName.toLowerCase() },
  { key: 'plate', label: 'Patente', sortBy: (r) => r.vehiclePlate, width: '120px' },
  { key: 'code', label: 'Código', sortBy: (r) => r.code, width: '120px' },
  { key: 'stage', label: 'Estado', width: '220px' },
  { key: 'actions', label: '', align: 'right', width: '150px' },
]

function detail(reservation: Reservation) {
  const minutes = startsIn(reservation)
  if (minutes > 0) return `en ${formatDuration(minutes)}`
  return minutes < 0 ? `hace ${formatDuration(minutes)}` : 'ahora'
}
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :row-key="(r) => r.id"
    :row-class="(r) => (startsIn(r) <= 0 ? 'is-waiting' : undefined)"
    :initial-sort="{ key: 'slot', direction: 'asc' }"
    :empty-text="search ? 'Ninguna reserva coincide con la búsqueda.' : 'No hay llegadas pendientes en esta vista.'"
  >
    <template #toolbar>
      <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar llegadas" />
      <TableSearch v-model="search" />
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
      <StagePill :stage="startsIn(row) <= 0 ? 'waiting' : 'upcoming'" :detail="detail(row)" />
    </template>
    <template #cell-actions="{ row }">
      <button type="button" class="btn btn--sm btn--subtle" @click="openArrival(row)">
        Validar llegada
      </button>
    </template>
  </DataTable>
</template>

<style scoped src="./reservation-cells.css"></style>
