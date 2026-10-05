<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { formatDate, formatMoney, usePaymentsStore, usePlatformStore, type Settlement } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { useSettlementLots } from '@/features/admin-finance/useSettlementLots'

const { settlements } = storeToRefs(usePaymentsStore())
const platform = usePlatformStore()
platform.load()
const { lotName } = useSettlementLots()

const lotFilter = ref('')
const lotOptions = computed(() => [...new Set(settlements.value.map((s) => s.lotId))])
const rows = computed(() => settlements.value.filter((s) => !lotFilter.value || s.lotId === lotFilter.value))
const total = computed(() => rows.value.reduce((sum, s) => sum + s.amount, 0))

const columns: DataTableColumn<Settlement>[] = [
  { key: 'paid', label: 'Fecha', sortBy: (s) => s.paidAt, width: '110px' },
  { key: 'lot', label: 'Playa', sortBy: (s) => lotName(s.lotId) },
  { key: 'period', label: 'Período', width: '200px' },
  { key: 'count', label: 'Pagos', align: 'right', width: '80px' },
  { key: 'fee', label: 'Comisión', sortBy: (s) => s.platformFee, align: 'right', width: '120px' },
  { key: 'amount', label: 'Transferido', sortBy: (s) => s.amount, align: 'right', width: '140px' },
  { key: 'reference', label: 'Transferencia', width: '150px' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Historial de liquidaciones" :subtitle="`${rows.length} transferencias · ${formatMoney(total)}`" />

    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(s) => s.id"
      :initial-sort="{ key: 'paid', direction: 'desc' }"
      empty-text="Todavía no se registró ninguna liquidación."
    >
      <template #toolbar>
        <select v-model="lotFilter" class="select select--sm" aria-label="Playa">
          <option value="">Todas las playas</option>
          <option v-for="lotId in lotOptions" :key="lotId" :value="lotId">{{ lotName(lotId) }}</option>
        </select>
      </template>
      <template #cell-paid="{ row }"><span class="muted">{{ formatDate(row.paidAt) }}</span></template>
      <template #cell-lot="{ row }"><strong>{{ lotName(row.lotId) }}</strong></template>
      <template #cell-period="{ row }"><span class="muted">{{ formatDate(row.periodFrom) }} – {{ formatDate(row.periodTo) }}</span></template>
      <template #cell-count="{ row }"><span class="number">{{ row.paymentsCount }}</span></template>
      <template #cell-fee="{ row }"><span class="muted">{{ row.platformFee ? `− ${formatMoney(row.platformFee)}` : '—' }}</span></template>
      <template #cell-amount="{ row }"><span class="number">{{ formatMoney(row.amount) }}</span></template>
      <template #cell-reference="{ row }"><span class="mono">{{ row.reference }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.select--sm {
  width: auto;
  height: 34px;
  font-size: 13px;
}

.muted {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
