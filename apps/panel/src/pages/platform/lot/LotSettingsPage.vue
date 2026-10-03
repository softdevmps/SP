<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatMoney, overstayAmount, type LotSettings, type OpeningDay } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'
import { useToast } from '@/composables/useToast'

const { lot, lotSettings, platform } = useAdminLot()
const toast = useToast()

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
/** Se muestran de lunes a domingo. */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Copia editable; se guarda al confirmar. */
const draft = ref<LotSettings | null>(null)

function reset() {
  draft.value = lotSettings.value ? (JSON.parse(JSON.stringify(lotSettings.value)) as LotSettings) : null
}
watch(lotSettings, reset, { immediate: true })

const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(lotSettings.value))

const days = computed(() =>
  DISPLAY_ORDER.map((weekday) => draft.value?.openingHours.find((day) => day.weekday === weekday)).filter(
    (day): day is OpeningDay => !!day,
  ),
)

const errors = computed(() => {
  const value = draft.value
  if (!value || !lot.value) return {}
  // Rangos amplios a propósito: los precios y tiempos todavía se están definiendo.
  const inRange = (number: number, min: number, max: number) =>
    Number.isInteger(number) && number >= min && number <= max
  return {
    reservationPrice: value.reservationTariff.pricePerHour > 0 ? '' : 'Ingresá un precio mayor a 0.',
    minMinutes: inRange(value.reservationTariff.minMinutes, 5, 1440) ? '' : 'Entre 5 y 1440 minutos.',
    stepMinutes: inRange(value.reservationTariff.stepMinutes, 5, 240) ? '' : 'Entre 5 y 240 minutos.',
    overstayPrice: value.overstayTariff.pricePerHour > 0 ? '' : 'Ingresá un precio mayor a 0.',
    fraction: inRange(value.overstayTariff.fractionMinutes, 1, 120) ? '' : 'Entre 1 y 120 minutos.',
  }
})
const isValid = computed(() => Object.values(errors.value).every((error) => !error))

/** Ejemplos para que se vea el efecto de cada valor antes de guardar. */
const examples = computed(() => {
  const value = draft.value
  if (!value || !(value.overstayTariff.fractionMinutes > 0)) return null
  const twoHours = Math.round(value.reservationTariff.pricePerHour * 2)
  return {
    reservation: `2 h de reserva = ${formatMoney(twoHours)}`,
    overstay: [10, 23, 45].map((minutes) => `${minutes} min = ${formatMoney(overstayAmount(minutes, value.overstayTariff))}`),
  }
})

function copyMondayToWeekdays() {
  const monday = draft.value?.openingHours.find((day) => day.weekday === 1)
  if (!monday || !draft.value) return
  for (const day of draft.value.openingHours) {
    if (day.weekday >= 2 && day.weekday <= 5) Object.assign(day, { ...monday, weekday: day.weekday })
  }
}

function closesNextDay(day: OpeningDay) {
  return day.open && !day.allDay && day.to <= day.from
}

function save() {
  if (!lot.value || !draft.value || !isValid.value) return
  platform.saveSettings(lot.value.id, draft.value)
  toast.show('Tarifas y horarios guardados')
}
</script>

