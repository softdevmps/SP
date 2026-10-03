<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, Plus, Trash2, TriangleAlert } from 'lucide-vue-next'
import type { Floor, Sector } from '@sp/core'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'
import { useToast } from '@/composables/useToast'

const { lot, layout, sensors, platform, hardware } = useAdminLot()
const toast = useToast()

/** Copia editable del plano; se guarda recién al confirmar. */
const draft = ref<Floor[]>([])
let uid = 0

function reset() {
  draft.value = JSON.parse(JSON.stringify(layout.value?.floors ?? [])) as Floor[]
}
watch(layout, reset, { immediate: true })

const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(layout.value?.floors ?? []))

const totals = computed(() => ({
  floors: draft.value.length,
  sectors: draft.value.reduce((sum, floor) => sum + floor.sectors.length, 0),
  spaces: draft.value.reduce(
    (sum, floor) => sum + floor.sectors.reduce((acc, sector) => acc + sector.spaces.length, 0),
    0,
  ),
}))

/** Numeración que tendrá cada sector al guardar (correlativa en orden de pisos y sectores). */
const ranges = computed(() => {
  const result: Record<string, string> = {}
  let next = 1
  for (const floor of draft.value) {
    for (const sector of floor.sectors) {
      const count = sector.spaces.length
      result[sector.id] = count ? `Cocheras ${next}–${next + count - 1}` : 'Sin cocheras'
      next += count
    }
  }
  return result
})

/** Cocheras que se eliminarían y hoy tienen un sensor asignado. */
const orphanedSensors = computed(() => {
  const kept = new Set(
    draft.value.flatMap((floor) => floor.sectors.flatMap((sector) => sector.spaces.map((space) => space.id))),
  )
  return sensors.value.filter((sensor) => sensor.spaceId && !kept.has(sensor.spaceId))
})

function newId(prefix: string) {
  return `${lot.value?.id}-${prefix}-new${Date.now()}${uid++}`
}

function addFloor() {
  draft.value.push({
    id: newId('f'),
    name: `Piso ${draft.value.length + 1}`,
    sectors: [{ id: newId('sec'), name: 'Sector A', spaces: [] }],
  })
}

function addSector(floor: Floor) {
  floor.sectors.push({
    id: newId('sec'),
    name: `Sector ${String.fromCharCode(65 + floor.sectors.length)}`,
    spaces: [],
  })
}

function setSpaceCount(sector: Sector, value: string) {
  const count = Math.max(0, Math.min(99, Math.floor(Number(value) || 0)))
  while (sector.spaces.length < count) sector.spaces.push({ id: newId('s'), number: 0 })
  sector.spaces.splice(count)
}

function move<T>(list: T[], index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  if (item !== undefined) list.splice(target, 0, item)
}

function save() {
  if (!lot.value) return
  for (const sensor of orphanedSensors.value) hardware.assignSensor(sensor.id, null)
  platform.saveLayout(lot.value.id, JSON.parse(JSON.stringify(draft.value)) as Floor[])
  reset() // vuelve a tomar el plano guardado, ya renumerado
  toast.show(`Plano guardado · ${totals.value.spaces} cocheras`)
}
</script>

