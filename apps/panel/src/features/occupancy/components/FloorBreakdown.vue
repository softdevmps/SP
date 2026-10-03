<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ChevronRight } from 'lucide-vue-next'
import { useOccupancyStore, type FloorOccupancy } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

defineEmits<{ open: [floorId: string] }>()

const { floors } = storeToRefs(useOccupancyStore())

function percent(floor: FloorOccupancy, value: number) {
  return floor.total ? (value / floor.total) * 100 : 0
}
</script>

<template>
  <PanelCard title="Por piso">
    <ul class="floors">
      <li v-for="floor in floors" :key="floor.floorId">
        <button type="button" class="floor" @click="$emit('open', floor.floorId)">
          <span class="floor__name">{{ floor.name }}</span>

          <span class="floor__free" :class="{ 'is-full': floor.free === 0 }">
            <strong>{{ floor.free }}</strong> libres
          </span>

          <span class="floor__bar" aria-hidden="true">
            <span class="is-free" :style="{ width: `${percent(floor, floor.free)}%` }" />
            <span class="is-occupied" :style="{ width: `${percent(floor, floor.occupied)}%` }" />
            <span
              v-if="floor.faults"
              class="is-fault"
              :style="{ width: `${percent(floor, floor.faults)}%` }"
            />
          </span>

          <span class="floor__meta">
            {{ Math.round(percent(floor, floor.occupied)) }}% ocupado
            <template v-if="floor.faults"> · {{ floor.faults }} con falla</template>
          </span>

          <ChevronRight :size="16" class="floor__chevron" />
        </button>
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
.floors {
  flex: 1;
  display: grid;
  grid-auto-rows: 1fr;
  margin: 0;
  padding: 0;
  list-style: none;
}

.floor {
  width: 100%;
  display: grid;
  grid-template-columns: 80px 110px 1fr 170px 16px;
  align-items: center;
  gap: 16px;
  height: 100%;
  padding: 14px 6px;
  border: 0;
  border-top: 1px solid var(--sp-border);
  background: none;
  color: var(--sp-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--sp-duration) var(--sp-ease);
}

li:first-child .floor {
  border-top: 0;
}

.floor:hover {
  background: var(--sp-surface-2);
}

.floor__name {
  font-weight: 600;
}

.floor__free {
  color: var(--sp-text-muted);
  font-size: 13px;
}

.floor__free strong {
  margin-right: 2px;
  font-family: var(--sp-font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--sp-free);
  font-variant-numeric: tabular-nums;
}

.floor__free.is-full strong {
  color: var(--sp-occupied);
}

.floor__bar {
  display: flex;
  gap: 2px;
  height: 8px;
  overflow: hidden;
  border-radius: 4px;
}

.floor__bar span {
  height: 100%;
  transition: width 400ms var(--sp-ease);
}

.floor__bar .is-free {
  background: var(--sp-free);
}

.floor__bar .is-occupied {
  background: var(--sp-occupied);
}

.floor__bar .is-fault {
  background: repeating-linear-gradient(45deg, var(--sp-text-faint) 0 3px, transparent 3px 6px);
}

.floor__meta {
  font-size: 12px;
  color: var(--sp-text-muted);
  text-align: right;
}

.floor__chevron {
  color: var(--sp-text-faint);
}

@media (max-width: 720px) {
  .floor {
    grid-template-columns: 1fr auto;
  }

  .floor__bar {
    grid-column: 1 / -1;
  }

  .floor__meta {
    text-align: left;
  }

  .floor__chevron {
    display: none;
  }
}
</style>
