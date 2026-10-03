<script setup lang="ts" generic="K extends string">
export interface TableTab<Key extends string> {
  key: Key
  label: string
  count: number
  tone?: 'warning' | 'success' | 'danger'
}

defineProps<{ tabs: TableTab<K>[]; label: string }>()
const active = defineModel<K>({ required: true })
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="label">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      class="tab"
      :class="[{ 'is-active': active === tab.key }, tab.tone && `is-${tab.tone}`]"
      :aria-selected="active === tab.key"
      @click="active = tab.key"
    >
      {{ tab.label }}
      <span class="tab__count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.tab:hover {
  color: var(--sp-text);
}

.tab.is-active {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
  color: var(--sp-text);
  box-shadow: var(--sp-shadow-sm);
}

.tab__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--sp-surface-3);
  font-size: 11px;
  text-align: center;
  color: var(--sp-text-muted);
  font-variant-numeric: tabular-nums;
}

.tab.is-warning .tab__count {
  background: rgb(226 163 54 / 0.14);
  color: var(--sp-warning);
}

.tab.is-success .tab__count {
  background: rgb(52 196 130 / 0.12);
  color: var(--sp-free);
}

.tab.is-danger .tab__count {
  background: rgb(229 72 77 / 0.14);
  color: #f08a8d;
}
</style>
