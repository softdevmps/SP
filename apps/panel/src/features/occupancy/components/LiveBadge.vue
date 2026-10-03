<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { formatTime, useOccupancyStore } from '@sp/core'

const { lastUpdate } = storeToRefs(useOccupancyStore())
</script>

<template>
  <p class="live">
    <span class="live__dot" aria-hidden="true" />
    En vivo
    <span v-if="lastUpdate" class="live__time">· {{ formatTime(lastUpdate) }}</span>
  </p>
</template>

<style scoped>
.live {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 12px;
  border: 1px solid var(--sp-border);
  border-radius: 999px;
  background: var(--sp-surface);
  font-size: 12px;
  font-weight: 600;
}

.live__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sp-free);
}

.live__time {
  font-weight: 400;
  color: var(--sp-text-muted);
}
</style>
