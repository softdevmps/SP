<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Check, CheckCheck, Lock, SendHorizontal } from 'lucide-vue-next'
import { formatTime, MESSAGE_MAX_LENGTH, useChatStore } from '@sp/core'
import ChatAvatar from './ChatAvatar.vue'

const props = defineProps<{ conversationId: string; compact?: boolean }>()
defineEmits<{ back: [] }>()

const chat = useChatStore()

const conversation = computed(() => chat.conversations.find((c) => c.id === props.conversationId))
const thread = computed(() => chat.messagesOf(props.conversationId))

const draft = ref('')
const scroller = ref<HTMLElement | null>(null)
const input = ref<HTMLTextAreaElement | null>(null)

const remaining = computed(() => MESSAGE_MAX_LENGTH - draft.value.length)

function scrollToBottom() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

// Mientras la conversación está a la vista (y la pestaña también), lo que llega queda leído.
function markReadIfVisible() {
  if (document.visibilityState === 'visible') chat.markRead(props.conversationId)
}

watch(
  () => props.conversationId,
  () => {
    draft.value = ''
    markReadIfVisible()
    scrollToBottom()
  },
  { immediate: true },
)

watch(
  () => thread.value.length,
  () => {
    markReadIfVisible()
    scrollToBottom()
  },
)

onMounted(() => document.addEventListener('visibilitychange', markReadIfVisible))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', markReadIfVisible))

function send() {
  if (!draft.value.trim()) return
  chat.send(props.conversationId, draft.value)
  draft.value = ''
  input.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  // Enter envía; Shift+Enter hace un salto de línea.
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    send()
  }
}
</script>

<template>
  <div v-if="conversation" class="thread" :class="{ 'is-compact': compact }">
    <header class="thread__header">
      <button v-if="compact" type="button" class="icon-btn" aria-label="Volver" @click="$emit('back')">
        <ArrowLeft :size="18" />
      </button>
      <ChatAvatar :name="conversation.driverName" :size="compact ? 34 : 40" />
      <div class="thread__who">
        <strong>{{ conversation.driverName }}</strong>
        <span>
          <span class="plate">{{ conversation.vehiclePlate }}</span>
          Reserva {{ conversation.reservationCode }}
        </span>
      </div>
      <span v-if="conversation.closed" class="closed-tag"><Lock :size="12" /> Cerrada</span>
    </header>

    <div ref="scroller" class="thread__messages">
      <p class="thread__notice">
        Conversación de la reserva {{ conversation.reservationCode }}. Solo se pueden enviar mensajes de texto.
      </p>
      <div
        v-for="message in thread"
        :key="message.id"
        class="message"
        :class="message.author === 'lot' ? 'is-out' : 'is-in'"
      >
        <p class="message__body">{{ message.body }}</p>
        <span class="message__meta">
          {{ formatTime(message.sentAt) }}
          <template v-if="message.author === 'lot'">
            <CheckCheck v-if="message.readAt" :size="14" class="tick is-read" aria-label="Visto" />
            <Check v-else :size="14" class="tick" aria-label="Enviado" />
          </template>
        </span>
      </div>
    </div>

    <p v-if="conversation.closed" class="thread__closed">
      <Lock :size="14" />
      La reserva finalizó. La conversación queda como historial.
    </p>
    <form v-else class="composer" @submit.prevent="send">
      <textarea
        ref="input"
        v-model="draft"
        rows="1"
        :maxlength="MESSAGE_MAX_LENGTH"
        placeholder="Escribí un mensaje…"
        aria-label="Mensaje"
        @keydown="onKeydown"
      />
      <span v-if="remaining <= 100" class="composer__count">{{ remaining }}</span>
      <button type="submit" class="composer__send" :disabled="!draft.trim()" aria-label="Enviar">
        <SendHorizontal :size="18" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.thread {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.thread__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--sp-border);
}

.thread.is-compact .thread__header {
  padding: 10px 12px;
}

.thread__who {
  flex: 1;
  display: grid;
  min-width: 0;
}

.thread__who > span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.plate {
  padding: 0 6px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--sp-text);
}

.closed-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 999px;
  font-size: 12px;
  color: var(--sp-text-muted);
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

.thread__messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  padding: 16px;
  background: var(--sp-bg);
}

.thread__notice {
  align-self: center;
  max-width: 420px;
  margin: 0 0 10px;
  padding: 6px 12px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface);
  font-size: 12px;
  text-align: center;
  color: var(--sp-text-muted);
}

.message {
  max-width: min(75%, 520px);
  padding: 8px 12px 6px;
  border: 1px solid var(--sp-border);
  border-radius: 12px;
}

.message.is-in {
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  background: var(--sp-surface-2);
}

.message.is-out {
  align-self: flex-end;
  border-color: rgb(155 31 48 / 0.35);
  border-bottom-right-radius: 4px;
  background: rgb(155 31 48 / 0.18);
}

.message__body {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--sp-text-faint);
}

.tick.is-read {
  color: var(--sp-free);
}

.thread__closed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 14px;
  border-top: 1px solid var(--sp-border);
  font-size: 13px;
  color: var(--sp-text-muted);
}

.composer {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid var(--sp-border);
}

.composer textarea {
  flex: 1;
  min-height: 42px;
  max-height: 140px;
  padding: 10px 12px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
  color: var(--sp-text);
  font: inherit;
  resize: none;
  field-sizing: content;
  outline: none;
}

.composer textarea:focus {
  border-color: var(--sp-accent-hover);
  box-shadow: 0 0 0 3px var(--sp-accent-soft);
}

.composer__count {
  position: absolute;
  right: 66px;
  bottom: 18px;
  font-size: 11px;
  color: var(--sp-text-faint);
}

.composer__send {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-accent);
  color: #fff;
  cursor: pointer;
  transition: background var(--sp-duration) var(--sp-ease);
}

.composer__send:hover:not(:disabled) {
  background: var(--sp-accent-hover);
}

.composer__send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
