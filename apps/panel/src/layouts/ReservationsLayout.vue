<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { Reservation } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import LiveBadge from '@/features/occupancy/components/LiveBadge.vue'
import TicketLookup from '@/features/reservations/components/TicketLookup.vue'
import ArrivalConfirmDialog from '@/features/reservations/components/ArrivalConfirmDialog.vue'
import CheckOutDialog from '@/features/reservations/components/CheckOutDialog.vue'
import { provideReservationActions } from '@/features/reservations/useReservationActions'
import { useLotLive } from '@/composables/useLotLive'

// Encabezado, buscador de ticket y diálogos son los mismos para Llegadas, En la playa e Historial:
// cualquier código funciona desde cualquiera de las tres pantallas.
const route = useRoute()
const { lot } = storeToRefs(useLotLive())

const selected = ref<Reservation | null>(null)
const arrivalOpen = ref(false)
const exitOpen = ref(false)

function openArrival(reservation: Reservation) {
  selected.value = reservation
  arrivalOpen.value = true
}

function openExit(reservation: Reservation) {
  selected.value = reservation
  exitOpen.value = true
}

provideReservationActions({ openArrival, openExit })
</script>

<template>
  <section class="page">
    <PageHeader :title="route.meta.title ?? 'Reservas'" :subtitle="lot ? `${lot.name} · hoy` : undefined">
      <template #actions><LiveBadge /></template>
    </PageHeader>

    <TicketLookup allow-exit @arrival="openArrival" @exit="openExit" />

    <RouterView />

    <ArrivalConfirmDialog v-model:open="arrivalOpen" :reservation="selected" />
    <CheckOutDialog v-model:open="exitOpen" :reservation="selected" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}
</style>
