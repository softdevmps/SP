<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Car, TriangleAlert } from 'lucide-vue-next'
import { formatAgo, type Sensor } from '@sp/core'
import StatusPill from '@/components/StatusPill.vue'
import SensorCommandDialog from '@/features/admin-hardware/components/SensorCommandDialog.vue'
import { SENSOR_HEALTH } from '@/features/admin-hardware/labels'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'
import { useNow } from '@/composables/useNow'

// Estado físico de las cocheras según cada sensor: solo libre, ocupada o falla. Sin reservas ni
// personas (regla de privacidad del admin). Sirve para verificar que los sensores responden.
const { lotId, layout, sensors, hardware } = useAdminLot()
const now = useNow(5000)

const floorId = ref<string | null>(null)
watch(
  layout,
  (value) => {
    if (!floorId.value || !value?.floors.some((floor) => floor.id === floorId.value)) {
      floorId.value = value?.floors[0]?.id ?? null
    }
  },
  { immediate: true },
)
const floor = computed(() => layout.value?.floors.find((candidate) => candidate.id === floorId.value))

const sensorBySpace = computed(() => {
  const index: Record<string, Sensor> = {}
  for (const sensor of sensors.value) if (sensor.spaceId) index[sensor.spaceId] = sensor
  return index
})

type CellState = 'free' | 'occupied' | 'fault' | 'none'

function stateOf(spaceId: string): CellState {
  const sensor = sensorBySpace.value[spaceId]
  if (!sensor) return 'none'
  if (sensor.health !== 'ok') return 'fault'
  return sensor.occupied ? 'occupied' : 'free'
}

const counts = computed(() => {
  const result = { free: 0, occupied: 0, fault: 0, none: 0 }
  for (const floorItem of layout.value?.floors ?? []) {
    for (const sector of floorItem.sectors) for (const space of sector.spaces) result[stateOf(space.id)]++
  }
  return result
})

const selectedSpace = ref<{ id: string; number: number } | null>(null)
const selectedSensor = computed(() => (selectedSpace.value ? sensorBySpace.value[selectedSpace.value.id] : undefined))
const commandOpen = ref(false)

let stopFeed: (() => void) | null = null
onMounted(() => (stopFeed = hardware.startLiveFeed(lotId.value)))
onBeforeUnmount(() => stopFeed?.())
</script>

<template>
  <div class="live">
    <dl class="counts">
      <div class="is-free"><dt>Libres</dt><dd>{{ counts.free }}</dd></div>
      <div class="is-occupied"><dt>Ocupadas</dt><dd>{{ counts.occupied }}</dd></div>
      <div class="is-fault"><dt>Con falla</dt><dd>{{ counts.fault }}</dd></div>
      <div><dt>Sin sensor</dt><dd>{{ counts.none }}</dd></div>
    </dl>

    <div class="layout">
      <section class="map-card">
        <div class="floors" role="tablist" aria-label="Pisos">
          <button
            v-for="item in layout?.floors ?? []"
            :key="item.id"
            type="button"
            role="tab"
            class="floor-tab"
            :class="{ 'is-active': item.id === floorId }"
            :aria-selected="item.id === floorId"
            @click="floorId = item.id"
          >
            {{ item.name }}
          </button>
        </div>

        <div v-if="floor" class="sectors">
          <div v-for="sector in floor.sectors" :key="sector.id" class="sector">
            <span class="sector__name">{{ sector.name }}</span>
            <ul class="cells">
              <li v-for="space in sector.spaces" :key="space.id">
                <button
                  type="button"
                  class="cell"
                  :class="[`is-${stateOf(space.id)}`, { 'is-selected': selectedSpace?.id === space.id }]"
                  :aria-label="`Cochera ${space.number}`"
                  @click="selectedSpace = { id: space.id, number: space.number }"
                >
                  <span>{{ space.number }}</span>
                  <Car v-if="stateOf(space.id) === 'occupied'" :size="14" />
                  <TriangleAlert v-else-if="stateOf(space.id) === 'fault'" :size="13" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        <ul class="legend">
          <li><span class="swatch is-free" /> Libre</li>
          <li><span class="swatch is-occupied" /> Ocupada</li>
          <li><span class="swatch is-fault" /> Falla del sensor</li>
          <li><span class="swatch is-none" /> Sin sensor asignado</li>
        </ul>
      </section>

      <aside class="detail">
        <template v-if="selectedSpace">
          <h3>Cochera {{ selectedSpace.number }}</h3>
          <template v-if="selectedSensor">
            <StatusPill :label="SENSOR_HEALTH[selectedSensor.health].label" :tone="SENSOR_HEALTH[selectedSensor.health].tone" />
            <dl class="detail__data">
              <div><dt>Lectura</dt><dd>{{ selectedSensor.health === 'ok' ? (selectedSensor.occupied ? 'Ocupada' : 'Libre') : '—' }}</dd></div>
              <div><dt>Altura medida</dt><dd>{{ selectedSensor.detectedHeightM?.toFixed(1) ?? '—' }} m</dd></div>
              <div><dt>Calibración</dt><dd>{{ selectedSensor.presetHeightM.toFixed(1) }} m</dd></div>
              <div><dt>Línea · slave</dt><dd>L{{ selectedSensor.port }} · #{{ selectedSensor.slaveId }}</dd></div>
              <div><dt>Última lectura</dt><dd>{{ selectedSensor.lastReadingAt ? formatAgo(selectedSensor.lastReadingAt, now) : '—' }}</dd></div>
            </dl>
            <button type="button" class="btn btn--sm btn--subtle" @click="commandOpen = true">Comandos</button>
          </template>
          <p v-else class="muted">Esta cochera no tiene sensor asignado. Asignalo desde la pestaña Sensores.</p>
        </template>
        <p v-else class="muted">Tocá una cochera para ver su sensor.</p>
      </aside>
    </div>

    <SensorCommandDialog
      v-model:open="commandOpen"
      :sensor="selectedSensor ?? null"
      :space-label="selectedSpace ? `Cochera ${selectedSpace.number}` : ''"
    />
  </div>
