<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useOccupancyStore } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

const HOURS = 8

const { upcomingReservations, checkedInToday, now } = storeToRefs(useOccupancyStore())

// Reservas activas (pendientes o ya llegadas) que se superponen con cada hora reloj.
const buckets = computed(() => {
  const start = new Date(now.value)
  start.setMinutes(0, 0, 0)
  const reservations = [...upcomingReservations.value, ...checkedInToday.value]

  return Array.from({ length: HOURS }, (_, index) => {
    const from = start.getTime() + index * 3_600_000
    const to = from + 3_600_000
    const count = reservations.filter(
      (r) => new Date(r.startsAt).getTime() < to && new Date(r.endsAt).getTime() > from,
    ).length
    return { hour: new Date(from).getHours(), count, isNow: index === 0 }
  })
})

const max = computed(() => Math.max(1, ...buckets.value.map((bucket) => bucket.count)))
const peak = computed(() =>
  buckets.value.reduce((best, bucket) => (bucket.count > best.count ? bucket : best)),
)

const hovered = ref<number | null>(null)

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}
</script>

<template>
  <PanelCard title="Reservas por hora">
    <template #actions>
      <span class="caption">Próximas {{ HOURS }} horas</span>
    </template>

    <div class="chart">
      <div
        v-for="(bucket, index) in buckets"
        :key="bucket.hour"
        class="column"
        @mouseenter="hovered = index"
        @mouseleave="hovered = null"
        @focusin="hovered = index"
        @focusout="hovered = null"
        tabindex="0"
        :aria-label="`${hourLabel(bucket.hour)}: ${bucket.count} reservas`"
      >
        <span
          v-if="hovered === index || (hovered === null && bucket === peak && bucket.count > 0)"
          class="value"
        >
          {{ bucket.count }}
        </span>
        <span
          class="bar"
          :class="{ 'is-now': bucket.isNow, 'is-hovered': hovered === index }"
          :style="{ height: `${(bucket.count / max) * 100}%` }"
        />
      </div>
    </div>

    <div class="axis">
      <span v-for="bucket in buckets" :key="bucket.hour" :class="{ 'is-now': bucket.isNow }">
        {{ bucket.isNow ? 'Ahora' : hourLabel(bucket.hour) }}
      </span>
    </div>

    <p class="footnote">
      Pico: <strong>{{ peak.count }} reservas</strong> a las {{ hourLabel(peak.hour) }}. Cada
      reserva ocupa capacidad durante toda su franja.
    </p>
  </PanelCard>
</template>

<style scoped>
.caption {
  font-size: 12px;
  color: var(--sp-text-faint);
}

.chart {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 2px;
  flex: 1;
  min-height: 160px;
  padding-top: 22px;
  border-bottom: 1px solid var(--sp-border-strong);
}

.column {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  outline: none;
  cursor: default;
}

.bar {
  width: min(28px, 70%);
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: var(--sp-text-faint);
  transition:
    height 400ms var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.bar.is-now {
  background: var(--sp-accent-hover);
}

.bar.is-hovered {
  background: var(--sp-text-muted);
}

.bar.is-now.is-hovered {
  background: #c22d40;
}

.value {
  position: absolute;
  top: -20px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.axis {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 2px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--sp-text-faint);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.axis .is-now {
  color: var(--sp-text);
  font-weight: 600;
}

.footnote {
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--sp-text-muted);
}

.footnote strong {
  color: var(--sp-text);
}
</style>
