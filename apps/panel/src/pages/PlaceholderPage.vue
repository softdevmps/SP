<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Hammer } from 'lucide-vue-next'

const route = useRoute()
const title = computed(() => route.meta.title ?? '')
</script>

<template>
  <section>
    <h1 class="page-title">{{ title }}</h1>
    <div class="placeholder">
      <span class="placeholder__icon"><Hammer :size="22" /></span>
      <p class="placeholder__title">Sección en construcción</p>
      <p class="placeholder__text">Muy pronto vas a poder gestionar esto desde acá.</p>
    </div>
  </section>
</template>

<style scoped>
.page-title {
  margin: 0 0 22px;
  font-family: var(--sp-font-display);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.placeholder {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 56px 24px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  background: var(--sp-gradient-surface), var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
  text-align: center;
}

.placeholder__icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  border-radius: 14px;
  background: var(--sp-accent-soft);
  border: 1px solid rgb(110 20 33 / 0.3);
  color: var(--sp-accent-hover);
  box-shadow: var(--sp-glow-accent);
}

.placeholder__title {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
}

.placeholder__text {
  margin: 0;
  color: var(--sp-text-muted);
}
</style>
