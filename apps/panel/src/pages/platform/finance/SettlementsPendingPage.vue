<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Info } from 'lucide-vue-next'
import { formatDate, formatMoney, usePaymentsStore, usePlatformStore, type PendingSettlement } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import RegisterSettlementDialog from '@/features/admin-finance/RegisterSettlementDialog.vue'
import { useSettlementLots } from '@/features/admin-finance/useSettlementLots'

const { pendingByLot, rules } = storeToRefs(usePaymentsStore())
const platform = usePlatformStore()
platform.load()
const { lotName, ownerName } = useSettlementLots()

const totalPending = computed(() => pendingByLot.value.reduce((sum, item) => sum + item.amount, 0))
const rulesDefined = computed(() => rules.value.platformFeePercent !== null && rules.value.frequency !== null)

const columns: DataTableColumn<PendingSettlement>[] = [
  { key: 'lot', label: 'Playa', sortBy: (item) => lotName(item.lotId) },
  { key: 'owner', label: 'Dueño' },
  { key: 'since', label: 'Desde', sortBy: (item) => item.periodFrom ?? '', width: '110px' },
  { key: 'count', label: 'Pagos', sortBy: (item) => item.payments.length, align: 'right', width: '80px' },
  { key: 'net', label: 'Cobrado neto', sortBy: (item) => item.netCollected, align: 'right', width: '140px' },
  { key: 'fee', label: 'Comisión', align: 'right', width: '120px' },
  { key: 'amount', label: 'A transferir', sortBy: (item) => item.amount, align: 'right', width: '140px' },
  { key: 'actions', label: '', align: 'right', width: '190px' },
]

const selected = ref<PendingSettlement | null>(null)
const dialogOpen = ref(false)
function openRegister(item: PendingSettlement) {
  selected.value = item
  dialogOpen.value = true
}
</script>

<template>
  <section class="page">
    <PageHeader
      title="Liquidaciones pendientes"
      :subtitle="`${formatMoney(totalPending)} por transferir a ${pendingByLot.length} playas`"
    />

    <p v-if="!rulesDefined" class="notice">
      <Info :size="16" />
      Las reglas de liquidación todavía no están definidas: se calcula sin comisión de la plataforma.
      <RouterLink :to="{ name: 'admin-settlement-rules' }" class="notice__link">Definir reglas</RouterLink>
    </p>

    <DataTable
      :columns="columns"
      :rows="pendingByLot"
      :row-key="(item) => item.lotId"
      :initial-sort="{ key: 'amount', direction: 'desc' }"
      empty-text="No hay nada pendiente: todas las playas están liquidadas."
    >
      <template #cell-lot="{ row }"><strong>{{ lotName(row.lotId) }}</strong></template>
      <template #cell-owner="{ row }"><span class="muted">{{ ownerName(row.lotId) }}</span></template>
      <template #cell-since="{ row }"><span class="muted">{{ row.periodFrom ? formatDate(row.periodFrom) : '—' }}</span></template>
      <template #cell-count="{ row }"><span class="number">{{ row.payments.length }}</span></template>
      <template #cell-net="{ row }"><span class="number">{{ formatMoney(row.netCollected) }}</span></template>
      <template #cell-fee="{ row }">
        <span class="muted">{{ row.platformFee === null ? 'Sin definir' : `− ${formatMoney(row.platformFee)}` }}</span>
      </template>
      <template #cell-amount="{ row }"><span class="number is-strong">{{ formatMoney(row.amount) }}</span></template>
      <template #cell-actions="{ row }">
        <button type="button" class="btn btn--sm btn--subtle" @click="openRegister(row)">Registrar transferencia</button>
      </template>
    </DataTable>

    <p class="footnote">
      Los excedentes que cobra el playero en efectivo quedan en la playa y no pasan por la plataforma.
    </p>

    <RegisterSettlementDialog v-model:open="dialogOpen" :pending="selected" :lot-name="selected ? lotName(selected.lotId) : ''" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.notice {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgb(226 163 54 / 0.35);
  border-radius: var(--sp-radius-sm);
  background: rgb(226 163 54 / 0.08);
  color: var(--sp-warning);
  font-size: 13px;
}

.notice__link {
  margin-left: auto;
  color: var(--sp-text);
  font-weight: 600;
}

.notice__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.muted {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.number.is-strong {
  font-size: 15px;
}

.footnote {
  margin: 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}
</style>
