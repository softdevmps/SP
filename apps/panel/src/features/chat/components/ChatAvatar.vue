<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ name: string; size?: number }>()

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
</script>

<template>
  <span class="avatar" :style="{ width: `${size ?? 40}px`, height: `${size ?? 40}px` }">
    {{ initials }}
  </span>
</template>

<style scoped>
.avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--sp-border-strong);
  border-radius: 50%;
  background: var(--sp-surface-3);
  color: var(--sp-text-muted);
  font-size: 13px;
  font-weight: 700;
}
</style>
