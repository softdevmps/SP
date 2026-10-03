<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Maximize2, MessageCircle, Volume2, VolumeX, X } from 'lucide-vue-next'
import { useChatStore } from '@sp/core'
import ConversationList from './ConversationList.vue'
import ChatThread from './ChatThread.vue'
import { useChatSound } from '../composables/useChatSound'

const chat = useChatStore()
const { totalUnread, lastIncoming } = storeToRefs(chat)
const { muted } = useChatSound()

const open = ref(false)
const activeId = ref<string | null>(null)
const bump = ref(false)
const root = ref<HTMLElement | null>(null)

// Cada mensaje nuevo hace "saltar" el ícono para que se note aunque el panel esté cerrado.
watch(lastIncoming, () => {
  bump.value = false
  requestAnimationFrame(() => (bump.value = true))
})

function close() {
  open.value = false
}

// Se mira el recorrido del clic y no el elemento: al elegir una conversación la lista se
// reemplaza por el hilo antes de que el clic llegue acá, y el elemento ya no está en el panel.
function onDocumentClick(event: MouseEvent) {
  if (root.value && !event.composedPath().includes(root.value)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="header-chat">
    <button
      type="button"
      class="trigger"
      :class="{ 'is-bump': bump, 'is-open': open }"
      :aria-label="totalUnread ? `Mensajes, ${totalUnread} sin leer` : 'Mensajes'"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
      @animationend="bump = false"
    >
      <MessageCircle :size="19" />
      <span v-if="totalUnread" class="trigger__badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
    </button>

    <Transition name="pop">
      <section v-if="open" class="panel" role="dialog" aria-label="Mensajes">
        <ChatThread v-if="activeId" :conversation-id="activeId" compact @back="activeId = null" />
        <template v-else>
          <header class="panel__header">
            <strong>Mensajes</strong>
            <div class="panel__actions">
              <button
                type="button"
                class="icon-btn"
                :aria-label="muted ? 'Activar sonido' : 'Silenciar sonido'"
                :title="muted ? 'Activar sonido' : 'Silenciar sonido'"
                @click="muted = !muted"
              >
                <VolumeX v-if="muted" :size="17" />
                <Volume2 v-else :size="17" />
              </button>
              <RouterLink
                to="/mensajes"
                class="icon-btn"
                title="Abrir en Mensajes"
                aria-label="Abrir en Mensajes"
                @click="close"
              >
                <Maximize2 :size="16" />
              </RouterLink>
              <button type="button" class="icon-btn" aria-label="Cerrar" @click="close">
                <X :size="18" />
              </button>
            </div>
          </header>
          <ConversationList class="panel__list" @select="activeId = $event" />
        </template>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.header-chat {
  position: relative;
}

.trigger {
  position: relative;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--sp-border);
  border-radius: 50%;
  background: var(--sp-surface-2);
  color: var(--sp-text-muted);
  box-shadow: var(--sp-inner-highlight);
  cursor: pointer;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease),
    border-color var(--sp-duration) var(--sp-ease);
}

.trigger:hover,
.trigger.is-open {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-3);
  color: var(--sp-text);
}

.trigger.is-bump {
  animation: bump 500ms var(--sp-ease);
}

@keyframes bump {
  30% {
    transform: scale(1.15);
  }
  60% {
    transform: scale(0.95);
  }
}

.trigger__badge {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  border: 2px solid var(--sp-bg);
  border-radius: 999px;
  background: var(--sp-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(380px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 100px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow-lg);
  transform-origin: top right;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px 16px;
  border-bottom: 1px solid var(--sp-border);
}

.panel__header strong {
  font-family: var(--sp-font-display);
  font-size: 17px;
  font-weight: 600;
}

.panel__actions {
  display: flex;
  gap: 2px;
}

.panel__list {
  flex: 1;
  min-height: 0;
}

.icon-btn {
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

.icon-btn:hover {
  background: var(--sp-surface-2);
  color: var(--sp-text);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 160ms var(--sp-ease),
    transform 160ms var(--sp-ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

@media (max-width: 480px) {
  .panel {
    position: fixed;
    top: calc(var(--header-h) + 8px);
    right: 16px;
  }
}
</style>
