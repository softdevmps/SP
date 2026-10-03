<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus } from 'lucide-vue-next'
import { usePlatformStore, type LotStatus, type PlatformLot } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import LotsTable from '@/features/admin-lots/components/LotsTable.vue'
import LotFormDialog from '@/features/admin-lots/components/LotFormDialog.vue'
import LotStatusDialog from '@/features/admin-lots/components/LotStatusDialog.vue'

const platform = usePlatformStore()
const { lots } = storeToRefs(platform)

onMounted(() => platform.load())

const subtitle = computed(() => {
  const subscribed = lots.value.filter((lot) => lot.status !== 'not_subscribed')
  const spaces = subscribed.reduce((sum, lot) => sum + lot.totalSpaces, 0)
  return `${subscribed.length} suscriptas · ${spaces.toLocaleString('es-AR')} cocheras · ${
    lots.value.length - subscribed.length
  } no suscriptas en el mapa`
})

const editing = ref<PlatformLot | null>(null)
const formOpen = ref(false)

const statusLot = ref<PlatformLot | null>(null)
const statusTarget = ref<LotStatus | null>(null)
const statusOpen = ref(false)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(lot: PlatformLot) {
  editing.value = lot
  formOpen.value = true
}

function openStatus(lot: PlatformLot, target: LotStatus) {
  statusLot.value = lot
  statusTarget.value = target
  statusOpen.value = true
}
</script>

<template>
  <section class="page">
    <PageHeader title="Playas" :subtitle="subtitle">
      <template #actions>
        <button type="button" class="btn btn--primary" @click="openCreate">
          <Plus :size="16" /> Nueva playa
        </button>
      </template>
    </PageHeader>

    <LotsTable @edit="openEdit" @change-status="openStatus" />

    <LotFormDialog v-model:open="formOpen" :lot="editing" />
    <LotStatusDialog v-model:open="statusOpen" :lot="statusLot" :target="statusTarget" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}
</style>
