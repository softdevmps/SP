<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Search } from 'lucide-vue-next'
import {
  formatDuration,
  formatTime,
  minutesUntil,
  useOccupancyStore,
  type Reservation,
} from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'

defineEmits<{ validate: [reservation: Reservation] }>()

const { upcomingReservations, checkedInToday, now } = storeToRefs(useOccupancyStore())

type TabKey = 'pending' | 'waiting' | 'next' | 'later' | 'arrived'

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
    arrived: checkedInToday.value,
  }
})

const tabs = computed(() => [
  { key: 'pending' as const, label: 'Pendientes' },
  { key: 'waiting' as const, label: 'Esperando llegada', tone: 'warning' },
  { key: 'next' as const, label: 'Próxima hora' },
  { key: 'later' as const, label: 'Más tarde' },
  { key: 'arrived' as const, label: 'Llegaron', tone: 'success' },
])

const rows = computed(() => {
  const term = search.value.trim().toLowerCase()
  const list = byTab.value[activeTab.value]
  if (!term) return list
  return list.filter((reservation) =>
    [reservation.driverName, reservation.vehiclePlate, reservation.code].some((value) =>
      value.toLowerCase().includes(term),
    ),
  )
})

const columns: DataTableColumn<Reservation>[] = [
  { key: 'slot', label: 'Franja', sortBy: (r) => r.startsAt, width: '150px' },
  { key: 'driver', label: 'Conductor', sortBy: (r) => r.driverName.toLowerCase() },
  { key: 'plate', label: 'Patente', sortBy: (r) => r.vehiclePlate, width: '120px' },
  { key: 'code', label: 'Código', sortBy: (r) => r.code, width: '120px' },
  { key: 'status', label: 'Estado', width: '170px' },
  { key: 'actions', label: '', align: 'right', width: '110px' },
]

function statusOf(reservation: Reservation): { text: string; tone: string } {
  if (reservation.status === 'checked_in') {
    return {
      text: reservation.checkedInAt ? `Llegó ${formatTime(reservation.checkedInAt)}` : 'Llegó',
      tone: 'success',
    }
  }
  const minutes = startsIn(reservation)
  if (minutes <= 0) {
    return { text: minutes === 0 ? 'Esperando · ahora' : `Esperando · ${formatDuration(minutes)}`, tone: 'warning' }
  }
  return { text: `En ${formatDuration(minutes)}`, tone: 'neutral' }
}

function rowClass(reservation: Reservation) {
  return reservation.status === 'pending' && startsIn(reservation) <= 0 ? 'is-waiting' : undefined
}
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :row-key="(r) => r.id"
    :row-class="rowClass"
    :initial-sort="{ key: 'slot', direction: 'asc' }"
    :empty-text="search ? 'Ninguna reserva coincide con la búsqueda.' : 'No hay reservas en esta vista.'"
  >
    <template #toolbar>
      <div class="tabs" role="tablist" aria-label="Filtrar reservas">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="tab"
          :class="[{ 'is-active': activeTab === tab.key }, tab.tone && `is-${tab.tone}`]"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="tab__count">{{ byTab[tab.key].length }}</span>
        </button>
      </div>

      <label class="search">
        <Search :size="16" class="search__icon" />
        <input v-model="search" type="search" placeholder="Buscar nombre, patente o código" />
      </label>
    </template>

    <template #cell-slot="{ row }">
      <span class="slot">
        <strong>{{ formatTime(row.startsAt) }}</strong>
        <span>– {{ formatTime(row.endsAt) }}</span>
      </span>
    </template>

    <template #cell-driver="{ row }">
      <span class="driver">{{ row.driverName }}</span>
    </template>

    <template #cell-plate="{ row }">
      <span class="plate">{{ row.vehiclePlate }}</span>
    </template>

    <template #cell-code="{ row }">
      <span class="mono">{{ row.code }}</span>
    </template>

    <template #cell-status="{ row }">
      <span class="pill" :class="`is-${statusOf(row).tone}`">{{ statusOf(row).text }}</span>
    </template>

    <template #cell-actions="{ row }">
      <button
        v-if="row.status === 'pending'"
        type="button"
        class="action"
        @click="$emit('validate', row)"
      >
        Validar
      </button>
    </template>
  </DataTable>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.tab:hover {
  color: var(--sp-text);
}

.tab.is-active {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
  color: var(--sp-text);
  box-shadow: var(--sp-shadow-sm);
}

.tab__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--sp-surface-3);
  font-size: 11px;
  text-align: center;
  color: var(--sp-text-muted);
  font-variant-numeric: tabular-nums;
}

.tab.is-warning .tab__count {
  background: rgb(226 163 54 / 0.14);
  color: var(--sp-warning);
}

.tab.is-success .tab__count {
  background: rgb(52 196 130 / 0.12);
  color: var(--sp-free);
}

.search {
  position: relative;
  display: flex;
  align-items: center;
}

.search__icon {
  position: absolute;
  left: 10px;
  color: var(--sp-text-faint);
  pointer-events: none;
}

.search input {
  width: 260px;
  height: 34px;
  padding: 0 10px 0 32px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
  color: var(--sp-text);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.search input:focus {
  border-color: var(--sp-accent-hover);
  box-shadow: 0 0 0 3px var(--sp-accent-soft);
}

.slot {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.slot strong {
  font-size: 14px;
}

.slot span {
  color: var(--sp-text-muted);
}

.driver {
  font-weight: 600;
}

.plate {
  padding: 2px 7px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--sp-text-muted);
}

.pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--sp-surface-3);
  font-size: 12px;
  font-weight: 600;
  color: var(--sp-text-muted);
  white-space: nowrap;
}

.pill.is-warning {
  background: rgb(226 163 54 / 0.14);
  color: var(--sp-warning);
}

.pill.is-success {
  background: rgb(52 196 130 / 0.12);
  color: var(--sp-free);
}

.action {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  color: var(--sp-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--sp-duration) var(--sp-ease),
    border-color var(--sp-duration) var(--sp-ease);
}

.action:hover {
  border-color: rgb(155 31 48 / 0.6);
  background: var(--sp-accent-soft);
}

/* Reservas cuya franja ya empezó: marca ámbar a la izquierda de la fila */
:deep(tr.is-waiting td:first-child) {
  box-shadow: inset 3px 0 0 var(--sp-warning);
}

@media (max-width: 720px) {
  .search,
  .search input {
    width: 100%;
  }
}
</style>
