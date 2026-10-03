<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CircleAlert, Eye, EyeOff, LoaderCircle, Lock } from 'lucide-vue-next'
import { AuthError, passwordChecks, useAuthStore } from '@sp/core'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({ current: '', next: '', confirm: '' })
const show = ref(false)
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

const checks = computed(() => {
  const base = passwordChecks({ current: form.current, next: form.next })
  return [
    { ok: base.length, label: 'Al menos 8 caracteres' },
    { ok: base.letterAndNumber, label: 'Letras y números' },
    { ok: base.different, label: 'Distinta de la actual' },
    { ok: form.next.length > 0 && form.next === form.confirm, label: 'Las dos contraseñas coinciden' },
  ]
})
const isValid = computed(() => form.current.length > 0 && checks.value.every((check) => check.ok))

async function submit() {
  submitted.value = true
  error.value = ''
  if (!isValid.value) return
  loading.value = true
  try {
    await auth.changePassword({ current: form.current, next: form.next })
    toast.show('Contraseña actualizada')
    await router.replace({ name: 'home' })
  } catch (err) {
    error.value = err instanceof AuthError ? err.message : 'No se pudo cambiar la contraseña. Probá de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <label v-for="field in (['current', 'next', 'confirm'] as const)" :key="field" class="field">
      <span class="field__label">
        {{ field === 'current' ? 'Contraseña actual' : field === 'next' ? 'Contraseña nueva' : 'Repetí la contraseña nueva' }}
      </span>
      <span class="field__control">
        <Lock :size="18" class="field__icon" />
        <input
          v-model="form[field]"
          :type="show ? 'text' : 'password'"
          :autocomplete="field === 'current' ? 'current-password' : 'new-password'"
          :aria-invalid="submitted && field === 'current' && !form.current"
        />
        <button
          v-if="field === 'current'"
          type="button"
          class="field__toggle"
          :aria-label="show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'"
          @click="show = !show"
        >
          <EyeOff v-if="show" :size="18" />
          <Eye v-else :size="18" />
        </button>
      </span>
    </label>

    <ul class="checks" aria-label="Requisitos de la contraseña">
      <li v-for="check in checks" :key="check.label" :class="{ 'is-ok': check.ok, 'is-missing': submitted && !check.ok }">
        <Check :size="14" />
        {{ check.label }}
      </li>
    </ul>

    <p v-if="error" class="alert" role="alert">
      <CircleAlert :size="16" />
      {{ error }}
    </p>

    <button type="submit" class="submit" :disabled="loading">
      <LoaderCircle v-if="loading" :size="18" class="spin" />
      <span>{{ loading ? 'Guardando…' : 'Cambiar contraseña' }}</span>
    </button>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 500;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface);
  transition:
    border-color var(--sp-duration) var(--sp-ease),
    box-shadow var(--sp-duration) var(--sp-ease);
}

.field__control:focus-within {
  border-color: var(--sp-accent-hover);
  box-shadow: 0 0 0 3px var(--sp-accent-soft);
}

.field__icon {
  position: absolute;
  left: 12px;
  color: var(--sp-text-faint);
  pointer-events: none;
}

.field input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 42px 0 40px;
  border: 0;
  background: transparent;
  color: var(--sp-text);
  font: inherit;
  outline: none;
}

.field__toggle {
  position: absolute;
  right: 4px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-text-faint);
  cursor: pointer;
}

.field__toggle:hover {
  color: var(--sp-text);
}

.checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--sp-text-faint);
}

.checks li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checks li.is-ok {
  color: var(--sp-free);
}

.checks li.is-missing {
  color: #f08a8d;
}

.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgb(229 72 77 / 0.35);
  border-radius: var(--sp-radius-sm);
  background: rgb(229 72 77 / 0.08);
  color: #f08a8d;
  font-size: 13px;
}

.submit {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--sp-duration) var(--sp-ease);
}

.submit:hover:not(:disabled) {
  background: var(--sp-accent-hover);
}

.submit:disabled {
  cursor: progress;
  opacity: 0.75;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
