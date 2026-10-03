<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useHardwareStore, type DeviceType } from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'
import { DEVICE_TYPES } from '../labels'

const props = defineProps<{ lotId: string }>()
const open = defineModel<boolean>('open', { default: false })

const hardware = useHardwareStore()
const toast = useToast()

const form = reactive({ name: '', type: 'usr-eg228' as DeviceType, code: '', ports: '4' })
const submitted = ref(false)

watch(open, (value) => {
  if (!value) return
  submitted.value = false
  Object.assign(form, { name: '', type: 'usr-eg228', code: '', ports: '4' })
})

const errors = computed(() => ({
  name: form.name.trim() ? '' : 'Poné un nombre para ubicarlo (ej. "Tablero piso 2").',
  code: form.code.trim() ? '' : 'Ingresá el identificador del equipo (MAC o gateway ID).',
}))

function save() {
  submitted.value = true
  if (errors.value.name || errors.value.code) return
  hardware.addDevice({
    lotId: props.lotId,
    name: form.name.trim(),
    type: form.type,
    code: form.code.trim().toUpperCase(),
    ports: Array.from({ length: Number(form.ports) }, (_, index) => ({ number: index + 1, ok: true })),
  })
  toast.show(`Equipo agregado · ${form.name.trim()}`)
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Agregar equipo">
    <form id="device-form" class="form-grid" novalidate @submit.prevent="save">
      <label class="field is-wide">
        <span class="field__label">Nombre</span>
        <input v-model="form.name" class="input" placeholder="Tablero piso 2" :aria-invalid="submitted && !!errors.name" />
        <span v-if="submitted && errors.name" class="field__error">{{ errors.name }}</span>
      </label>
      <label class="field is-wide">
        <span class="field__label">Modelo</span>
        <select v-model="form.type" class="select">
          <option v-for="(label, key) in DEVICE_TYPES" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="field__label">Identificador</span>
        <input v-model="form.code" class="input" placeholder="98:D8:63:AA:BB:CC" :aria-invalid="submitted && !!errors.code" />
        <span v-if="submitted && errors.code" class="field__error">{{ errors.code }}</span>
      </label>
      <label class="field">
        <span class="field__label">Líneas RS-485</span>
        <select v-model="form.ports" class="select">
          <option v-for="count in [1, 2, 3, 4]" :key="count" :value="String(count)">{{ count }}</option>
        </select>
      </label>
    </form>
    <p class="note">El equipo aparece "Sin conexión" hasta que se conecte por primera vez con el código de la playa.</p>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="submit" form="device-form" class="btn btn--primary">Agregar equipo</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.note {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}
</style>
