<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { CircleCheck, CircleX, LoaderCircle, TriangleAlert } from 'lucide-vue-next'
import {
  formatTime,
  useHardwareStore,
  type Sensor,
  type SensorCommandPayload,
  type SensorCommandType,
} from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'
import { COMMAND_LABELS } from '../labels'

const props = defineProps<{ sensor: Sensor | null; spaceLabel: string }>()
const open = defineModel<boolean>('open', { default: false })

const hardware = useHardwareStore()
const { commands } = storeToRefs(hardware)
const toast = useToast()

const OPTIONS: Array<{ type: SensorCommandType; description: string; irreversible?: boolean }> = [
  { type: 'restart', description: 'Reinicia el sensor. Deja de medir unos segundos.', irreversible: true },
  { type: 'recalibrate', description: 'Ajusta la altura de referencia según dónde quedó instalado.' },
  { type: 'set_colors', description: 'Colores del LED con la cochera libre y ocupada.' },
  {
    type: 'factory_reset',
    description: 'Vuelve la calibración y los colores a los valores de fábrica.',
    irreversible: true,
  },
]

const selected = ref<SensorCommandType>('restart')
const installHeight = ref('2.5')
const colors = ref({ free: '#00C853', occupied: '#D50000' })
const confirming = ref(false)

watch(open, (value) => {
  if (!value || !props.sensor) return
  selected.value = 'restart'
  confirming.value = false
  installHeight.value = (props.sensor.presetHeightM + 0.1).toFixed(1)
  colors.value = { ...props.sensor.colors }
})

watch(selected, () => (confirming.value = false))

const option = computed(() => OPTIONS.find((candidate) => candidate.type === selected.value)!)

// Según el manual del P08: se configura la altura de instalación menos 0,1 m.
const presetHeight = computed(() => Math.round((Number(installHeight.value.replace(',', '.')) - 0.1) * 10) / 10)
const heightValid = computed(() => presetHeight.value >= 1 && presetHeight.value <= 5)

const history = computed(() =>
  props.sensor ? commands.value.filter((command) => command.sensorId === props.sensor!.id).slice(0, 4) : [],
)

function payload(): SensorCommandPayload {
  if (selected.value === 'recalibrate') return { type: 'recalibrate', heightM: presetHeight.value }
  if (selected.value === 'set_colors') return { type: 'set_colors', ...colors.value }
  return { type: selected.value } as SensorCommandPayload
}

function send() {
  if (!props.sensor) return
  if (selected.value === 'recalibrate' && !heightValid.value) return
  // Los comandos que no se pueden deshacer piden un segundo clic de confirmación.
  if (option.value.irreversible && !confirming.value) {
    confirming.value = true
    return
  }
  hardware.sendCommand(props.sensor.id, payload())
  toast.show(`${COMMAND_LABELS[selected.value]} enviado · ${props.spaceLabel}`, 'info')
  confirming.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Comandos del sensor" size="lg">
    <template v-if="sensor">
      <p class="lead">
        <strong>{{ spaceLabel }}</strong> · Línea {{ sensor.port }} · Slave {{ sensor.slaveId }} · {{ sensor.firmware }}
      </p>

      <div class="options" role="radiogroup" aria-label="Comando">
        <label v-for="item in OPTIONS" :key="item.type" class="option" :class="{ 'is-selected': selected === item.type }">
          <input v-model="selected" type="radio" name="command" :value="item.type" />
          <span>
            <strong>{{ COMMAND_LABELS[item.type] }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </label>
      </div>

      <div v-if="selected === 'recalibrate'" class="params">
        <label class="field">
          <span class="field__label">Altura de instalación (del sensor al piso, en metros)</span>
          <input v-model="installHeight" class="input" inputmode="decimal" :aria-invalid="!heightValid" />
          <span class="field__hint">
            Se configura {{ heightValid ? `${presetHeight.toFixed(1)} m` : '—' }} (altura de instalación menos 0,1 m,
            según el manual del P08). Actual: {{ sensor.presetHeightM.toFixed(1) }} m.
          </span>
        </label>
      </div>

      <div v-if="selected === 'set_colors'" class="params colors">
        <label class="field">
          <span class="field__label">Libre</span>
          <input v-model="colors.free" type="color" class="color" />
        </label>
        <label class="field">
          <span class="field__label">Ocupada</span>
          <input v-model="colors.occupied" type="color" class="color" />
        </label>
      </div>

      <p v-if="confirming" class="confirm">
        <TriangleAlert :size="16" />
        {{ COMMAND_LABELS[selected] }}: {{ option.description }} Volvé a tocar el botón para confirmar.
      </p>

      <section v-if="history.length" class="history">
        <h4>Últimos comandos</h4>
        <ul>
          <li v-for="command in history" :key="command.id">
            <LoaderCircle v-if="command.status === 'pending'" :size="15" class="spin" />
            <CircleCheck v-else-if="command.status === 'done'" :size="15" class="is-done" />
            <CircleX v-else :size="15" class="is-failed" />
            {{ COMMAND_LABELS[command.type] }}
            <span>
              {{ formatTime(command.requestedAt) }} ·
              {{ command.status === 'pending' ? 'Enviando…' : command.status === 'done' ? 'Aplicado' : 'El sensor no respondió' }}
            </span>
          </li>
        </ul>
      </section>
    </template>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cerrar</button>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="selected === 'recalibrate' && !heightValid"
        @click="send"
      >
        {{ confirming ? 'Confirmar envío' : 'Enviar comando' }}
      </button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lead {
  margin: 0 0 16px;
  color: var(--sp-text-muted);
}

.lead strong {
  color: var(--sp-text);
}

.options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  cursor: pointer;
  transition:
    border-color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.option.is-selected {
  border-color: rgb(155 31 48 / 0.6);
  background: var(--sp-accent-soft);
}

.option input {
  margin-top: 3px;
  accent-color: var(--sp-accent-hover);
}

.option span {
  display: grid;
  gap: 2px;
}

.option small {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.params {
  margin-top: 16px;
}

.colors {
  display: flex;
  gap: 24px;
}

.color {
  width: 64px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
  cursor: pointer;
}

.confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px solid rgb(226 163 54 / 0.35);
  border-radius: var(--sp-radius-sm);
  background: rgb(226 163 54 / 0.08);
  color: var(--sp-warning);
  font-size: 13px;
}

.history {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--sp-border);
}

.history h4 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-text-muted);
}

.history ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.history li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history li span {
  color: var(--sp-text-muted);
}

.is-done {
  color: var(--sp-free);
}

.is-failed {
  color: #f08a8d;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 560px) {
  .options {
    grid-template-columns: 1fr;
  }
}
</style>
