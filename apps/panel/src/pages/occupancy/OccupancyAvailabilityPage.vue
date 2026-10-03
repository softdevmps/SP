<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOccupancyStore } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import LiveBadge from '@/features/occupancy/components/LiveBadge.vue'
import AvailabilityHero from '@/features/occupancy/components/AvailabilityHero.vue'
import BestSpots from '@/features/occupancy/components/BestSpots.vue'
import FloorBreakdown from '@/features/occupancy/components/FloorBreakdown.vue'
import ReservationsByHour from '@/features/occupancy/components/ReservationsByHour.vue'

const router = useRouter()
const { lot } = storeToRefs(useOccupancyStore())

function openFloor(floorId: string) {
  router.push({ name: 'occupancy-map', query: { piso: floorId } })
}
</script>

<template>
  <section class="page">
    <PageHeader title="Disponibilidad" :subtitle="lot?.name">
      <template #actions><LiveBadge /></template>
    </PageHeader>

    <div class="row">
      <AvailabilityHero />
      <BestSpots @open="openFloor" />
    </div>

    <div class="row">
      <FloorBreakdown @open="openFloor" />
      <ReservationsByHour />
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
