<script setup lang="ts">
import { ref } from 'vue'
import { CircleAlert, Info, Ticket } from 'lucide-vue-next'
import { formatTime, useOccupancyStore, type Reservation } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

const emit = defineEmits<{ found: [reservation: Reservation] }>()

const occupancy = useOccupancyStore()
const code = ref('')
const message = ref<{ tone: 'error' | 'info'; text: string } | null>(null)

// Si la reserva está pendiente se abre el diálogo de confirmación; si no, se explica por qué no.
function search() {
  const value = code.value.trim().toUpperCase()
  if (!value) return
  const reservation = occupancy.findByCode(value)

  if (!reservation) {
    message.value = { tone: 'error', text: `No hay ninguna reserva con el código ${value} en esta playa.` }
  } else if (reservation.status === 'checked_in') {
    const at = reservation.checkedInAt ? ` a las ${formatTime(reservation.checkedInAt)}` : ''
    message.value = { tone: 'info', text: `La reserva ${value} ya fue validada${at}.` }
  } else if (reservation.status !== 'pending') {
    message.value = { tone: 'info', text: `La reserva ${value} ya no está activa.` }
  } else {
    message.value = null
    code.value = ''
    emit('found', reservation)
  }
}
</script>

<template>
  <PanelCard title="Validar llegada">
    <form class="search" @submit.prevent="search">
      <span class="search__control">
        <Ticket :size="18" class="search__icon" />
        <input
          v-model="code"
          type="text"
          placeholder="Código del ticket, ej. SP-4K7Q"
          autocomplete="off"
          spellcheck="false"
          aria-label="Código del ticket"
          @input="message = null"
        />
      </span>
      <button type="submit" class="button" :disabled="!code.trim()">Buscar</button>
    </form>

    <p v-if="message" class="message" :class="`is-${message.tone}`" role="alert">
      <CircleAlert v-if="message.tone === 'error'" :size="16" />
      <Info v-else :size="16" />
      {{ message.text }}
    </p>
    <p v-else class="hint">Pedile al conductor el código que figura en su ticket de la app.</p>
  </PanelCard>
</template>

<style scoped>
.search {
  display: flex;
  gap: 10px;
}

.search__control {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
  transition:
    border-color var(--sp-duration) var(--sp-ease),
    box-shadow var(--sp-duration) var(--sp-ease);
}

.search__control:focus-within {
  border-color: var(--sp-accent-hover);
  box-shadow: 0 0 0 3px var(--sp-accent-soft);
}

.search__icon {
  position: absolute;
  left: 12px;
  color: var(--sp-text-faint);
  pointer-events: none;
}

.search input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 12px 0 40px;
  border: 0;
  background: transparent;
  color: var(--sp-text);
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 15px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  outline: none;
}

.search input::placeholder {
  font-family: var(--sp-font-body);
  letter-spacing: normal;
  text-transform: none;
  color: var(--sp-text-faint);
}

.button {
  height: 44px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--sp-duration) var(--sp-ease);
}

.button:hover:not(:disabled) {
  background: var(--sp-accent-hover);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint,
.message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0;
  font-size: 13px;
}

.hint {
  font-size: 12px;
  color: var(--sp-text-faint);
}

.message.is-error {
  color: #f08a8d;
}

.message.is-info {
  color: var(--sp-text-muted);
}
</style>
