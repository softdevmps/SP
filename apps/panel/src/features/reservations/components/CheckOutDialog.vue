<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
  calculateOverstay,
  formatDuration,
  formatMoney,
  formatTime,
  useOccupancyStore,
  type Reservation,
} from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ reservation: Reservation | null }>()
const open = defineModel<boolean>('open', { default: false })

const occupancy = useOccupancyStore()
const { lot, now } = storeToRefs(occupancy)
const toast = useToast()

// La salida se toma en el momento de confirmar; mientras el diálogo está abierto se muestra "ahora".
const charge = computed(() =>
  props.reservation && lot.value
    ? calculateOverstay(props.reservation, now.value, lot.value.overstayTariff)
    : { minutes: 0, amount: 0 },
)

const tariffLabel = computed(() => {
  const tariff = lot.value?.overstayTariff
  if (!tariff) return ''
  return `${formatMoney(tariff.pricePerHour)} por hora · fracción de ${tariff.fractionMinutes} min`
})

function confirm() {
  if (!props.reservation) return
  occupancy.checkOut(props.reservation.id)
  const charged = props.reservation.overstay?.amount ?? 0
  toast.show(
    charged > 0
      ? `Salida registrada · ${props.reservation.vehiclePlate} · cobrado ${formatMoney(charged)}`
      : `Salida registrada · ${props.reservation.vehiclePlate} · sin excedente`,
  )
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Registrar salida">
    <template v-if="reservation">
      <div class="who">
        <strong>{{ reservation.driverName }}</strong>
        <span class="plate">{{ reservation.vehiclePlate }}</span>
        <span class="mono">{{ reservation.code }}</span>
      </div>

      <dl class="times">
        <div>
          <dt>Entrada</dt>
          <dd>{{ reservation.checkedInAt ? formatTime(reservation.checkedInAt) : '—' }}</dd>
        </div>
        <div>
          <dt>Fin de la franja reservada</dt>
          <dd>{{ formatTime(reservation.endsAt) }}</dd>
        </div>
        <div>
          <dt>Salida</dt>
          <dd>{{ formatTime(new Date(now)) }} <small>(ahora)</small></dd>
        </div>
        <div>
          <dt>Tiempo excedido</dt>
          <dd :class="{ 'is-over': charge.minutes > 0 }">
            {{ charge.minutes > 0 ? formatDuration(charge.minutes) : 'Sin excedente' }}
          </dd>
        </div>
      </dl>

      <div class="total" :class="{ 'is-zero': charge.amount === 0 }">
        <span>Total a cobrar</span>
        <strong>{{ formatMoney(charge.amount) }}</strong>
        <small v-if="charge.amount > 0">{{ tariffLabel }}</small>
        <small v-else>Salió dentro de su franja. No hay nada que cobrar.</small>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="button" class="btn btn--primary" autofocus @click="confirm">
        {{ charge.amount > 0 ? 'Cobrado · registrar salida' : 'Registrar salida' }}
      </button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.who {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.who strong {
  font-size: 16px;
}

.plate {
  padding: 2px 7px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.times {
  display: grid;
  gap: 10px;
  margin: 0;
}

.times div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.times dt {
  color: var(--sp-text-muted);
}

.times dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.times small {
  font-weight: 400;
  color: var(--sp-text-faint);
}

.times .is-over {
  color: #f08a8d;
}

.total {
  display: grid;
  justify-items: center;
  gap: 2px;
  margin-top: 18px;
  padding: 16px;
  border: 1px solid rgb(229 72 77 / 0.35);
  border-radius: var(--sp-radius-sm);
  background: rgb(229 72 77 / 0.08);
  text-align: center;
}

.total span {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-text-muted);
}

.total strong {
  font-family: var(--sp-font-display);
  font-size: 34px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.total small {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.total.is-zero {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
}
</style>
