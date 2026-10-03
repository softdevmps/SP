<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlatformStore, type LotStatus, type PlatformLot, type PlatformLotInput } from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'
import { LOT_STATUSES } from '../statuses'

/** Si se pasa una playa, el diálogo la edita; si no, da de alta una nueva. */
const props = defineProps<{ lot: PlatformLot | null }>()
const open = defineModel<boolean>('open', { default: false })

const platform = usePlatformStore()
const { owners } = storeToRefs(platform)
const toast = useToast()

const form = reactive({
  name: '',
  address: '',
  neighborhood: '',
  lat: '',
  lng: '',
  totalSpaces: '',
  status: 'onboarding' as LotStatus,
  ownerId: '',
})
const submitted = ref(false)

const isEdit = computed(() => props.lot !== null)
const needsOwner = computed(() => form.status !== 'not_subscribed')

// Al abrir se cargan los datos de la playa (edición) o se limpia el formulario (alta).
watch(open, (value) => {
  if (!value) return
  submitted.value = false
  const lot = props.lot
  Object.assign(form, {
    name: lot?.name ?? '',
    address: lot?.address ?? '',
    neighborhood: lot?.neighborhood ?? '',
    lat: lot ? String(lot.location.lat) : '',
    lng: lot ? String(lot.location.lng) : '',
    totalSpaces: lot ? String(lot.totalSpaces) : '',
    status: lot?.status ?? 'onboarding',
    ownerId: lot?.ownerId ?? '',
  })
})

function isNumberInRange(value: string, min: number, max: number) {
  const number = Number(value.replace(',', '.'))
  return value.trim() !== '' && Number.isFinite(number) && number >= min && number <= max
}

const errors = computed(() => ({
  name: form.name.trim() ? '' : 'Ingresá el nombre de la playa.',
  address: form.address.trim() ? '' : 'Ingresá la dirección.',
  lat: isNumberInRange(form.lat, -90, 90) ? '' : 'Latitud inválida (ej. -31.4135).',
  lng: isNumberInRange(form.lng, -180, 180) ? '' : 'Longitud inválida (ej. -64.1888).',
  totalSpaces:
    /^\d+$/.test(form.totalSpaces) && Number(form.totalSpaces) > 0 ? '' : 'Ingresá la cantidad de cocheras.',
  ownerId: needsOwner.value && !form.ownerId ? 'Una playa suscripta necesita un dueño.' : '',
}))

const isValid = computed(() => Object.values(errors.value).every((error) => !error))

function save() {
  submitted.value = true
  if (!isValid.value) return

  const input: PlatformLotInput = {
    name: form.name.trim(),
    address: form.address.trim(),
    neighborhood: form.neighborhood.trim(),
    location: { lat: Number(form.lat.replace(',', '.')), lng: Number(form.lng.replace(',', '.')) },
    status: form.status,
    ownerId: needsOwner.value ? form.ownerId : form.ownerId || null,
    totalSpaces: Number(form.totalSpaces),
  }

  if (props.lot) {
    platform.updateLot(props.lot.id, input)
    toast.show(`Playa actualizada · ${input.name}`)
  } else {
    platform.createLot(input)
    toast.show(`Playa creada · ${input.name}`)
  }
  open.value = false
}

function errorOf(field: keyof typeof errors.value) {
  return submitted.value ? errors.value[field] : ''
}
</script>

<template>
  <BaseDialog v-model:open="open" :title="isEdit ? 'Editar playa' : 'Nueva playa'" size="lg">
    <form id="lot-form" class="form-grid" novalidate @submit.prevent="save">
      <label class="field is-wide">
        <span class="field__label">Nombre</span>
        <input v-model="form.name" class="input" :aria-invalid="!!errorOf('name')" placeholder="Playa Centro" />
        <span v-if="errorOf('name')" class="field__error">{{ errorOf('name') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Dirección</span>
        <input v-model="form.address" class="input" :aria-invalid="!!errorOf('address')" placeholder="Av. Colón 1234" />
        <span v-if="errorOf('address')" class="field__error">{{ errorOf('address') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Barrio</span>
        <input v-model="form.neighborhood" class="input" placeholder="Centro" />
      </label>

      <label class="field">
        <span class="field__label">Latitud</span>
        <input v-model="form.lat" class="input" inputmode="decimal" :aria-invalid="!!errorOf('lat')" placeholder="-31.4135" />
        <span v-if="errorOf('lat')" class="field__error">{{ errorOf('lat') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Longitud</span>
        <input v-model="form.lng" class="input" inputmode="decimal" :aria-invalid="!!errorOf('lng')" placeholder="-64.1888" />
        <span v-if="errorOf('lng')" class="field__error">{{ errorOf('lng') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Estado</span>
        <select v-model="form.status" class="select">
          <option v-for="(meta, key) in LOT_STATUSES" :key="key" :value="key">{{ meta.label }}</option>
        </select>
        <span class="field__hint">{{ LOT_STATUSES[form.status].description }}</span>
      </label>

      <label class="field">
        <span class="field__label">Cocheras</span>
        <input v-model="form.totalSpaces" class="input" inputmode="numeric" :aria-invalid="!!errorOf('totalSpaces')" placeholder="120" />
        <span v-if="errorOf('totalSpaces')" class="field__error">{{ errorOf('totalSpaces') }}</span>
        <span v-else-if="form.status === 'not_subscribed'" class="field__hint">Aproximadas, solo informativo.</span>
      </label>

      <label class="field is-wide">
        <span class="field__label">Dueño{{ needsOwner ? '' : ' (opcional)' }}</span>
        <select v-model="form.ownerId" class="select" :aria-invalid="!!errorOf('ownerId')">
          <option value="">Sin dueño asignado</option>
          <option v-for="owner in owners" :key="owner.id" :value="owner.id">{{ owner.name }}</option>
        </select>
        <span v-if="errorOf('ownerId')" class="field__error">{{ errorOf('ownerId') }}</span>
        <span v-else class="field__hint">Los dueños se dan de alta en Plataforma › Usuarios.</span>
      </label>

      <label v-if="lot?.mqttCode" class="field is-wide">
        <span class="field__label">Código de la playa para los equipos (MQTT)</span>
        <input :value="lot.mqttCode" class="input" readonly />
      </label>
    </form>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="submit" form="lot-form" class="btn btn--primary">
        {{ isEdit ? 'Guardar cambios' : 'Crear playa' }}
      </button>
    </template>
  </BaseDialog>
</template>
