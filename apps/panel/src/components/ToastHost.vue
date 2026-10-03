<script setup lang="ts">
import { CircleAlert, CircleCheck, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
const icons = { success: CircleCheck, error: CircleAlert, info: Info }
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <button
        v-for="toast in toasts"
        :key="toast.id"
        type="button"
        class="toast"
        :class="`is-${toast.tone}`"
        @click="dismiss(toast.id)"
      >
        <component :is="icons[toast.tone]" :size="18" class="toast__icon" />
        {{ toast.message }}
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  display: grid;
  gap: 10px;
  justify-items: end;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 380px;
  padding: 12px 16px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  color: var(--sp-text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  box-shadow: var(--sp-shadow-lg);
  cursor: pointer;
}

.toast.is-success .toast__icon {
  color: var(--sp-free);
}

.toast.is-error .toast__icon {
  color: var(--sp-occupied);
}

.toast.is-info .toast__icon {
  color: var(--sp-text-muted);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 200ms var(--sp-ease),
    transform 200ms var(--sp-ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
