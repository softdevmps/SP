<script setup lang="ts">
import type { ReservationStage } from '@sp/core'
import { STAGES } from '../stages'

defineProps<{ stage: ReservationStage; detail?: string }>()
</script>

<template>
  <span class="pill" :class="`is-${STAGES[stage].tone}`">
    {{ STAGES[stage].label }}<template v-if="detail"> · {{ detail }}</template>
  </span>
</template>

<style scoped>
.pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--sp-surface-3);
  font-size: 12px;
  font-weight: 600;
  color: var(--sp-text);
  white-space: nowrap;
}

.pill.is-warning {
  background: rgb(226 163 54 / 0.14);
  color: var(--sp-warning);
}

.pill.is-success {
  background: rgb(52 196 130 / 0.12);
  color: var(--sp-free);
}

.pill.is-danger {
  background: rgb(229 72 77 / 0.14);
  color: #f08a8d;
}

.pill.is-muted {
  background: transparent;
  border: 1px solid var(--sp-border-strong);
  color: var(--sp-text-muted);
}
</style>
