<script setup lang="ts">
import UserMenu from './UserMenu.vue'

defineProps<{ sidebarOpen: boolean }>()
defineEmits<{ toggleSidebar: [] }>()
</script>

<template>
  <header class="header">
    <button
      type="button"
      class="burger"
      :class="{ 'is-open': sidebarOpen }"
      :aria-expanded="sidebarOpen"
      aria-controls="app-sidebar"
      :aria-label="sidebarOpen ? 'Cerrar menú' : 'Abrir menú'"
      @click="$emit('toggleSidebar')"
    >
      <span class="burger__line" />
      <span class="burger__line" />
      <span class="burger__line" />
    </button>

    <RouterLink to="/" class="brand">
      <span class="brand__badge">SP</span>
      <span class="brand__name">Smart Parking</span>
    </RouterLink>

    <div class="header__actions">
      <UserMenu />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  background: rgb(10 9 10 / 0.72);
  backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid var(--sp-border);
  box-shadow: 0 10px 30px -18px rgb(0 0 0 / 0.9);
}

/* Filo de color bajo el header */
.header::after {
  content: '';
  position: absolute;
  inset: auto 0 -1px 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(155 31 48 / 0.7) 18%,
    rgb(110 20 33 / 0.5) 45%,
    transparent 75%
  );
}

.burger {
  width: 42px;
  height: 42px;
  display: grid;
  place-content: center;
  gap: 5px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface-2);
  box-shadow: var(--sp-inner-highlight);
  cursor: pointer;
  transition:
    background var(--sp-duration) var(--sp-ease),
    border-color var(--sp-duration) var(--sp-ease),
    box-shadow var(--sp-duration) var(--sp-ease);
}

.burger:hover {
  background: var(--sp-surface-3);
  border-color: var(--sp-border-strong);
}

.burger.is-open {
  border-color: rgb(155 31 48 / 0.5);
  box-shadow: 0 0 18px -4px rgb(155 31 48 / 0.6), var(--sp-inner-highlight);
}

.burger__line {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--sp-text);
  transition:
    transform var(--sp-duration) var(--sp-ease),
    opacity var(--sp-duration) var(--sp-ease);
}

.burger.is-open .burger__line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.burger.is-open .burger__line:nth-child(2) {
  opacity: 0;
}

.burger.is-open .burger__line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand__badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--sp-gradient-accent);
  color: #fff;
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 0 20px -4px rgb(155 31 48 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.25);
}

.brand__name {
  font-family: var(--sp-font-display);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 0.01em;
}

.header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 480px) {
  .brand__name {
    display: none;
  }
}
</style>
