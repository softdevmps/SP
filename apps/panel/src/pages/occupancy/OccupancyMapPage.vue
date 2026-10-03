<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOccupancyStore } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import LiveBadge from '@/features/occupancy/components/LiveBadge.vue'
import OccupancyStats from '@/features/occupancy/components/OccupancyStats.vue'
import FloorTabs from '@/features/occupancy/components/FloorTabs.vue'
import FloorMap from '@/features/occupancy/components/FloorMap.vue'

const route = useRoute()
const router = useRouter()
const { lot, floors } = storeToRefs(useOccupancyStore())

const onlyFree = ref(false)
const selectedSpaceId = ref<string | null>(null)

// El piso elegido vive en la URL (?piso=f2) para poder llegar directo desde otras pantallas.
// Si no hay uno elegido, se muestra el primer piso con lugar.
const selectedFloorId = computed(() => {
  const requested = route.query.piso
  if (typeof requested === 'string' && floors.value.some((floor) => floor.floorId === requested)) {
    return requested
  }
  return (floors.value.find((floor) => floor.free > 0) ?? floors.value[0])?.floorId ?? null
})

function selectFloor(floorId: string) {
  selectedSpaceId.value = null
  router.replace({ query: { ...route.query, piso: floorId } })
}
</script>

<template>
  <section class="page">
    <PageHeader
      title="Mapa de la playa"
      :subtitle="lot ? `${lot.name} · ${lot.address}` : undefined"
    >
      <template #actions><LiveBadge /></template>
    </PageHeader>

    <OccupancyStats />

    <PanelCard>
      <div class="map-toolbar">
        <FloorTabs :selected-floor-id="selectedFloorId" @select="selectFloor" />
        <BaseSwitch v-model="onlyFree" label="Solo libres" />
      </div>
      <FloorMap
        v-model:selected="selectedSpaceId"
        :floor-id="selectedFloorId"
        :only-free="onlyFree"
      />
    </PanelCard>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 22px;
}
</style>
