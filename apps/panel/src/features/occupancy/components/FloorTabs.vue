<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOccupancyStore } from '@sp/core'

defineProps<{ selectedFloorId: string | null }>()
defineEmits<{ select: [floorId: string] }>()

const { floors } = storeToRefs(useOccupancyStore())
</script>

<template>
  <div class="tabs" role="tablist" aria-label="Pisos">
    <button
      v-for="floor in floors"
      :key="floor.floorId"
      type="button"
      role="tab"
      class="tab"
      :class="{ 'is-selected': floor.floorId === selectedFloorId }"
      :aria-selected="floor.floorId === selectedFloorId"
      @click="$emit('select', floor.floorId)"
    >
      {{ floor.name }}
      <span class="tab__count" :class="{ 'is-full': floor.free === 0 }">
        {{ floor.free }} {{ floor.free === 1 ? 'libre' : 'libres' }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-bg);
}

.tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text-muted);
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.tab:hover {
  color: var(--sp-text);
}

.tab.is-selected {
  color: var(--sp-text);
  background: var(--sp-surface-2);
  border-color: var(--sp-border-strong);
  box-shadow: var(--sp-shadow-sm);
}

.tab__count {
  padding: 1px 8px;
  border-radius: 999px;
  background: rgb(52 196 130 / 0.12);
  color: var(--sp-free);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.tab__count.is-full {
  background: rgb(229 72 77 / 0.12);
  color: var(--sp-occupied);
}
</style>
