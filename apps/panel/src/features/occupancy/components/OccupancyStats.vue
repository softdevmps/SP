<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOccupancyStore } from '@sp/core'

const { available, availabilityLevel, totals, awaitingArrival } = storeToRefs(useOccupancyStore())
</script>

<template>
  <dl class="stats">
    <div class="stat stat--primary" :class="`is-${availabilityLevel}`">
      <dt>Disponibles para ingresar</dt>
      <dd>{{ available }}</dd>
    </div>
    <div class="stat">
      <dt>Libres según sensores</dt>
      <dd>{{ totals.free }}<small> / {{ totals.total }}</small></dd>
    </div>
    <div class="stat">
      <dt>Reservas esperando llegada</dt>
      <dd>{{ awaitingArrival.length }}</dd>
    </div>
    <div class="stat" :class="{ 'is-warning': totals.faults > 0 }">
      <dt>Sensores con falla</dt>
      <dd>{{ totals.faults }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.stat {
  padding: 16px 18px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.stat dt {
  font-size: 12px;
  font-weight: 500;
  color: var(--sp-text-muted);
}

.stat dd {
  margin: 6px 0 0;
  font-family: var(--sp-font-display);
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat dd small {
  font-family: var(--sp-font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--sp-text-faint);
}

.stat--primary {
  --level-color: var(--sp-free);
  border-left: 3px solid var(--level-color);
}

.stat--primary dd {
  color: var(--level-color);
}

.stat--primary.is-low {
  --level-color: var(--sp-warning);
}

.stat--primary.is-full {
  --level-color: var(--sp-occupied);
}

.stat.is-warning dd {
  color: var(--sp-warning);
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
