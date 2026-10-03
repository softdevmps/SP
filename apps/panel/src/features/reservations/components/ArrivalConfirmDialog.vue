<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Info } from 'lucide-vue-next'
import {
  formatDuration,
  formatTime,
  minutesUntil,
  useOccupancyStore,
  type Reservation,
} from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ reservation: Reservation | null }>()
const open = defineModel<boolean>('open', { default: false })

const occupancy = useOccupancyStore()
const { now } = storeToRefs(occupancy)
const toast = useToast()

const startsIn = computed(() =>
  props.reservation ? minutesUntil(props.reservation.startsAt, now.value) : 0,
)

function confirm() {
  if (!props.reservation) return
  occupancy.checkIn(props.reservation.id)
  toast.show(`Llegada validada · ${props.reservation.driverName} · ${props.reservation.vehiclePlate}`)
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Confirmar llegada">
    <template v-if="reservation">
      <p class="lead">Verificá que el código coincida con el ticket del conductor.</p>

      <div class="code">{{ reservation.code }}</div>

      <dl class="data">
        <div>
          <dt>Conductor</dt>
          <dd>{{ reservation.driverName }}</dd>
        </div>
        <div>
          <dt>Patente</dt>
          <dd class="plate">{{ reservation.vehiclePlate }}</dd>
        </div>
        <div>
          <dt>Franja reservada</dt>
          <dd>{{ formatTime(reservation.startsAt) }} – {{ formatTime(reservation.endsAt) }}</dd>
        </div>
      </dl>

      <p v-if="startsIn > 0" class="note">
        <Info :size="16" />
        Llega {{ formatDuration(startsIn) }} antes de su franja.
      </p>
    </template>

    <template #footer>
      <button type="button" class="button" @click="open = false">Cancelar</button>
      <button type="button" class="button button--primary" autofocus @click="confirm">
        Confirmar llegada
      </button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lead {
  margin: 0 0 16px;
  color: var(--sp-text-muted);
}

.code {
  margin-bottom: 18px;
  padding: 14px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-align: center;
}

.data {
  display: grid;
  gap: 12px;
  margin: 0;
}

.data div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.data dt {
  color: var(--sp-text-muted);
}

.data dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.plate {
  letter-spacing: 0.04em;
}

.note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  padding: 10px 12px;
  border-radius: var(--sp-radius-sm);
  background: rgb(226 163 54 / 0.1);
  color: var(--sp-warning);
  font-size: 13px;
}

.button {
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface);
  color: var(--sp-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--sp-duration) var(--sp-ease);
}

.button:hover {
  background: var(--sp-surface-3);
}

.button--primary {
  border-color: rgb(255 255 255 / 0.08);
  background: var(--sp-accent);
  color: #fff;
}

.button--primary:hover {
  background: var(--sp-accent-hover);
}
</style>