</template>

<style scoped>
.live {
  display: grid;
  gap: 20px;
}

.counts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.counts div {
  padding: 14px 18px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.counts dt {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.counts dd {
  margin: 4px 0 0;
  font-family: var(--sp-font-display);
  font-size: 26px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.counts .is-free dd {
  color: var(--sp-free);
}

.counts .is-occupied dd {
  color: #f08a8d;
}

.counts .is-fault dd {
  color: var(--sp-warning);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  align-items: start;
}

.map-card,
.detail {
  padding: 20px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.floors {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 18px;
}

.floor-tab {
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.floor-tab.is-active {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
  color: var(--sp-text);
}

.sectors {
  display: grid;
  gap: 14px;
}

.sector {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 12px;
}

.sector__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-muted);
}

.cells {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cell {
  width: 100%;
  height: 52px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  border: 1px solid;
  border-radius: var(--sp-radius-sm);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 400ms var(--sp-ease),
    color 400ms var(--sp-ease);
}

.cell.is-free {
  border-color: rgb(52 196 130 / 0.35);
  background: rgb(52 196 130 / 0.08);
  color: var(--sp-free);
}

.cell.is-occupied {
  border-color: rgb(229 72 77 / 0.3);
  background: rgb(229 72 77 / 0.1);
  color: #f08a8d;
}

.cell.is-fault {
  border-style: dashed;
  border-color: rgb(226 163 54 / 0.5);
  background: rgb(226 163 54 / 0.07);
  color: var(--sp-warning);
}

.cell.is-none {
  border-style: dashed;
  border-color: var(--sp-border-strong);
  background: transparent;
  color: var(--sp-text-faint);
}

.cell.is-selected {
  box-shadow: 0 0 0 2px var(--sp-text);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 18px 0 0;
  padding: 14px 0 0;
  border-top: 1px solid var(--sp-border);
  list-style: none;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.swatch.is-free {
  background: var(--sp-free);
}

.swatch.is-occupied {
  background: var(--sp-occupied);
}

.swatch.is-fault {
  background: var(--sp-warning);
}

.swatch.is-none {
  border: 1px dashed var(--sp-text-faint);
}

.detail {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.detail h3 {
  margin: 0;
  font-size: 16px;
}

.detail__data {
  width: 100%;
  display: grid;
  gap: 8px;
  margin: 0;
  font-size: 13px;
}

.detail__data div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail__data dt {
  color: var(--sp-text-muted);
}

.detail__data dd {
  margin: 0;
  font-weight: 600;
}

.muted {
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .cells {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
