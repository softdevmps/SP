<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './parts/AppHeader.vue'
import AppSidebar from './parts/AppSidebar.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useSidebar } from './composables/useSidebar'

const { isOpen, isDesktop, toggle, closeOverlay } = useSidebar()
const route = useRoute()

// En modo drawer, navegar o apretar Escape cierra el sidebar.
watch(() => route.fullPath, closeOverlay)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeOverlay()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="panel" :class="{ 'is-pushed': isOpen && isDesktop }">
    <AppHeader :sidebar-open="isOpen" @toggle-sidebar="toggle" />
    <AppSidebar :open="isOpen" />

    <Transition name="backdrop">
      <div v-if="isOpen && !isDesktop" class="panel__backdrop" @click="closeOverlay" />
    </Transition>

    <main class="panel__content">
      <RouterView />
    </main>

    <ToastHost />
  </div>
</template>

<style scoped>
.panel {
  --header-h: 60px;
  --sidebar-w: 248px;
  min-height: 100vh;
  background:
    radial-gradient(900px 500px at 0% 0%, rgb(155 31 48 / 0.08), transparent 60%),
    radial-gradient(800px 600px at 100% 100%, rgb(110 20 33 / 0.06), transparent 60%),
    var(--sp-bg);
}

.panel__content {
  padding: calc(var(--header-h) + 28px) 32px 32px;
  transition: margin-left var(--sp-duration) var(--sp-ease);
}

.panel.is-pushed .panel__content {
  margin-left: var(--sidebar-w);
}

.panel__backdrop {
  position: fixed;
  inset: var(--header-h) 0 0 0;
  z-index: 30;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(2px);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity var(--sp-duration) var(--sp-ease);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .panel__content {
    padding-inline: 16px;
  }
}
</style>
