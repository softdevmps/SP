<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { CircleAlert, Info, Ticket } from 'lucide-vue-next'
import { formatTime, reservationStage, useOccupancyStore, type Reservation } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

const props = withDefaults(defineProps<{ title?: string; allowExit?: boolean }>(), {
  title: 'Buscar ticket',
  allowExit: false,
})

const emit = defineEmits<{
  arrival: [reservation: Reservation]
  exit: [reservation: Reservation]
}>()

const occupancy = useOccupancyStore()
const { now } = storeToRefs(occupancy)
const code = ref('')
const message = ref<{ tone: 'error' | 'info'; text: string } | null>(null)

// Según en qué etapa está la reserva se abre la llegada, la salida o se explica por qué no.
function search() {
  const value = code.value.trim().toUpperCase()
  if (!value) return
  const reservation = occupancy.findByCode(value)
  message.value = null

  if (!reservation) {
    message.value = { tone: 'error', text: `No hay ninguna reserva con el código ${value} en esta playa.` }
    return
  }

  const stage = reservationStage(reservation, now.value)
  if (stage === 'upcoming' || stage === 'waiting') {
    emit('arrival', reservation)
  } else if ((stage === 'parked' || stage === 'overstay') && props.allowExit) {
    emit('exit', reservation)
  } else if (stage === 'parked' || stage === 'overstay') {
    const at = reservation.checkedInAt ? ` a las ${formatTime(reservation.checkedInAt)}` : ''
    message.value = { tone: 'info', text: `La reserva ${value} ya fue validada${at}.` }
    return
  } else if (stage === 'completed') {
    const at = reservation.checkedOutAt ? ` a las ${formatTime(reservation.checkedOutAt)}` : ''
    message.value = { tone: 'info', text: `La reserva ${value} ya registró su salida${at}.` }
    return
  } else {
    message.value = {
      tone: 'info',
      text: `La reserva ${value} terminó a las ${formatTime(reservation.endsAt)} sin que el conductor se presentara.`,
    }
    return
  }
  code.value = ''
}
</script>

<template>
  <PanelCard :title="title">
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
    <p v-else class="hint">
      <template v-if="allowExit">
        Al llegar se valida la reserva; si el auto ya está en la playa, se registra la salida.
      </template>
      <template v-else>Pedile al conductor el código que figura en su ticket de la app.</template>
    </p>
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
