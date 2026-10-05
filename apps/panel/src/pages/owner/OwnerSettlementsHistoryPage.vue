<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatMoney, type Settlement } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { useOwnerLot } from '@/features/owner/useOwnerLot'

const { activeLot, lotSettlements } = useOwnerLot()
const total = computed(() => lotSettlements.value.reduce((sum, s) => sum + s.amount, 0))

const columns: DataTableColumn<Settlement>[] = [
  { key: 'paid', label: 'Fecha de la transferencia', sortBy: (s) => s.paidAt },
  { key: 'period', label: 'Período' },
  { key: 'count', label: 'Pagos', align: 'right' },
  { key: 'fee', label: 'Comisión', align: 'right' },
  { key: 'amount', label: 'Transferido', sortBy: (s) => s.amount, align: 'right' },
  { key: 'reference', label: 'Transferencia' },
]
</script>

<template>
  <section class="page">
    <PageHeader
      title="Historial de liquidaciones"
      :subtitle="activeLot ? `${activeLot.name} · ${lotSettlements.length} transferencias · ${formatMoney(total)}` : undefined"
    />
    <DataTable
      :columns="columns"
      :rows="lotSettlements"
      :row-key="(s) => s.id"
      :initial-sort="{ key: 'paid', direction: 'desc' }"
      empty-text="Todavía no recibiste transferencias."
    >
      <template #cell-paid="{ row }">{{ formatDate(row.paidAt) }}</template>
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
