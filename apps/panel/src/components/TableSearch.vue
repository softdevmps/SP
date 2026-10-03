<script setup lang="ts">
import { Search } from 'lucide-vue-next'

withDefaults(defineProps<{ placeholder?: string }>(), {
  placeholder: 'Buscar nombre, patente o código',
})
const term = defineModel<string>({ default: '' })
</script>

<template>
  <label class="search">
    <Search :size="16" class="search__icon" />
    <input v-model="term" type="search" :placeholder="placeholder" :aria-label="placeholder" />
  </label>
</template>

<style scoped>
.search {
  position: relative;
  display: flex;
  align-items: center;
}

.search__icon {
  position: absolute;
  left: 10px;
  color: var(--sp-text-faint);
  pointer-events: none;
}

.search input {
  width: 240px;
  height: 34px;
  padding: 0 10px 0 32px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
  color: var(--sp-text);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.search input:focus {
  border-color: var(--sp-accent-hover);
  box-shadow: 0 0 0 3px var(--sp-accent-soft);
}

@media (max-width: 720px) {
  .search,
  .search input {
    width: 100%;
  }
}
</style>
