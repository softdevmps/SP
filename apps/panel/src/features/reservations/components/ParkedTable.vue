<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  calculateOverstay,
  formatDuration,
  formatMoney,
  formatTime,
  minutesUntil,
  reservationStage,
  useOccupancyStore,
  type Reservation,
} from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StagePill from './StagePill.vue'
import { matchesSearch } from '../matchesSearch'
import { useReservationActions } from '../useReservationActions'

const { openExit } = useReservationActions()
const { reservations, lot, now } = storeToRefs(useOccupancyStore())

type TabKey = 'all' | 'onTime' | 'overstay'

const activeTab = ref<TabKey>('all')
const search = ref('')

const parked = computed(() => reservations.value.filter((r) => r.status === 'checked_in'))

function isOverstay(reservation: Reservation) {
  return reservationStage(reservation, now.value) === 'overstay'
}

const byTab = computed<Record<TabKey, Reservation[]>>(() => ({
  all: parked.value,
  onTime: parked.value.filter((r) => !isOverstay(r)),
  overstay: parked.value.filter(isOverstay),
}))

const tabs = computed<TableTab<TabKey>[]>(() => [
  { key: 'all', label: 'Todos', count: byTab.value.all.length },
  { key: 'onTime', label: 'Dentro de su franja', count: byTab.value.onTime.length, tone: 'success' },
  { key: 'overstay', label: 'Excedidos', count: byTab.value.overstay.length, tone: 'danger' },
])

const rows = computed(() => byTab.value[activeTab.value].filter((r) => matchesSearch(r, search.value)))

// Por defecto, los que vencen (o vencieron) primero arriba: son los que hay que mirar.
const columns: DataTableColumn<Reservation>[] = [
  { key: 'driver', label: 'Conductor', sortBy: (r) => r.driverName.toLowerCase() },
  { key: 'plate', label: 'Patente', sortBy: (r) => r.vehiclePlate, width: '120px' },
  { key: 'code', label: 'Código', sortBy: (r) => r.code, width: '110px' },
  { key: 'in', label: 'Entrada', sortBy: (r) => r.checkedInAt ?? '', width: '90px' },
  { key: 'until', label: 'Reservado hasta', sortBy: (r) => r.endsAt, width: '140px' },
  { key: 'stage', label: 'Estado', width: '200px' },
  { key: 'charge', label: 'Excedente', align: 'right', width: '110px' },
  { key: 'actions', label: '', align: 'right', width: '160px' },
]

function remaining(reservation: Reservation) {
  const minutes = minutesUntil(reservation.endsAt, now.value)
  return minutes > 0 ? `quedan ${formatDuration(minutes)}` : formatDuration(minutes)
}

function charge(reservation: Reservation) {
  if (!lot.value || !isOverstay(reservation)) return 0
  return calculateOverstay(reservation, now.value, lot.value.overstayTariff).amount
}
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :row-key="(r) => r.id"
    :row-class="(r) => (isOverstay(r) ? 'is-overstay' : undefined)"
    :initial-sort="{ key: 'until', direction: 'asc' }"
    :empty-text="search ? 'Ningún auto coincide con la búsqueda.' : 'No hay autos con reserva en esta vista.'"
  >
    <template #toolbar>
      <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar autos en la playa" />
      <TableSearch v-model="search" />
    </template>

    <template #cell-driver="{ row }"><span class="driver">{{ row.driverName }}</span></template>
    <template #cell-plate="{ row }"><span class="plate">{{ row.vehiclePlate }}</span></template>
    <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
    <template #cell-in="{ row }">
      <span class="muted">{{ row.checkedInAt ? formatTime(row.checkedInAt) : '—' }}</span>
    </template>
    <template #cell-until="{ row }">
      <span class="slot"><strong>{{ formatTime(row.endsAt) }}</strong></span>
    </template>
    <template #cell-stage="{ row }">
      <StagePill :stage="isOverstay(row) ? 'overstay' : 'parked'" :detail="remaining(row)" />
    </template>
    <template #cell-charge="{ row }">
      <span v-if="charge(row)" class="money is-live">{{ formatMoney(charge(row)) }}</span>
      <span v-else class="muted">—</span>
    </template>
    <template #cell-actions="{ row }">
      <button type="button" class="btn btn--sm btn--subtle" @click="openExit(row)">
        Registrar salida
      </button>
    </template>
  </DataTable>
</template>

<style scoped src="./reservation-cells.css"></style>
