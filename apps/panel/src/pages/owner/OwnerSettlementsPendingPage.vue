<script setup lang="ts">
import { computed } from 'vue'
import { Info } from 'lucide-vue-next'
import { formatDate, formatMoney, formatTime, type Payment } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import StatTiles, { type StatTile } from '@/components/StatTiles.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { useOwnerLot } from '@/features/owner/useOwnerLot'

const { activeLot, pending, rules } = useOwnerLot()

const rows = computed(() => pending.value?.payments ?? [])
const tiles = computed<StatTile[]>(() => [
  { label: 'A transferirte', value: formatMoney(pending.value?.amount ?? 0), tone: 'success' },
  { label: 'Cobrado neto', value: formatMoney(pending.value?.netCollected ?? 0), detail: 'Después de la comisión del medio de pago' },
  {
    label: 'Comisión de la plataforma',
    value: pending.value?.platformFee === null || !pending.value ? 'Sin definir' : formatMoney(pending.value.platformFee),
  },
  { label: 'Pagos incluidos', value: String(rows.value.length), detail: pending.value?.periodFrom ? `Desde el ${formatDate(pending.value.periodFrom)}` : undefined },
])

const columns: DataTableColumn<Payment>[] = [
  { key: 'date', label: 'Fecha', sortBy: (p) => p.createdAt, width: '160px' },
  { key: 'reservation', label: 'Reserva', sortBy: (p) => p.reservationCode },
  { key: 'amount', label: 'Monto', sortBy: (p) => p.amount, align: 'right' },
  { key: 'fee', label: 'Comisión del medio de pago', sortBy: (p) => p.providerFee, align: 'right' },
  { key: 'net', label: 'Neto', sortBy: (p) => p.amount - p.providerFee, align: 'right' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Pendiente de cobrar" :subtitle="activeLot ? `${activeLot.name} · reservas cobradas por la plataforma` : undefined" />
    <StatTiles :tiles="tiles" />
    <p v-if="rules.platformFeePercent === null" class="note">
      <Info :size="16" />
      La comisión de la plataforma todavía no está definida: por ahora se te transfiere el neto completo.
    </p>
    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(p) => p.id"
      :initial-sort="{ key: 'date', direction: 'desc' }"
      empty-text="No hay pagos pendientes: está todo liquidado."
    >
      <template #cell-date="{ row }"><span class="muted">{{ formatDate(row.createdAt) }} {{ formatTime(row.createdAt) }}</span></template>
      <template #cell-reservation="{ row }"><span class="mono">{{ row.reservationCode }}</span> <span class="muted">· {{ row.vehiclePlate }}</span></template>
      <template #cell-amount="{ row }"><span class="number">{{ formatMoney(row.amount) }}</span></template>
      <template #cell-fee="{ row }"><span class="muted">− {{ formatMoney(row.providerFee) }}</span></template>
      <template #cell-net="{ row }"><span class="number">{{ formatMoney(row.amount - row.providerFee) }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-muted);
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
