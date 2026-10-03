<script setup lang="ts">
import { useLotLive } from '@/composables/useLotLive'

// La conexión en vivo se mantiene mientras el playero navega entre las pantallas de Ocupación.
useLotLive()
</script>

<template>
  <RouterView />
</template>
