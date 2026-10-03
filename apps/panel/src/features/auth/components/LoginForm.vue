<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, Lock, User, CircleAlert, LoaderCircle } from 'lucide-vue-next'
import { AuthError, useAuthStore } from '@sp/core'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const showResetHint = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ username: username.value.trim(), password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    error.value = err instanceof AuthError ? err.message : 'No se pudo iniciar sesión. Probá de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <label class="field">
      <span class="field__label">Usuario</span>
      <span class="field__control">
        <User :size="18" class="field__icon" />
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          placeholder="Tu usuario"
          required
          :aria-invalid="!!error"
        />
      </span>
    </label>

    <div class="field">
      <div class="field__row">
        <label for="login-password" class="field__label">Contraseña</label>
        <button type="button" class="link" @click="showResetHint = !showResetHint">
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      <span class="field__control">
        <Lock :size="18" class="field__icon" />
        <input
          id="login-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="••••••••"
          required
          :aria-invalid="!!error"
        />
        <button
          type="button"
          class="field__toggle"
          :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          @click="showPassword = !showPassword"
        >
          <EyeOff v-if="showPassword" :size="18" />
          <Eye v-else :size="18" />
        </button>
      </span>
      <p v-if="showResetHint" class="field__hint">
        Pedile al administrador de tu playa que restablezca tu contraseña.
      </p>
    </div>

    <Transition name="alert">
      <p v-if="error" class="alert" role="alert">
        <CircleAlert :size="16" />
        {{ error }}
      </p>
    </Transition>

    <button type="submit" class="submit" :disabled="loading">
      <LoaderCircle v-if="loading" :size="18" class="spin" />
      <span>{{ loading ? 'Ingresando…' : 'Ingresar' }}</span>
    </button>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--sp-text);
}

.field__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--sp-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--sp-duration) var(--sp-ease);
}

.link:hover {
  color: var(--sp-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.field__hint {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--sp-text-muted);
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

.field__control:hover {
  border-color: rgb(255 255 255 / 0.2);
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
  font-size: 14px;
  outline: none;
}

.field input::placeholder {
  color: var(--sp-text-faint);
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

.alert-enter-active,
.alert-leave-active {
  transition: opacity var(--sp-duration) var(--sp-ease);
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
}

.submit {
  height: 44px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-accent);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--sp-shadow-sm);
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
