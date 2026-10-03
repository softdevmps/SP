<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useOccupancyStore, type Reservation } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import LiveBadge from '@/features/occupancy/components/LiveBadge.vue'
import ArrivalValidator from '@/features/reservations/components/ArrivalValidator.vue'
import ArrivalsTable from '@/features/reservations/components/ArrivalsTable.vue'
import ArrivalConfirmDialog from '@/features/reservations/components/ArrivalConfirmDialog.vue'

const { lot } = storeToRefs(useOccupancyStore())

const selected = ref<Reservation | null>(null)
const confirmOpen = ref(false)

function openConfirm(reservation: Reservation) {
  selected.value = reservation
  confirmOpen.value = true
}
</script>

<template>
  <section class="page">
    <PageHeader title="Próximas llegadas" :subtitle="lot?.name">
      <template #actions><LiveBadge /></template>
    </PageHeader>

    <ArrivalValidator @found="openConfirm" />
    <ArrivalsTable @validate="openConfirm" />

    <ArrivalConfirmDialog v-model:open="confirmOpen" :reservation="selected" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}
</style>
