<script setup lang="ts">
export interface StatTile {
  label: string
  value: string
  detail?: string
  tone?: 'success' | 'warning' | 'danger'
}

defineProps<{ tiles: StatTile[] }>()
</script>

<template>
  <dl class="stats" :style="{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }">
    <div v-for="tile in tiles" :key="tile.label" class="stat" :class="tile.tone && `is-${tile.tone}`">
      <dt>{{ tile.label }}</dt>
      <dd>{{ tile.value }}</dd>
      <span v-if="tile.detail">{{ tile.detail }}</span>
    </div>
  </dl>
</template>

<style scoped>
.stats {
  display: grid;
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
  color: var(--sp-text-muted);
}

.stat dd {
  margin: 6px 0 0;
  font-family: var(--sp-font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat > span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.stat.is-success dd {
  color: var(--sp-free);
}

.stat.is-warning dd {
  color: var(--sp-warning);
}

.stat.is-danger dd {
  color: #f08a8d;
}

@media (max-width: 1000px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
</style>
