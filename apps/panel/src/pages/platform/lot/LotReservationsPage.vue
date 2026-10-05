<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Eye } from 'lucide-vue-next'
import {
  calculateOverstay,
  formatDuration,
  formatMoney,
  formatTime,
  minutesUntil,
  reservationStage,
  useOccupancyStore,
  type Reservation,
  type ReservationStage,
} from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StagePill from '@/features/reservations/components/StagePill.vue'
import { matchesSearch } from '@/features/reservations/matchesSearch'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'
import { useNow } from '@/composables/useNow'

// Reservas del día de la playa, solo para consultar: el admin no valida llegadas ni registra salidas.
const { lotId, lot, lotSettings } = useAdminLot()
const occupancy = useOccupancyStore()
const now = useNow(15_000)

// Primero se cargan (fuera del computed) y después se leen. Son las mismas que ve la playa.
watch(lotId, (id) => occupancy.reservationsFor(id), { immediate: true })
const reservations = computed(() => occupancy.reservationsFor(lotId.value))

type TabKey = 'all' | 'pending' | 'parked' | 'overstay' | 'completed' | 'no_show'
const TAB_STAGES: Record<TabKey, ReservationStage[] | null> = {
  all: null,
  pending: ['upcoming', 'waiting'],
  parked: ['parked', 'overstay'],
  overstay: ['overstay'],
  completed: ['completed'],
  no_show: ['no_show'],
}

const activeTab = ref<TabKey>('all')
const search = ref('')

function stageOf(reservation: Reservation) {
  return reservationStage(reservation, now.value)
}

const byTab = computed(() => {
  const result = {} as Record<TabKey, Reservation[]>
  for (const key of Object.keys(TAB_STAGES) as TabKey[]) {
    const stages = TAB_STAGES[key]
    result[key] = reservations.value.filter((r) => !stages || stages.includes(stageOf(r)))
  }
  return result
})

const tabs = computed<TableTab<TabKey>[]>(() => [
  { key: 'all', label: 'Todas', count: byTab.value.all.length },
  { key: 'pending', label: 'Pendientes', count: byTab.value.pending.length },
  { key: 'parked', label: 'En la playa', count: byTab.value.parked.length, tone: 'success' },
  { key: 'overstay', label: 'Excedidas', count: byTab.value.overstay.length, tone: 'danger' },
  { key: 'completed', label: 'Finalizadas', count: byTab.value.completed.length },
  { key: 'no_show', label: 'No se presentaron', count: byTab.value.no_show.length },
])

const rows = computed(() => byTab.value[activeTab.value].filter((r) => matchesSearch(r, search.value)))

function stageDetail(reservation: Reservation) {
  const stage = stageOf(reservation)
  if (stage === 'upcoming') return `en ${formatDuration(minutesUntil(reservation.startsAt, now.value))}`
  if (stage === 'overstay') return formatDuration(minutesUntil(reservation.endsAt, now.value))
  return undefined
}

function overstayOf(reservation: Reservation): { amount: number; live: boolean } | null {
  if (reservation.status === 'completed') {
    return reservation.overstay?.amount ? { amount: reservation.overstay.amount, live: false } : null
  }
  const tariff = lotSettings.value?.overstayTariff
  if (stageOf(reservation) === 'overstay' && tariff) {
    return { amount: calculateOverstay(reservation, now.value, tariff).amount, live: true }
  }
  return null
}

const columns: DataTableColumn<Reservation>[] = [
  { key: 'slot', label: 'Franja', sortBy: (r) => r.startsAt, width: '130px' },
  { key: 'driver', label: 'Conductor', sortBy: (r) => r.driverName.toLowerCase() },
  { key: 'plate', label: 'Patente', sortBy: (r) => r.vehiclePlate, width: '110px' },
  { key: 'code', label: 'Código', sortBy: (r) => r.code, width: '100px' },
  { key: 'stage', label: 'Estado', width: '190px' },
  { key: 'in', label: 'Entrada', sortBy: (r) => r.checkedInAt ?? '', width: '80px' },
  { key: 'out', label: 'Salida', sortBy: (r) => r.checkedOutAt ?? '', width: '80px' },
  { key: 'overstay', label: 'Excedente', align: 'right', width: '110px' },
]
</script>

<template>
  <div class="reservations">
    <p class="note">
      <Eye :size="16" />
      Reservas de hoy de {{ lot?.name }}. Solo lectura: las llegadas y salidas las registra la playa.
    </p>

    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(r) => r.id"
      :initial-sort="{ key: 'slot', direction: 'asc' }"
      :empty-text="reservations.length ? 'Ninguna reserva coincide.' : 'Esta playa no tiene reservas hoy.'"
    >
      <template #toolbar>
        <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar reservas" />
        <TableSearch v-model="search" />
      </template>

      <template #cell-slot="{ row }">
        <span class="slot"><strong>{{ formatTime(row.startsAt) }}</strong><span>– {{ formatTime(row.endsAt) }}</span></span>
      </template>
      <template #cell-driver="{ row }"><span class="driver">{{ row.driverName }}</span></template>
      <template #cell-plate="{ row }"><span class="plate">{{ row.vehiclePlate }}</span></template>
      <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
      <template #cell-stage="{ row }"><StagePill :stage="stageOf(row)" :detail="stageDetail(row)" /></template>
      <template #cell-in="{ row }"><span class="muted">{{ row.checkedInAt ? formatTime(row.checkedInAt) : '—' }}</span></template>
      <template #cell-out="{ row }"><span class="muted">{{ row.checkedOutAt ? formatTime(row.checkedOutAt) : '—' }}</span></template>
      <template #cell-overstay="{ row }">
        <span v-if="overstayOf(row)" class="money" :class="{ 'is-live': overstayOf(row)!.live }">
          {{ formatMoney(overstayOf(row)!.amount) }}
        </span>
        <span v-else class="muted">—</span>
      </template>
    </DataTable>
  </div>
</template>

<style scoped src="@/features/reservations/components/reservation-cells.css"></style>
<style scoped>
.reservations {
  display: grid;
  gap: 16px;
}

.note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}
</style>
