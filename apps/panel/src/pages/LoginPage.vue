<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginForm from '@/features/auth/components/LoginForm.vue'
</script>

<template>
  <AuthLayout title="Iniciar sesión" subtitle="Ingresá con tu cuenta para acceder al panel de tu playa.">
    <LoginForm />
    <template #help>¿Problemas para ingresar? Contactá al administrador.</template>
  </AuthLayout>
</template>
