<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatMoney, type DailyRevenue } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatTiles, { type StatTile } from '@/components/StatTiles.vue'
import BarChart, { type BarItem } from '@/components/BarChart.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import LotGate from '@/components/LotGate.vue'
import { useOwnerLot } from '@/features/owner/useOwnerLot'
import { PERIOD_OPTIONS, dayLabel, usePeriod } from '@/features/owner/usePeriod'

const { activeLot, report } = useOwnerLot()
const { days, rows } = usePeriod(computed(() => report.value?.revenue ?? []))

const totalOf = (day: DailyRevenue) => day.reservations + day.overstay

const tiles = computed<StatTile[]>(() => {
  const reservations = rows.value.reduce((sum, d) => sum + d.reservations, 0)
  const overstay = rows.value.reduce((sum, d) => sum + d.overstay, 0)
  return [
    { label: 'Total del período', value: formatMoney(reservations + overstay), detail: `Últimos ${days.value} días` },
    { label: 'Reservas (app)', value: formatMoney(reservations), detail: 'Cobra la plataforma y te liquida' },
    { label: 'Excedentes (efectivo)', value: formatMoney(overstay), detail: 'Cobrados en la playa' },
    { label: 'Promedio por día', value: formatMoney(Math.round((reservations + overstay) / (rows.value.length || 1))) },
  ]
})

const chartItems = computed<BarItem[]>(() =>
  rows.value.map((d, index) => ({
    label: rows.value.length <= 14 || index % 3 === 0 ? dayLabel(d.date) : '',
    title: formatDate(d.date),
    value: totalOf(d),
    highlight: index === rows.value.length - 1,
  })),
)

const columns: DataTableColumn<DailyRevenue>[] = [
  { key: 'date', label: 'Día', sortBy: (d) => d.date },
  { key: 'reservations', label: 'Reservas (app)', sortBy: (d) => d.reservations, align: 'right' },
  { key: 'overstay', label: 'Excedentes (efectivo)', sortBy: (d) => d.overstay, align: 'right' },
  { key: 'total', label: 'Total', sortBy: totalOf, align: 'right' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Recaudación" :subtitle="activeLot?.name">
      <template #actions><SegmentedControl v-model="days" :options="PERIOD_OPTIONS" label="Período" /></template>
    </PageHeader>
    <LotGate>
      <div class="content">
        <StatTiles :tiles="tiles" />
        <PanelCard title="Recaudación por día">
          <BarChart :items="chartItems" :format="formatMoney" />
          <p class="footnote">Reservas cobradas por la app más excedentes cobrados en efectivo. La barra roja es hoy.</p>
        </PanelCard>
        <DataTable :columns="columns" :rows="rows" :row-key="(d) => d.date" :initial-sort="{ key: 'date', direction: 'desc' }">
          <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
          <template #cell-reservations="{ row }"><span class="number">{{ formatMoney(row.reservations) }}</span></template>
          <template #cell-overstay="{ row }"><span class="number">{{ formatMoney(row.overstay) }}</span></template>
          <template #cell-total="{ row }"><span class="number is-strong">{{ formatMoney(totalOf(row)) }}</span></template>
        </DataTable>
      </div>
    </LotGate>
  </section>
</template>

<style scoped>
.page,
.content {
  display: grid;
  gap: 20px;
}

.footnote {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.number.is-strong {
  color: var(--sp-text);
}
</style>
