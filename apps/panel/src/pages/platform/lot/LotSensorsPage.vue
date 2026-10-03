<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { formatAgo, type Sensor } from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StatusPill from '@/components/StatusPill.vue'
import SensorAssignDialog from '@/features/admin-hardware/components/SensorAssignDialog.vue'
import SensorCommandDialog from '@/features/admin-hardware/components/SensorCommandDialog.vue'
import { SENSOR_HEALTH } from '@/features/admin-hardware/labels'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'
import { useNow } from '@/composables/useNow'

const route = useRoute()
const { layout, devices, sensors } = useAdminLot()
const now = useNow()

type TabKey = 'all' | 'faults' | 'unassigned'
const activeTab = ref<TabKey>('all')
const search = ref('')
const deviceFilter = ref('')
const portFilter = ref('')

// Desde Equipos se llega con ?equipo=…&linea=… para ver los sensores de una línea.
watch(
  () => route.query,
  (query) => {
    deviceFilter.value = typeof query.equipo === 'string' ? query.equipo : ''
    portFilter.value = typeof query.linea === 'string' ? query.linea : ''
  },
  { immediate: true },
)

/** Número, piso y sector de cada cochera del plano. */
const spaces = computed(() => {
  const index: Record<string, { number: number; where: string }> = {}
  for (const floor of layout.value?.floors ?? []) {
    for (const sector of floor.sectors) {
      for (const space of sector.spaces) index[space.id] = { number: space.number, where: `${floor.name} · ${sector.name}` }
    }
  }
  return index
})

const devicesById = computed(() => Object.fromEntries(devices.value.map((device) => [device.id, device])))

const filtered = computed(() =>
  sensors.value.filter(
    (sensor) =>
      (!deviceFilter.value || sensor.deviceId === deviceFilter.value) &&
      (!portFilter.value || String(sensor.port) === portFilter.value),
  ),
)

const tabs = computed<TableTab<TabKey>[]>(() => [
  { key: 'all', label: 'Todos', count: filtered.value.length },
  { key: 'faults', label: 'Con falla', count: filtered.value.filter((s) => s.health !== 'ok').length, tone: 'danger' },
  { key: 'unassigned', label: 'Sin cochera', count: filtered.value.filter((s) => !s.spaceId).length, tone: 'warning' },
])

function spaceLabel(sensor: Sensor) {
  const space = sensor.spaceId ? spaces.value[sensor.spaceId] : undefined
  return space ? `Cochera ${space.number}` : 'Sin cochera'
}

const rows = computed(() => {
  const term = search.value.trim().toLowerCase()
  return filtered.value
    .filter((sensor) => {
      if (activeTab.value === 'faults') return sensor.health !== 'ok'
      if (activeTab.value === 'unassigned') return !sensor.spaceId
      return true
    })
    .filter((sensor) => !term || `${spaceLabel(sensor)} slave ${sensor.slaveId}`.toLowerCase().includes(term))
})

const columns: DataTableColumn<Sensor>[] = [
  { key: 'space', label: 'Cochera', sortBy: (s) => (s.spaceId ? (spaces.value[s.spaceId]?.number ?? 0) : 9999), width: '180px' },
  { key: 'wiring', label: 'Equipo · línea · slave', sortBy: (s) => `${s.deviceId}-${s.port}-${String(s.slaveId).padStart(3, '0')}` },
  { key: 'health', label: 'Estado', sortBy: (s) => s.health, width: '150px' },
  { key: 'reading', label: 'Lectura', width: '170px' },
  { key: 'preset', label: 'Calibración', sortBy: (s) => s.presetHeightM, align: 'right', width: '110px' },
  { key: 'seen', label: 'Última lectura', sortBy: (s) => s.lastReadingAt ?? '', width: '140px' },
  { key: 'actions', label: '', align: 'right', width: '200px' },
]

const selected = ref<Sensor | null>(null)
const assignOpen = ref(false)
const commandOpen = ref(false)

function openAssign(sensor: Sensor) {
  selected.value = sensor
  assignOpen.value = true
}

function openCommands(sensor: Sensor) {
  selected.value = sensor
  commandOpen.value = true
}
</script>

<template>
  <div class="sensors">
    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(s) => s.id"
      :initial-sort="{ key: 'space', direction: 'asc' }"
      :empty-text="sensors.length ? 'Ningún sensor coincide con los filtros.' : 'Esta playa todavía no tiene sensores conectados.'"
    >
      <template #toolbar>
        <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar sensores" />
        <div class="filters">
          <select v-model="deviceFilter" class="select select--sm" aria-label="Equipo">
            <option value="">Todos los equipos</option>
            <option v-for="device in devices" :key="device.id" :value="device.id">{{ device.name }}</option>
          </select>
          <select v-model="portFilter" class="select select--sm" aria-label="Línea">
            <option value="">Todas las líneas</option>
            <option v-for="port in [1, 2, 3, 4]" :key="port" :value="String(port)">Línea {{ port }}</option>
          </select>
          <TableSearch v-model="search" placeholder="Buscar cochera o slave" />
        </div>
      </template>

      <template #cell-space="{ row }">
        <span v-if="row.spaceId" class="space">
          <strong>{{ spaceLabel(row) }}</strong>
          <span>{{ spaces[row.spaceId]?.where }}</span>
        </span>
        <StatusPill v-else label="Sin cochera" tone="warning" />
      </template>

      <template #cell-wiring="{ row }">
        <span class="muted">{{ devicesById[row.deviceId]?.name ?? '—' }} · L{{ row.port }} · #{{ row.slaveId }}</span>
      </template>

      <template #cell-health="{ row }">
        <StatusPill :label="SENSOR_HEALTH[row.health].label" :tone="SENSOR_HEALTH[row.health].tone" />
      </template>

      <template #cell-reading="{ row }">
        <span v-if="row.health === 'offline' || row.detectedHeightM === null" class="muted">Sin lectura</span>
        <span v-else>
          {{ row.occupied ? 'Ocupada' : 'Libre' }}
          <span class="muted"> · {{ row.detectedHeightM.toFixed(1) }} m</span>
        </span>
      </template>

      <template #cell-preset="{ row }">
        <span class="number">{{ row.presetHeightM.toFixed(1) }} m</span>
      </template>

      <template #cell-seen="{ row }">
        <span class="muted">{{ row.lastReadingAt ? formatAgo(row.lastReadingAt, now) : '—' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <span class="actions">
          <button type="button" class="btn btn--sm" @click="openAssign(row)">
            {{ row.spaceId ? 'Reasignar' : 'Asignar' }}
          </button>
          <button type="button" class="btn btn--sm btn--subtle" @click="openCommands(row)">Comandos</button>
        </span>
      </template>
    </DataTable>

    <SensorAssignDialog v-model:open="assignOpen" :sensor="selected" :layout="layout" :sensors="sensors" />
    <SensorCommandDialog
      v-model:open="commandOpen"
      :sensor="selected"
      :space-label="selected ? spaceLabel(selected) : ''"
    />
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.select--sm {
  width: auto;
  height: 34px;
  font-size: 13px;
}

.space {
  display: grid;
}

.space span,
.muted {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: inline-flex;
  gap: 6px;
}
</style>
