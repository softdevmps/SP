<script setup lang="ts">
import { computed, ref } from 'vue'

export interface BarItem {
  /** Texto del eje (puede ir vacío para no saturar). */
  label: string
  /** Texto completo para el tooltip. */
  title: string
  value: number
  highlight?: boolean
}

// Gráfico de barras de una sola serie (sin leyenda: el título de la tarjeta la nombra).
// Valor al pasar el mouse; la barra destacada (p. ej. "ahora") va en el color de acento.
const props = withDefaults(
  defineProps<{ items: BarItem[]; format?: (value: number) => string; height?: number; max?: number }>(),
  { format: (value: number) => String(value), height: 180 },
)

const scaleMax = computed(() => props.max ?? Math.max(1, ...props.items.map((item) => item.value)))
const hovered = ref<number | null>(null)
</script>

<template>
  <div class="chart-wrap">
    <div class="chart" :style="{ height: `${height}px`, gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="column"
        tabindex="0"
        :aria-label="`${item.title}: ${format(item.value)}`"
        @mouseenter="hovered = index"
        @mouseleave="hovered = null"
        @focusin="hovered = index"
        @focusout="hovered = null"
      >
        <span v-if="hovered === index" class="tooltip">
          <strong>{{ format(item.value) }}</strong>
          <span>{{ item.title }}</span>
        </span>
        <span
          class="bar"
          :class="{ 'is-highlight': item.highlight, 'is-hovered': hovered === index }"
          :style="{ height: `${(item.value / scaleMax) * 100}%` }"
        />
      </div>
    </div>
    <div class="axis" :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }">
      <span v-for="(item, index) in items" :key="index" :class="{ 'is-highlight': item.highlight }">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart {
  display: grid;
  gap: 2px;
  padding-top: 40px;
  border-bottom: 1px solid var(--sp-border-strong);
}

.column {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  outline: none;
}

.bar {
  width: min(24px, 72%);
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: var(--sp-text-faint);
  transition:
    height 400ms var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.bar.is-highlight {
  background: var(--sp-accent-hover);
}

.bar.is-hovered {
  background: var(--sp-text-muted);
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  z-index: 2;
  display: grid;
  justify-items: center;
  padding: 6px 10px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  box-shadow: var(--sp-shadow);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

.tooltip span {
  color: var(--sp-text-muted);
}

.axis {
  display: grid;
  gap: 2px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--sp-text-faint);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.axis .is-highlight {
  color: var(--sp-text);
  font-weight: 600;
}
</style>
