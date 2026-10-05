<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatTiles, { type StatTile } from '@/components/StatTiles.vue'
import BarChart, { type BarItem } from '@/components/BarChart.vue'
import LotGate from '@/components/LotGate.vue'
import { useOwnerLot } from '@/features/owner/useOwnerLot'

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const ORDER = [1, 2, 3, 4, 5, 6, 0] // de lunes a domingo

const { activeLot, report } = useOwnerLot()

const byHour = computed(() => report.value?.byHour ?? [])
const byWeekday = computed(() => ORDER.map((day) => report.value?.byWeekday.find((b) => b.key === day)).filter(Boolean) as { key: number; percent: number }[])

const tiles = computed<StatTile[]>(() => {
  if (!byHour.value.length) return []
  const open = byHour.value.filter((b) => b.key >= 7 && b.key < 22)
  const average = Math.round(open.reduce((sum, b) => sum + b.percent, 0) / open.length)
  const peak = byHour.value.reduce((best, b) => (b.percent > best.percent ? b : best))
  const busiest = byWeekday.value.reduce((best, b) => (b.percent > best.percent ? b : best))
  const quietest = byWeekday.value.reduce((best, b) => (b.percent < best.percent ? b : best))
  return [
    { label: 'Ocupación promedio', value: `${average}%`, detail: 'De 7 a 22 h' },
    { label: 'Hora pico', value: `${String(peak.key).padStart(2, '0')}:00`, detail: `${peak.percent}% ocupada` },
    { label: 'Día más ocupado', value: WEEKDAYS[busiest.key] ?? '', detail: `${busiest.percent}% en promedio` },
    { label: 'Día más tranquilo', value: WEEKDAYS[quietest.key] ?? '', detail: `${quietest.percent}% en promedio` },
  ]
})

const hourItems = computed<BarItem[]>(() =>
  byHour.value.map((b) => ({
    label: b.key % 3 === 0 ? String(b.key) : '',
    title: `${String(b.key).padStart(2, '0')}:00`,
    value: b.percent,
  })),
)
const weekdayItems = computed<BarItem[]>(() =>
  byWeekday.value.map((b) => ({ label: (WEEKDAYS[b.key] ?? '').slice(0, 3), title: WEEKDAYS[b.key] ?? '', value: b.percent })),
)
</script>

<template>
  <section class="page">
    <PageHeader title="Ocupación" :subtitle="activeLot ? `${activeLot.name} · últimos 30 días` : undefined" />
    <LotGate>
      <div class="content">
        <StatTiles :tiles="tiles" />
        <div class="row">
          <PanelCard title="Por hora del día">
            <BarChart :items="hourItems" :max="100" :format="(value) => `${value}% ocupada`" />
          </PanelCard>
          <PanelCard title="Por día de la semana">
            <BarChart :items="weekdayItems" :max="100" :format="(value) => `${value}% ocupada`" />
          </PanelCard>
        </div>
        <p class="footnote">Ocupación según los sensores: porcentaje de cocheras ocupadas en cada franja.</p>
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

.row {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 20px;
  align-items: stretch;
}

.footnote {
  margin: 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

@media (max-width: 1100px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
