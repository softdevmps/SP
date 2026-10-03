<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHardwareStore, type Lot, type Sensor } from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ sensor: Sensor | null; layout: Lot | null; sensors: Sensor[] }>()
const open = defineModel<boolean>('open', { default: false })

const hardware = useHardwareStore()
const toast = useToast()
const spaceId = ref('')

watch(open, (value) => {
  if (value) spaceId.value = props.sensor?.spaceId ?? ''
})

/** Cocheras que ya tienen otro sensor: asignarlas le saca la cochera a ese sensor. */
const taken = computed(() => {
  const result = new Set<string>()
  for (const sensor of props.sensors) {
    if (sensor.spaceId && sensor.id !== props.sensor?.id) result.add(sensor.spaceId)
  }
  return result
})

const stealing = computed(() => !!spaceId.value && taken.value.has(spaceId.value))

function save() {
  if (!props.sensor) return
  hardware.assignSensor(props.sensor.id, spaceId.value || null)
  toast.show(spaceId.value ? 'Sensor asignado a su cochera' : 'Sensor sin cochera asignada')
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Asignar cochera">
    <template v-if="sensor">
      <p class="lead">Línea {{ sensor.port }} · Slave {{ sensor.slaveId }}</p>
      <label class="field">
        <span class="field__label">Cochera</span>
        <select v-model="spaceId" class="select">
          <option value="">Sin asignar</option>
          <optgroup v-for="floor in layout?.floors ?? []" :key="floor.id" :label="floor.name">
            <template v-for="sector in floor.sectors" :key="sector.id">
              <option v-for="space in sector.spaces" :key="space.id" :value="space.id">
                Cochera {{ space.number }} · {{ sector.name }}{{ taken.has(space.id) ? ' (tiene sensor)' : '' }}
              </option>
            </template>
          </optgroup>
        </select>
      </label>
      <p v-if="stealing" class="warning">Esa cochera ya tiene un sensor: ese sensor va a quedar sin asignar.</p>
    </template>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="button" class="btn btn--primary" @click="save">Guardar</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lead {
  margin: 0 0 14px;
  color: var(--sp-text-muted);
}

.warning {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--sp-warning);
}
</style>
