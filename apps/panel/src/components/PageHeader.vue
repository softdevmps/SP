<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <header class="page-header">
    <div>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header__title {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.page-header__subtitle {
  margin: 4px 0 0;
  color: var(--sp-text-muted);
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
