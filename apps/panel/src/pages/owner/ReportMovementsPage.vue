<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, type DailyMovement } from '@sp/core'
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
const { days, rows } = usePeriod(computed(() => report.value?.movements ?? []))

const tiles = computed<StatTile[]>(() => {
  const entries = rows.value.reduce((sum, d) => sum + d.entries, 0)
  const withReservation = rows.value.reduce((sum, d) => sum + d.reservationArrivals, 0)
  const spaces = activeLot.value?.totalSpaces || 1
  return [
    { label: 'Ingresos de vehículos', value: entries.toLocaleString('es-AR'), detail: `Últimos ${days.value} días` },
    { label: 'Promedio por día', value: Math.round(entries / (rows.value.length || 1)).toLocaleString('es-AR') },
    { label: 'Rotación', value: (entries / (rows.value.length || 1) / spaces).toFixed(1), detail: 'Autos por cochera por día' },
    { label: 'Con reserva', value: `${entries ? Math.round((withReservation / entries) * 100) : 0}%`, detail: `${withReservation} llegadas con reserva` },
  ]
})

const chartItems = computed<BarItem[]>(() =>
  rows.value.map((d, index) => ({
    label: rows.value.length <= 14 || index % 3 === 0 ? dayLabel(d.date) : '',
    title: formatDate(d.date),
    value: d.entries,
    highlight: index === rows.value.length - 1,
  })),
)

const columns: DataTableColumn<DailyMovement>[] = [
  { key: 'date', label: 'Día', sortBy: (d) => d.date },
  { key: 'entries', label: 'Ingresos', sortBy: (d) => d.entries, align: 'right' },
  { key: 'exits', label: 'Egresos', sortBy: (d) => d.exits, align: 'right' },
  { key: 'reservations', label: 'Con reserva', sortBy: (d) => d.reservationArrivals, align: 'right' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Movimiento de vehículos" :subtitle="activeLot?.name">
      <template #actions><SegmentedControl v-model="days" :options="PERIOD_OPTIONS" label="Período" /></template>
    </PageHeader>
    <LotGate>
      <div class="content">
        <StatTiles :tiles="tiles" />
        <PanelCard title="Ingresos por día">
          <BarChart :items="chartItems" :format="(value) => `${value} ingresos`" />
          <p class="footnote">Cada vez que un sensor pasa de libre a ocupado cuenta como un ingreso. La barra roja es hoy.</p>
        </PanelCard>
        <DataTable :columns="columns" :rows="rows" :row-key="(d) => d.date" :initial-sort="{ key: 'date', direction: 'desc' }">
          <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
          <template #cell-entries="{ row }"><span class="number">{{ row.entries }}</span></template>
          <template #cell-exits="{ row }"><span class="number">{{ row.exits }}</span></template>
          <template #cell-reservations="{ row }"><span class="number">{{ row.reservationArrivals }}</span></template>
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
</style>
