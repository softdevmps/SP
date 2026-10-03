<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronRight } from 'lucide-vue-next'
import { formatDate, usePlatformStore, type LotStatus, type PlatformLot } from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StatusPill from '@/components/StatusPill.vue'
import { LOT_STATUSES } from '../statuses'

const emit = defineEmits<{
  edit: [lot: PlatformLot]
  changeStatus: [lot: PlatformLot, target: LotStatus]
}>()

const { lots, ownersById } = storeToRefs(usePlatformStore())

type TabKey = 'all' | LotStatus

const activeTab = ref<TabKey>('all')
const search = ref('')

const tabs = computed<TableTab<TabKey>[]>(() => {
  const count = (status: LotStatus) => lots.value.filter((lot) => lot.status === status).length
  return [
    { key: 'all', label: 'Todas', count: lots.value.length },
    { key: 'active', label: 'Activas', count: count('active'), tone: 'success' },
    { key: 'onboarding', label: 'En instalación', count: count('onboarding') },
    { key: 'suspended', label: 'Suspendidas', count: count('suspended'), tone: 'danger' },
    { key: 'not_subscribed', label: 'No suscriptas', count: count('not_subscribed') },
  ]
})

function ownerName(lot: PlatformLot) {
  return lot.ownerId ? (ownersById.value[lot.ownerId]?.name ?? '—') : ''
}

const rows = computed(() => {
  const term = search.value.trim().toLowerCase()
  return lots.value
    .filter((lot) => activeTab.value === 'all' || lot.status === activeTab.value)
    .filter(
      (lot) =>
        !term ||
        [lot.name, lot.address, lot.neighborhood, ownerName(lot)].some((value) =>
          value.toLowerCase().includes(term),
        ),
    )
})

function occupancyPercent(lot: PlatformLot) {
  if (lot.freeSpaces === null || !lot.totalSpaces) return null
  return Math.round(((lot.totalSpaces - lot.freeSpaces) / lot.totalSpaces) * 100)
}

/** La acción de estado más habitual para cada estado actual. */
function statusAction(lot: PlatformLot): { label: string; target: LotStatus } | null {
  if (lot.status === 'active') return { label: 'Suspender', target: 'suspended' }
  if (lot.status === 'onboarding') return { label: 'Activar', target: 'active' }
  if (lot.status === 'suspended') return { label: 'Reactivar', target: 'active' }
  return null
}

function onStatusAction(lot: PlatformLot) {
  const action = statusAction(lot)
  if (action) emit('changeStatus', lot, action.target)
}

const columns: DataTableColumn<PlatformLot>[] = [
  { key: 'lot', label: 'Playa', sortBy: (lot) => lot.name.toLowerCase(), width: '240px' },
  { key: 'owner', label: 'Dueño', sortBy: (lot) => ownerName(lot).toLowerCase() },
  { key: 'status', label: 'Estado', sortBy: (lot) => lot.status, width: '140px' },
  { key: 'spaces', label: 'Cocheras', sortBy: (lot) => lot.totalSpaces, align: 'right', width: '90px' },
  { key: 'occupancy', label: 'Ocupación', sortBy: (lot) => occupancyPercent(lot) ?? -1, width: '150px' },
  { key: 'faults', label: 'Fallas', sortBy: (lot) => lot.faultySensors ?? -1, align: 'right', width: '80px' },
  { key: 'reservations', label: 'Reservas hoy', sortBy: (lot) => lot.reservationsToday ?? -1, align: 'right', width: '110px' },
  { key: 'created', label: 'Alta', sortBy: (lot) => lot.createdAt, width: '110px' },
  { key: 'actions', label: '', align: 'right', width: '200px' },
]
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :row-key="(lot) => lot.id"
    :initial-sort="{ key: 'lot', direction: 'asc' }"
    :empty-text="search ? 'Ninguna playa coincide con la búsqueda.' : 'No hay playas en esta vista.'"
  >
    <template #toolbar>
      <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar playas" />
      <TableSearch v-model="search" placeholder="Buscar playa, dirección, barrio o dueño" />
    </template>

    <template #cell-lot="{ row }">
      <span class="lot">
        <RouterLink :to="{ name: 'admin-lot', params: { lotId: row.id } }" class="lot__name">{{ row.name }}</RouterLink>
        <span>{{ row.address }}<template v-if="row.neighborhood"> · {{ row.neighborhood }}</template></span>
      </span>
    </template>

    <template #cell-owner="{ row }">
      <span v-if="ownerName(row)">{{ ownerName(row) }}</span>
      <span v-else class="muted">—</span>
    </template>

    <template #cell-status="{ row }">
      <StatusPill :label="LOT_STATUSES[row.status].label" :tone="LOT_STATUSES[row.status].tone" />
    </template>

    <template #cell-spaces="{ row }">
      <span class="number">{{ row.totalSpaces }}</span>
    </template>

    <template #cell-occupancy="{ row }">
      <span v-if="occupancyPercent(row) !== null" class="occupancy">
        <span class="occupancy__bar" aria-hidden="true">
          <span :style="{ width: `${occupancyPercent(row)}%` }" />
        </span>
        <span class="number">{{ occupancyPercent(row) }}%</span>
      </span>
      <span v-else class="muted">—</span>
    </template>

    <template #cell-faults="{ row }">
      <span v-if="row.faultySensors === null" class="muted">—</span>
      <span v-else class="number" :class="{ 'is-warning': row.faultySensors > 0 }">{{ row.faultySensors }}</span>
    </template>

    <template #cell-reservations="{ row }">
      <span v-if="row.reservationsToday === null" class="muted">—</span>
      <span v-else class="number">{{ row.reservationsToday }}</span>
    </template>

    <template #cell-created="{ row }">
      <span class="muted">{{ formatDate(row.createdAt) }}</span>
    </template>

    <template #cell-actions="{ row }">
      <span class="actions">
        <button type="button" class="btn btn--sm" @click="emit('edit', row)">Editar</button>
        <button
          v-if="statusAction(row)"
          type="button"
          class="btn btn--sm btn--subtle"
          @click="onStatusAction(row)"
        >
          {{ statusAction(row)!.label }}
        </button>
        <RouterLink
          :to="{ name: 'admin-lot', params: { lotId: row.id } }"
          class="open"
          :aria-label="`Abrir ${row.name}`"
          title="Abrir la ficha de la playa"
        >
          <ChevronRight :size="18" />
        </RouterLink>
      </span>
    </template>
  </DataTable>
</template>

<style scoped>
.lot {
  display: grid;
}

.lot__name {
  justify-self: start;
  font-weight: 600;
}

.lot__name:hover {
  color: var(--sp-accent-hover);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lot span,
.muted {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.number.is-warning {
  color: var(--sp-warning);
}

.occupancy {
  display: flex;
  align-items: center;
  gap: 10px;
}

.occupancy__bar {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--sp-surface-3);
}

.occupancy__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--sp-accent);
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.open {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  color: var(--sp-text-muted);
}

.open:hover {
  background: var(--sp-surface-3);
  color: var(--sp-text);
}
</style>
