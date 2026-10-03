<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useOccupancyStore } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

const { available, availabilityLevel, totals, awaitingArrival } = storeToRefs(useOccupancyStore())

const levelLabel = computed(
  () =>
    ({ full: 'Playa completa', low: 'Quedan pocos lugares', ok: 'Hay lugar' })[
      availabilityLevel.value
    ],
)

// Cómo se reparte la playa ahora mismo; las partes suman el total de cocheras.
const segments = computed(() => {
  const reserved = Math.min(awaitingArrival.value.length, totals.value.free)
  return [
    { key: 'available', label: 'Disponibles', value: available.value },
    { key: 'reserved', label: 'Reservadas sin llegar', value: reserved },
    { key: 'occupied', label: 'Ocupadas', value: totals.value.occupied },
    { key: 'fault', label: 'Con falla', value: totals.value.faults },
  ]
})

function percent(value: number) {
  return totals.value.total ? (value / totals.value.total) * 100 : 0
}
</script>

<template>
  <PanelCard title="Disponibles para ingresar" class="hero" :class="`is-${availabilityLevel}`">
    <div class="hero__body">
      <div class="hero__headline">
        <p class="hero__number">{{ available }}</p>
        <div>
          <p class="hero__level">{{ levelLabel }}</p>
          <p class="hero__total">de {{ totals.total }} cocheras</p>
        </div>
      </div>

      <div class="bar" role="img" :aria-label="segments.map((s) => `${s.label}: ${s.value}`).join(', ')">
        <span
          v-for="segment in segments"
          v-show="segment.value > 0"
          :key="segment.key"
          class="bar__segment"
          :class="`is-${segment.key}`"
          :style="{ width: `${percent(segment.value)}%` }"
          :title="`${segment.label}: ${segment.value}`"
        />
      </div>

      <ul class="legend">
        <li v-for="segment in segments" :key="segment.key">
          <span class="swatch" :class="`is-${segment.key}`" />
          <span class="legend__label">{{ segment.label }}</span>
          <strong>{{ segment.value }}</strong>
        </li>
      </ul>
    </div>
  </PanelCard>
</template>

<style scoped>
/* La franja de color se dibuja por dentro para no correr el contenido respecto de la tarjeta vecina */
.hero {
  --level-color: var(--sp-free);
  box-shadow: inset 0 3px 0 var(--level-color), var(--sp-shadow);
}

.hero__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero.is-low {
  --level-color: var(--sp-warning);
}

.hero.is-full {
  --level-color: var(--sp-occupied);
}

.hero__headline {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
}

.hero__number {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 72px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.hero__level {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
  color: var(--level-color);
}

.hero__total {
  margin: 2px 0 0;
  color: var(--sp-text-muted);
}

/* Barra apilada: separación de 2px entre partes y extremos redondeados */
.bar {
  display: flex;
  gap: 2px;
  height: 12px;
  overflow: hidden;
  border-radius: 4px;
}

.bar__segment {
  height: 100%;
  transition: width 400ms var(--sp-ease);
}

.is-available {
  background: var(--sp-free);
}

.is-reserved {
  background: var(--sp-warning);
}

.is-occupied {
  background: var(--sp-occupied);
}

.is-fault {
  background: repeating-linear-gradient(
    45deg,
    var(--sp-text-faint) 0 3px,
    transparent 3px 6px
  );
}

.legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend__label {
  flex: 1;
  color: var(--sp-text-muted);
}

.legend strong {
  font-variant-numeric: tabular-nums;
}

.swatch {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 3px;
}
</style>