<template>
  <div v-if="draft && lot" class="settings">
    <div class="grid">
      <PanelCard title="Reservas desde la app">
        <div class="form-grid">
          <label class="field">
            <span class="field__label">Precio por hora</span>
            <input v-model.number="draft.reservationTariff.pricePerHour" class="input" type="number" min="0" step="100" :aria-invalid="!!errors.reservationPrice" />
            <span v-if="errors.reservationPrice" class="field__error">{{ errors.reservationPrice }}</span>
            <span v-else class="field__hint">{{ examples?.reservation }}. Se paga por adelantado.</span>
          </label>
          <label class="field">
            <span class="field__label">Duración mínima (minutos)</span>
            <input v-model.number="draft.reservationTariff.minMinutes" class="input" type="number" min="5" step="5" :aria-invalid="!!errors.minMinutes" />
            <span v-if="errors.minMinutes" class="field__error">{{ errors.minMinutes }}</span>
          </label>
          <label class="field">
            <span class="field__label">Franjas cada (minutos)</span>
            <input v-model.number="draft.reservationTariff.stepMinutes" class="input" type="number" min="5" step="5" :aria-invalid="!!errors.stepMinutes" />
            <span v-if="errors.stepMinutes" class="field__error">{{ errors.stepMinutes }}</span>
            <span v-else class="field__hint">El conductor elige horarios en saltos de este tamaño.</span>
          </label>
          <p class="field is-wide capacity-note">
            Se puede reservar sobre los lugares <strong>disponibles</strong> de la playa: la reserva es por
            capacidad, no por cochera, y no hay un cupo aparte.
          </p>
        </div>
      </PanelCard>

      <PanelCard title="Excedente (lo cobra el playero)">
        <div class="form-grid">
          <label class="field">
            <span class="field__label">Precio por hora</span>
            <input v-model.number="draft.overstayTariff.pricePerHour" class="input" type="number" min="0" step="100" :aria-invalid="!!errors.overstayPrice" />
            <span v-if="errors.overstayPrice" class="field__error">{{ errors.overstayPrice }}</span>
          </label>
          <label class="field">
            <span class="field__label">Se cobra por fracción de (minutos)</span>
            <input v-model.number="draft.overstayTariff.fractionMinutes" class="input" type="number" min="1" :aria-invalid="!!errors.fraction" />
            <span v-if="errors.fraction" class="field__error">{{ errors.fraction }}</span>
          </label>
        </div>
        <div class="examples">
          <span class="examples__title">Ejemplos de excedente</span>
          <span v-for="example in examples?.overstay" :key="example" class="examples__item">{{ example }}</span>
        </div>
      </PanelCard>
    </div>

    <PanelCard title="Horario de atención">
      <template #actions>
        <button type="button" class="btn btn--sm" @click="copyMondayToWeekdays">Copiar lunes a martes–viernes</button>
      </template>

      <ul class="days">
        <li v-for="day in days" :key="day.weekday" class="day" :class="{ 'is-closed': !day.open }">
          <span class="day__name">{{ WEEKDAYS[day.weekday] }}</span>
          <BaseSwitch v-model="day.open" :label="day.open ? 'Abierto' : 'Cerrado'" />
          <template v-if="day.open">
            <label class="day__all">
              <input v-model="day.allDay" type="checkbox" /> 24 h
            </label>
            <span v-if="!day.allDay" class="day__hours">
              <input v-model="day.from" type="time" class="input input--time" aria-label="Abre" />
              <span>a</span>
              <input v-model="day.to" type="time" class="input input--time" aria-label="Cierra" />
              <span v-if="closesNextDay(day)" class="day__note">cierra al día siguiente</span>
            </span>
          </template>
        </li>
      </ul>
    </PanelCard>

    <div class="savebar">
      <span v-if="isDirty" class="savebar__note">Hay cambios sin guardar.</span>
      <button type="button" class="btn" :disabled="!isDirty" @click="reset">Descartar cambios</button>
      <button type="button" class="btn btn--primary" :disabled="!isDirty || !isValid" @click="save">Guardar cambios</button>
    </div>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  gap: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.capacity-note {
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.capacity-note strong {
  color: var(--sp-text);
}

.examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--sp-border);
  font-size: 13px;
}

.examples__title {
  color: var(--sp-text-muted);
}

.examples__item {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--sp-surface-3);
  font-variant-numeric: tabular-nums;
}

.days {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.day {
  display: grid;
  grid-template-columns: 110px 140px 70px 1fr;
  align-items: center;
  gap: 16px;
  min-height: 52px;
  border-top: 1px solid var(--sp-border);
}

.day:first-child {
  border-top: 0;
}

.day.is-closed .day__name {
  color: var(--sp-text-muted);
}

.day__name {
  font-weight: 600;
}

.day__all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--sp-text-muted);
  cursor: pointer;
}

.day__all input {
  accent-color: var(--sp-accent-hover);
}

.day__hours {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--sp-text-muted);
}

.input--time {
  width: 120px;
  height: 36px;
}

.day__note {
  font-size: 12px;
  color: var(--sp-warning);
}

.savebar {
  position: sticky;
  bottom: 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius);
  background: rgb(18 17 19 / 0.95);
  backdrop-filter: blur(8px);
  box-shadow: var(--sp-shadow-lg);
}

.savebar__note {
  margin-right: auto;
  font-size: 13px;
  color: var(--sp-warning);
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .day {
    grid-template-columns: 1fr auto;
    padding-block: 10px;
  }

  .day__hours {
    grid-column: 1 / -1;
  }
}
</style>
