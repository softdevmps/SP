<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Car, TriangleAlert, X } from 'lucide-vue-next'
import { formatAgo, formatTime, useOccupancyStore, type SpaceStatus } from '@sp/core'

const props = defineProps<{ floorId: string | null; onlyFree?: boolean }>()
/** Cochera con el detalle abierto. */
const selected = defineModel<string | null>('selected', { default: null })

const { lot, snapshot, since, locations, lastChangedSpaceId, now } = storeToRefs(useOccupancyStore())

const floor = computed(() => lot.value?.floors.find((candidate) => candidate.id === props.floorId))

const STATUS_LABELS: Record<SpaceStatus, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  fault: 'Falla de sensor',
}

function statusOf(spaceId: string): SpaceStatus {
  return snapshot.value[spaceId] ?? 'free'
}

function freeIn(spaceIds: string[]) {
  return spaceIds.filter((id) => statusOf(id) === 'free').length
}

function detailText(spaceId: string) {
  const at = since.value[spaceId]
  if (!at) return ''
  const status = statusOf(spaceId)
  if (status === 'fault') return `Sin respuesta desde las ${formatTime(at)}`
  return `${STATUS_LABELS[status]} ${formatAgo(at, now.value)}`
}

/** El detalle se abre hacia adentro del mapa para no salirse por los bordes. */
function popoverSide(index: number) {
  if (index < 3) return 'is-start'
  if (index > 6) return 'is-end'
  return 'is-center'
}

function toggle(spaceId: string) {
  selected.value = selected.value === spaceId ? null : spaceId
}

function onDocumentClick(event: MouseEvent) {
  if (!(event.target as Element).closest?.('.space-slot')) selected.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') selected.value = null
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="floor" class="map" :class="{ 'is-only-free': onlyFree }">
    <div v-for="sector in floor.sectors" :key="sector.id" class="sector">
      <div class="sector__label">
        <span class="sector__name">{{ sector.name }}</span>
        <span class="sector__free">{{ freeIn(sector.spaces.map((space) => space.id)) }} libres</span>
      </div>
      <ul class="spaces">
        <li v-for="(space, index) in sector.spaces" :key="space.id" class="space-slot">
          <button
            :key="`${space.id}-${space.id === lastChangedSpaceId ? statusOf(space.id) : ''}`"
            type="button"
            class="space"
            :class="[
              `is-${statusOf(space.id)}`,
              {
                'is-changed': space.id === lastChangedSpaceId,
                'is-selected': space.id === selected,
              },
            ]"
            :aria-label="`Cochera ${space.number}, ${STATUS_LABELS[statusOf(space.id)]}`"
            :aria-expanded="space.id === selected"
            @click="toggle(space.id)"
          >
            <span class="space__number">{{ space.number }}</span>
            <Car v-if="statusOf(space.id) === 'occupied'" :size="16" :stroke-width="1.8" />
            <TriangleAlert v-else-if="statusOf(space.id) === 'fault'" :size="15" />
          </button>

          <Transition name="pop">
            <div
              v-if="space.id === selected"
              class="detail"
              :class="popoverSide(index)"
              role="dialog"
              :aria-label="`Detalle de la cochera ${space.number}`"
            >
              <header class="detail__header">
                <strong>Cochera {{ space.number }}</strong>
                <button type="button" class="detail__close" aria-label="Cerrar" @click="selected = null">
                  <X :size="14" />
                </button>
              </header>
              <p class="detail__where">
                {{ locations[space.id]?.floorName }} · {{ locations[space.id]?.sectorName }}
              </p>
              <span class="detail__status" :class="`is-${statusOf(space.id)}`">
                {{ STATUS_LABELS[statusOf(space.id)] }}
              </span>
              <p class="detail__since">{{ detailText(space.id) }}</p>
              <p v-if="since[space.id] && statusOf(space.id) !== 'fault'" class="detail__at">
                Desde las {{ formatTime(since[space.id]!) }}
              </p>
            </div>
          </Transition>
        </li>
      </ul>
    </div>

    <ul class="legend">
      <li><span class="swatch is-free" /> Libre</li>
      <li><span class="swatch is-occupied" /> Ocupada</li>
      <li><span class="swatch is-fault" /> Falla de sensor</li>
    </ul>
  </div>
