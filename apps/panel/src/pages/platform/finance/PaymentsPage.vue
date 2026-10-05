<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { formatDate, formatMoney, formatTime, usePaymentsStore, usePlatformStore, type Payment, type PaymentStatus } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StatusPill from '@/components/StatusPill.vue'
import { PAYMENT_METHOD, PAYMENT_STATUS, periodStarts } from '@/features/admin-finance/labels'

const { payments } = storeToRefs(usePaymentsStore())
const platform = usePlatformStore()
const { lots } = storeToRefs(platform)
platform.load()

const lotName = (lotId: string) => lots.value.find((lot) => lot.id === lotId)?.name ?? lotId

const stats = computed(() => {
  const { today, month } = periodStarts()
  const approved = payments.value.filter((p) => p.status === 'approved')
  const since = (from: number) => approved.filter((p) => new Date(p.createdAt).getTime() >= from)
  const sum = (list: Payment[]) => list.reduce((total, p) => total + p.amount, 0)
  return [
    { label: 'Cobrado hoy', value: formatMoney(sum(since(today))), detail: `${since(today).length} pagos` },
    { label: 'Cobrado este mes', value: formatMoney(sum(since(month))), detail: `${since(month).length} pagos` },
    {
      label: 'Comisión del medio de pago (mes)',
      value: formatMoney(since(month).reduce((total, p) => total + p.providerFee, 0)),
      detail: 'Mercado Pago',
    },
    {
      label: 'Rechazados este mes',
      value: String(payments.value.filter((p) => p.status === 'rejected' && new Date(p.createdAt).getTime() >= month).length),
      detail: 'No generan reserva',
    },
  ]
})

type TabKey = 'all' | PaymentStatus
const activeTab = ref<TabKey>('all')
const lotFilter = ref('')
const search = ref('')

const scoped = computed(() => payments.value.filter((p) => !lotFilter.value || p.lotId === lotFilter.value))

const tabs = computed<TableTab<TabKey>[]>(() => [
  { key: 'all', label: 'Todos', count: scoped.value.length },
  { key: 'approved', label: 'Aprobados', count: scoped.value.filter((p) => p.status === 'approved').length, tone: 'success' },
  { key: 'pending', label: 'Pendientes', count: scoped.value.filter((p) => p.status === 'pending').length, tone: 'warning' },
  { key: 'rejected', label: 'Rechazados', count: scoped.value.filter((p) => p.status === 'rejected').length, tone: 'danger' },
])

const rows = computed(() => {
  const term = search.value.trim().toLowerCase()
  return scoped.value
    .filter((p) => activeTab.value === 'all' || p.status === activeTab.value)
    .filter(
      (p) =>
        !term ||
        [p.reservationCode, p.providerPaymentId, p.driverName, p.driverEmail, p.vehiclePlate].some((v) =>
          v.toLowerCase().includes(term),
        ),
    )
})

const subscribedLots = computed(() => lots.value.filter((lot) => lot.status !== 'not_subscribed'))

const columns: DataTableColumn<Payment>[] = [
  { key: 'date', label: 'Fecha', sortBy: (p) => p.createdAt, width: '150px' },
  { key: 'lot', label: 'Playa', sortBy: (p) => lotName(p.lotId) },
  { key: 'driver', label: 'Conductor', sortBy: (p) => p.driverName.toLowerCase() },
  { key: 'reservation', label: 'Reserva', sortBy: (p) => p.reservationCode, width: '120px' },
  { key: 'method', label: 'Medio', width: '170px' },
  { key: 'amount', label: 'Monto', sortBy: (p) => p.amount, align: 'right', width: '110px' },
  { key: 'fee', label: 'Comisión MP', sortBy: (p) => p.providerFee, align: 'right', width: '120px' },
  { key: 'net', label: 'Neto', sortBy: (p) => p.amount - p.providerFee, align: 'right', width: '110px' },
  { key: 'status', label: 'Estado', sortBy: (p) => p.status, width: '120px' },
  { key: 'settled', label: 'Liquidado', width: '110px' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Pagos" subtitle="Pagos de reservas cobrados por la plataforma." />

    <dl class="stats">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
        <span>{{ stat.detail }}</span>
      </div>
    </dl>

    <DataTable :columns="columns" :rows="rows" :row-key="(p) => p.id" :initial-sort="{ key: 'date', direction: 'desc' }">
      <template #toolbar>
        <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar pagos" />
        <div class="filters">
          <select v-model="lotFilter" class="select select--sm" aria-label="Playa">
            <option value="">Todas las playas</option>
            <option v-for="lot in subscribedLots" :key="lot.id" :value="lot.id">{{ lot.name }}</option>
          </select>
          <TableSearch v-model="search" placeholder="Buscar conductor, email, patente, código o ID" />
        </div>
      </template>

      <template #cell-date="{ row }">
        <span class="date">{{ formatDate(row.createdAt) }} <span>{{ formatTime(row.createdAt) }}</span></span>
      </template>
      <template #cell-lot="{ row }">{{ lotName(row.lotId) }}</template>
      <template #cell-driver="{ row }">
        <span class="driver"><strong>{{ row.driverName }}</strong><span>{{ row.driverEmail }}</span></span>
      </template>
      <template #cell-reservation="{ row }">
        <span class="driver"><span class="mono">{{ row.reservationCode }}</span><span>{{ row.vehiclePlate }}</span></span>
      </template>
      <template #cell-method="{ row }">
        <span class="method">{{ PAYMENT_METHOD[row.method] }}<span class="mono">#{{ row.providerPaymentId }}</span></span>
      </template>
      <template #cell-amount="{ row }"><span class="number">{{ formatMoney(row.amount) }}</span></template>
      <template #cell-fee="{ row }"><span class="muted">{{ row.providerFee ? `− ${formatMoney(row.providerFee)}` : '—' }}</span></template>
      <template #cell-net="{ row }">
        <span class="number">{{ row.status === 'approved' ? formatMoney(row.amount - row.providerFee) : '—' }}</span>
      </template>
      <template #cell-status="{ row }">
        <StatusPill :label="PAYMENT_STATUS[row.status].label" :tone="PAYMENT_STATUS[row.status].tone" />
      </template>
      <template #cell-settled="{ row }">
        <span v-if="row.status !== 'approved'" class="muted">—</span>
        <StatusPill v-else-if="row.settlementId" label="Sí" tone="success" />
        <StatusPill v-else label="Pendiente" tone="muted" />
      </template>
    </DataTable>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.stat {
  padding: 16px 18px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.stat dt,
.stat span {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.stat dd {
  margin: 6px 0 4px;
  font-family: var(--sp-font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.select--sm {
  width: auto;
  height: 34px;
  font-size: 13px;
}

.date span,
.muted {
  color: var(--sp-text-muted);
}

.method,
.driver {
  display: grid;
}

.driver span:last-child {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.method .mono {
  font-size: 11px;
  color: var(--sp-text-faint);
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1000px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
