<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@sp/core'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ChangePasswordForm from '@/features/auth/components/ChangePasswordForm.vue'

const auth = useAuthStore()
const router = useRouter()

// Obligatorio la primera vez (contraseña temporal); también se puede entrar desde el menú de usuario.
const forced = computed(() => !!auth.user?.mustChangePassword)

async function leave() {
  if (forced.value) {
    auth.logout()
    await router.replace({ name: 'login' })
  } else {
    await router.back()
  }
}
</script>

<template>
  <AuthLayout
    title="Cambiar contraseña"
    :subtitle="
      forced
        ? `Hola ${auth.user?.name ?? ''}. Ingresaste con una contraseña temporal: elegí una nueva para continuar.`
        : 'Elegí una contraseña nueva para tu cuenta.'
    "
  >
    <ChangePasswordForm />
    <template #help>
      <button type="button" class="link" @click="leave">
        {{ forced ? 'Salir y volver al inicio de sesión' : 'Volver al panel' }}
      </button>
    </template>
  </AuthLayout>
</template>

<style scoped>
.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--sp-text-muted);
  font: inherit;
  cursor: pointer;
}

.link:hover {
  color: var(--sp-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