</template>

<style scoped>
.map {
  display: grid;
  gap: 18px;
}

.sector {
  display: grid;
  grid-template-columns: 96px 1fr;
  align-items: center;
  gap: 16px;
}

.sector__label {
  display: grid;
  gap: 2px;
}

.sector__name {
  font-weight: 600;
}

.sector__free {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.spaces {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.space-slot {
  position: relative;
}

.space {
  width: 100%;
  height: 64px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  border: 1px solid;
  border-radius: var(--sp-radius-sm);
  font: inherit;
  cursor: pointer;
  transition:
    background 400ms var(--sp-ease),
    border-color 400ms var(--sp-ease),
    color 400ms var(--sp-ease),
    opacity var(--sp-duration) var(--sp-ease);
}

.space__number {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.space.is-free {
  border-color: rgb(52 196 130 / 0.35);
  background: rgb(52 196 130 / 0.08);
  color: var(--sp-free);
}

.space.is-occupied {
  border-color: rgb(229 72 77 / 0.3);
  background: rgb(229 72 77 / 0.1);
  color: #f08a8d;
}

.space.is-fault {
  border-style: dashed;
  border-color: rgb(226 163 54 / 0.5);
  background: rgb(226 163 54 / 0.07);
  color: var(--sp-warning);
}

.space:hover {
  filter: brightness(1.25);
}

.space.is-selected {
  box-shadow: 0 0 0 2px var(--sp-text);
}

/* "Solo libres": las cocheras no disponibles quedan apagadas para que resalten los huecos */
.map.is-only-free .space:not(.is-free) {
  border-color: var(--sp-border);
  background: transparent;
  color: var(--sp-text-faint);
  opacity: 0.35;
}

.map.is-only-free .space:not(.is-free) svg {
  display: none;
}

.map.is-only-free .space.is-free {
  border-color: rgb(52 196 130 / 0.6);
  background: rgb(52 196 130 / 0.16);
}

/* Aviso breve cuando un sensor cambia de estado */
.space.is-changed {
  animation: changed 1.2s var(--sp-ease);
}

@keyframes changed {
  from {
    box-shadow: 0 0 0 3px rgb(255 255 255 / 0.35);
  }
}

.detail {
  position: absolute;
  top: calc(100% + 8px);
  z-index: 20;
  width: 220px;
  padding: 12px 14px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  box-shadow: var(--sp-shadow-lg);
  font-size: 13px;
}

.detail.is-start {
  left: 0;
}

.detail.is-end {
  right: 0;
}

.detail.is-center {
  left: 50%;
  translate: -50% 0;
}

.detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail__header strong {
  font-size: 14px;
}

.detail__close {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-text-muted);
  cursor: pointer;
}

.detail__close:hover {
  background: var(--sp-surface-3);
  color: var(--sp-text);
}

.detail__where {
  margin: 2px 0 10px;
  color: var(--sp-text-muted);
}

.detail__status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.detail__status.is-free {
  background: rgb(52 196 130 / 0.12);
  color: var(--sp-free);
}

.detail__status.is-occupied {
  background: rgb(229 72 77 / 0.12);
  color: #f08a8d;
}

.detail__status.is-fault {
  background: rgb(226 163 54 / 0.14);
  color: var(--sp-warning);
}

.detail__since {
  margin: 8px 0 0;
  font-weight: 600;
}

.detail__at {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 140ms var(--sp-ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 4px 0 0;
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

@media (max-width: 900px) {
  .sector {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .sector__label {
    display: flex;
    gap: 10px;
    align-items: baseline;
  }

  .spaces {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
