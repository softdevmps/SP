<script setup lang="ts">
defineProps<{ label: string }>()
const checked = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="switch">
    <input v-model="checked" type="checkbox" role="switch" class="switch__input" />
    <span class="switch__track" aria-hidden="true"><span class="switch__thumb" /></span>
    <span class="switch__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--sp-text-muted);
  cursor: pointer;
  user-select: none;
}

.switch__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch__track {
  position: relative;
  width: 34px;
  height: 20px;
  flex-shrink: 0;
  border: 1px solid var(--sp-border-strong);
  border-radius: 999px;
  background: var(--sp-surface-3);
  transition:
    background var(--sp-duration) var(--sp-ease),
    border-color var(--sp-duration) var(--sp-ease);
}

.switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--sp-text-muted);
  transition:
    transform var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.switch__input:checked + .switch__track {
  border-color: rgb(52 196 130 / 0.5);
  background: rgb(52 196 130 / 0.25);
}

.switch__input:checked + .switch__track .switch__thumb {
  transform: translateX(14px);
  background: var(--sp-free);
}

.switch__input:checked ~ .switch__label {
  color: var(--sp-text);
}

.switch__input:focus-visible + .switch__track {
  outline: 2px solid var(--sp-accent-hover);
  outline-offset: 2px;
}
</style>
