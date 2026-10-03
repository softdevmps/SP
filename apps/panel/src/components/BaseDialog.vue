<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; size?: 'md' | 'lg' }>(), { size: 'md' })
const open = defineModel<boolean>('open', { default: false })

// <dialog> nativo: ya resuelve foco atrapado, Escape y capa superior.
const dialog = ref<HTMLDialogElement | null>(null)

function sync(value: boolean) {
  const element = dialog.value
  if (!element) return
  if (value && !element.open) element.showModal()
  if (!value && element.open) element.close()
}

watch(open, sync)
onMounted(() => sync(open.value))

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :class="`is-${size}`"
    :aria-label="title"
    @close="open = false"
    @click="onBackdropClick"
  >
    <div class="dialog__panel">
      <header class="dialog__header">
        <h2 class="dialog__title">{{ title }}</h2>
        <button type="button" class="dialog__close" aria-label="Cerrar" @click="open = false">
          <X :size="18" />
        </button>
      </header>
      <div class="dialog__body"><slot /></div>
      <footer v-if="$slots.footer" class="dialog__footer"><slot name="footer" /></footer>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(460px, calc(100vw - 32px));
  padding: 0;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  color: var(--sp-text);
  box-shadow: var(--sp-shadow-lg), var(--sp-inner-highlight);
}

.dialog.is-lg {
  width: min(640px, calc(100vw - 32px));
}

.dialog[open] {
  animation: dialog-in 180ms var(--sp-ease);
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(2px);
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

.dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sp-border);
}

.dialog__title {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 18px;
  font-weight: 600;
}

.dialog__close {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text-muted);
  cursor: pointer;
}

.dialog__close:hover {
  background: var(--sp-surface-2);
  color: var(--sp-text);
}

.dialog__body {
  padding: 20px;
}

.dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--sp-border);
  background: var(--sp-surface-2);
}
</style>
