<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountsStore, usePlatformStore, type StaffAccount, type UserRole } from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'
import { ROLES } from '../roles'

const props = defineProps<{ account: StaffAccount | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [username: string, password: string] }>()

const accountsStore = useAccountsStore()
const platform = usePlatformStore()
const { lots } = storeToRefs(platform)
const toast = useToast()

const form = reactive({
  name: '',
  username: '',
  email: '',
  phone: '',
  role: 'attendant' as UserRole,
  lotIds: [] as string[],
})
const submitted = ref(false)
const isEdit = computed(() => props.account !== null)

const subscribedLots = computed(() => lots.value.filter((lot) => lot.status !== 'not_subscribed'))
const ownedLots = computed(() => lots.value.filter((lot) => props.account && lot.ownerId === props.account.id))

watch(open, (value) => {
  if (!value) return
  platform.load()
  submitted.value = false
  const account = props.account
  Object.assign(form, {
    name: account?.name ?? '',
    username: account?.username ?? '',
    email: account?.email ?? '',
    phone: account?.phone ?? '',
    role: account?.role ?? 'attendant',
    lotIds: [...(account?.lotIds ?? [])],
  })
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const errors = computed(() => {
  const username = form.username.trim().toLowerCase()
  return {
    name: form.name.trim() ? '' : 'Ingresá el nombre.',
    username: !/^[a-z0-9._-]{3,30}$/.test(username)
      ? 'Entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo.'
      : accountsStore.isUsernameTaken(username, props.account?.id)
        ? 'Ese usuario ya existe.'
        : '',
    email:
      form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())
        ? 'Email inválido.'
        : form.role !== 'attendant' && !form.email.trim()
          ? 'Los dueños y admins necesitan email.'
          : '',
    lotIds: form.role === 'attendant' && !form.lotIds.length ? 'Asigná al menos una playa.' : '',
  }
})
const isValid = computed(() => Object.values(errors.value).every((error) => !error))

function errorOf(field: keyof typeof errors.value) {
  return submitted.value ? errors.value[field] : ''
}

function save() {
  submitted.value = true
  if (!isValid.value) return
  const input = {
    name: form.name.trim(),
    username: form.username,
    email: form.email.trim(),
    phone: form.phone.trim(),
    role: form.role,
    lotIds: form.lotIds,
  }
  if (props.account) {
    accountsStore.updateAccount(props.account.id, input)
    toast.show(`Usuario actualizado · ${input.name}`)
  } else {
    const { account, password } = accountsStore.createAccount(input)
    emit('created', account.username, password)
  }
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" :title="isEdit ? 'Editar usuario' : 'Nuevo usuario'" size="lg">
    <form id="account-form" class="form-grid" novalidate @submit.prevent="save">
      <label class="field is-wide">
        <span class="field__label">Rol</span>
        <select v-model="form.role" class="select" :disabled="isEdit">
          <option v-for="(meta, key) in ROLES" :key="key" :value="key">{{ meta.label }}</option>
        </select>
        <span class="field__hint">{{ ROLES[form.role].description }}<template v-if="isEdit"> El rol no se cambia en una cuenta existente.</template></span>
      </label>

      <label class="field">
        <span class="field__label">Nombre</span>
        <input v-model="form.name" class="input" :aria-invalid="!!errorOf('name')" />
        <span v-if="errorOf('name')" class="field__error">{{ errorOf('name') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Usuario para ingresar</span>
        <input v-model="form.username" class="input" autocapitalize="none" spellcheck="false" :aria-invalid="!!errorOf('username')" />
        <span v-if="errorOf('username')" class="field__error">{{ errorOf('username') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Email{{ form.role === 'attendant' ? ' (opcional)' : '' }}</span>
        <input v-model="form.email" class="input" type="email" :aria-invalid="!!errorOf('email')" />
        <span v-if="errorOf('email')" class="field__error">{{ errorOf('email') }}</span>
      </label>

      <label class="field">
        <span class="field__label">Teléfono (opcional)</span>
        <input v-model="form.phone" class="input" type="tel" />
      </label>

      <fieldset v-if="form.role === 'attendant'" class="field is-wide lots">
        <legend class="field__label">Playas donde trabaja</legend>
        <label v-for="lot in subscribedLots" :key="lot.id" class="lot-option">
          <input v-model="form.lotIds" type="checkbox" :value="lot.id" />
          {{ lot.name }} <span>· {{ lot.neighborhood }}</span>
        </label>
        <span v-if="errorOf('lotIds')" class="field__error">{{ errorOf('lotIds') }}</span>
      </fieldset>

      <div v-if="form.role === 'owner' && isEdit" class="field is-wide">
        <span class="field__label">Playas que tiene</span>
        <span class="field__hint">
          {{ ownedLots.length ? ownedLots.map((lot) => lot.name).join(' · ') : 'Ninguna todavía.' }}
          Se asignan desde Playas › Editar.
        </span>
      </div>
    </form>
    <p v-if="!isEdit" class="note">Al crearla se genera una contraseña temporal que se muestra una sola vez.</p>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="submit" form="account-form" class="btn btn--primary">{{ isEdit ? 'Guardar cambios' : 'Crear usuario' }}</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lots {
  margin: 0;
  padding: 0;
  border: 0;
}

.lots legend {
  margin-bottom: 6px;
  padding: 0;
}

.lot-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
}

.lot-option input {
  accent-color: var(--sp-accent-hover);
}

.lot-option span {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.note {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}
</style>
