<script setup lang="ts" generic="V extends string | number">
defineProps<{ options: Array<{ value: V; label: string }>; label: string }>()
const model = defineModel<V>({ required: true })
</script>

<template>
  <div class="segmented" role="radiogroup" :aria-label="label">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      class="segment"
      :class="{ 'is-active': model === option.value }"
      :aria-checked="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
}

.segment {
  height: 30px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.segment:hover {
  color: var(--sp-text);
}

.segment.is-active {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
  color: var(--sp-text);
}
</style>
