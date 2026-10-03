<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatMoney, type Payment } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

const props = defineProps<{ payments: Payment[]; days?: number }>()
const DAYS = computed(() => props.days ?? 14)

// Cobrado (pagos aprobados) por día, de hace N días a hoy. Una sola serie: sin leyenda.
const buckets = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: DAYS.value }, (_, index) => {
    const from = new Date(start)
    from.setDate(start.getDate() - (DAYS.value - 1 - index))
    const to = new Date(from)
    to.setDate(from.getDate() + 1)
    const total = props.payments
      .filter((p) => p.status === 'approved')
      .filter((p) => {
        const at = new Date(p.createdAt).getTime()
        return at >= from.getTime() && at < to.getTime()
      })
      .reduce((sum, p) => sum + p.amount, 0)
    return { date: from, total, isToday: index === DAYS.value - 1 }
  })
})

const max = computed(() => Math.max(1, ...buckets.value.map((bucket) => bucket.total)))
const peak = computed(() => buckets.value.reduce((best, bucket) => (bucket.total > best.total ? bucket : best)))
const hovered = ref<number | null>(null)

const dayLabel = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}`
</script>

<template>
  <PanelCard title="Cobrado por día">
    <template #actions><span class="caption">Últimos {{ DAYS }} días</span></template>

    <div class="chart">
      <div
        v-for="(bucket, index) in buckets"
        :key="bucket.date.toISOString()"
        class="column"
        tabindex="0"
        :aria-label="`${dayLabel(bucket.date)}: ${formatMoney(bucket.total)}`"
        @mouseenter="hovered = index"
        @mouseleave="hovered = null"
        @focusin="hovered = index"
        @focusout="hovered = null"
      >
        <span v-if="hovered === index" class="tooltip">
          <strong>{{ formatMoney(bucket.total) }}</strong>
          <span>{{ bucket.isToday ? 'Hoy' : dayLabel(bucket.date) }}</span>
        </span>
        <span
          class="bar"
          :class="{ 'is-today': bucket.isToday, 'is-hovered': hovered === index }"
          :style="{ height: `${(bucket.total / max) * 100}%` }"
        />
      </div>
    </div>
    <div class="axis">
      <span v-for="(bucket, index) in buckets" :key="index" :class="{ 'is-today': bucket.isToday }">
        {{ index % 2 === DAYS % 2 || bucket.isToday ? (bucket.isToday ? 'Hoy' : dayLabel(bucket.date)) : '' }}
      </span>
    </div>
    <p class="footnote">
      Mejor día: <strong>{{ formatMoney(peak.total) }}</strong> el {{ dayLabel(peak.date) }}. Solo pagos aprobados.
    </p>
  </PanelCard>
</template>

<style scoped>
.caption {
  font-size: 12px;
  color: var(--sp-text-faint);
}

.chart {
  flex: 1;
  min-height: 180px;
  display: grid;
  grid-template-columns: repeat(v-bind(DAYS), minmax(0, 1fr));
  gap: 2px;
  padding-top: 40px;
  border-bottom: 1px solid var(--sp-border-strong);
}

.column {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  outline: none;
}

.bar {
  width: min(22px, 70%);
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: var(--sp-text-faint);
  transition:
    height 400ms var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.bar.is-today {
  background: var(--sp-accent-hover);
}

.bar.is-hovered {
  background: var(--sp-text-muted);
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  z-index: 2;
  display: grid;
  justify-items: center;
  padding: 6px 10px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  box-shadow: var(--sp-shadow);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

.tooltip span {
  color: var(--sp-text-muted);
}

.axis {
  display: grid;
  grid-template-columns: repeat(v-bind(DAYS), minmax(0, 1fr));
  gap: 2px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--sp-text-faint);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.axis .is-today {
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
