<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useOccupancyStore } from '@sp/core'

// La conexión en vivo se mantiene mientras el playero navega entre las pantallas de Ocupación.
const occupancy = useOccupancyStore()

onMounted(() => occupancy.connect())
onBeforeUnmount(() => occupancy.disconnect())
</script>

<template>
  <RouterView />
</template>