<template>
  <div class="editor">
    <div class="toolbar">
      <p class="summary">
        <strong>{{ totals.floors }}</strong> pisos · <strong>{{ totals.sectors }}</strong> sectores ·
        <strong>{{ totals.spaces }}</strong> cocheras
      </p>
      <div class="toolbar__actions">
        <button type="button" class="btn" @click="addFloor"><Plus :size="16" /> Agregar piso</button>
        <button type="button" class="btn" :disabled="!isDirty" @click="reset">Descartar cambios</button>
        <button type="button" class="btn btn--primary" :disabled="!isDirty" @click="save">Guardar plano</button>
      </div>
    </div>

    <p v-if="orphanedSensors.length" class="warning">
      <TriangleAlert :size="16" />
      {{ orphanedSensors.length }}
      {{ orphanedSensors.length === 1 ? 'cochera que se elimina tiene' : 'cocheras que se eliminan tienen' }}
      sensor asignado. Al guardar, esos sensores quedan sin cochera.
    </p>

    <p class="hint">
      Las cocheras se numeran solas, en orden de pisos y sectores. Ese número es el que ven el playero y
      los conductores.
    </p>

    <section v-for="(floor, floorIndex) in draft" :key="floor.id" class="floor">
      <header class="floor__header">
        <input v-model="floor.name" class="input floor__name" aria-label="Nombre del piso" />
        <div class="floor__actions">
          <button type="button" class="icon-btn" aria-label="Subir piso" :disabled="floorIndex === 0" @click="move(draft, floorIndex, -1)">
            <ArrowUp :size="16" />
          </button>
          <button type="button" class="icon-btn" aria-label="Bajar piso" :disabled="floorIndex === draft.length - 1" @click="move(draft, floorIndex, 1)">
            <ArrowDown :size="16" />
          </button>
          <button type="button" class="icon-btn is-danger" aria-label="Eliminar piso" @click="draft.splice(floorIndex, 1)">
            <Trash2 :size="16" />
          </button>
        </div>
      </header>

      <div class="sectors">
        <div v-for="(sector, sectorIndex) in floor.sectors" :key="sector.id" class="sector">
          <input v-model="sector.name" class="input sector__name" aria-label="Nombre del sector" />
          <label class="sector__count">
            <input
              :value="sector.spaces.length"
              class="input"
              type="number"
              min="0"
              max="99"
              aria-label="Cantidad de cocheras"
              @change="setSpaceCount(sector, ($event.target as HTMLInputElement).value)"
            />
            cocheras
          </label>
          <span class="sector__range">{{ ranges[sector.id] }}</span>
          <span class="sector__preview" aria-hidden="true">
            <span v-for="space in sector.spaces" :key="space.id" />
          </span>
          <button
            type="button"
            class="icon-btn is-danger"
            aria-label="Eliminar sector"
            @click="floor.sectors.splice(sectorIndex, 1)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
        <button type="button" class="add-sector" @click="addSector(floor)"><Plus :size="15" /> Agregar sector</button>
      </div>
    </section>

    <p v-if="!draft.length" class="empty">Esta playa todavía no tiene plano. Empezá agregando un piso.</p>
  </div>
</template>

<style scoped>
.editor {
  display: grid;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary {
  margin: 0;
  color: var(--sp-text-muted);
}

.summary strong {
  color: var(--sp-text);
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-faint);
}

.warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgb(226 163 54 / 0.35);
  border-radius: var(--sp-radius-sm);
  background: rgb(226 163 54 / 0.08);
  color: var(--sp-warning);
  font-size: 13px;
}

.floor {
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.floor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--sp-border);
}

.floor__name {
  max-width: 260px;
  font-weight: 600;
}

.floor__actions {
  display: flex;
  gap: 4px;
}

.sectors {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
}

.sector {
  display: grid;
  grid-template-columns: 180px 150px 140px minmax(0, 1fr) 32px;
  align-items: center;
  gap: 12px;
}

.sector__count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.sector__count .input {
  width: 70px;
}

.sector__range {
  font-size: 13px;
  color: var(--sp-text-muted);
  font-variant-numeric: tabular-nums;
}

.sector__preview {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.sector__preview span {
  width: 10px;
  height: 14px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 2px;
  background: var(--sp-surface-3);
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text-muted);
  cursor: pointer;
}

.icon-btn:hover:not(:disabled) {
  background: var(--sp-surface-2);
  color: var(--sp-text);
}

.icon-btn.is-danger:hover:not(:disabled) {
  color: #f08a8d;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-sector {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.add-sector:hover {
  color: var(--sp-text);
  border-color: rgb(255 255 255 / 0.25);
}

.empty {
  margin: 0;
  padding: 32px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius);
  text-align: center;
  color: var(--sp-text-muted);
}

@media (max-width: 1000px) {
  .sector {
    grid-template-columns: 1fr 1fr 32px;
  }

  .sector__range,
  .sector__preview {
    grid-column: 1 / -2;
  }
}
</style>
