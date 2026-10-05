import { computed, ref, type Ref } from 'vue'

export const PERIOD_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
]

/** Últimos N días de una serie diaria (las series vienen ordenadas de la más vieja a hoy). */
export function usePeriod<T>(series: Ref<T[]>) {
  const days = ref(14)
  const rows = computed(() => series.value.slice(-days.value))
  return { days, rows }
}

export function dayLabel(iso: string) {
  const date = new Date(iso)
  return `${date.getDate()}/${date.getMonth() + 1}`
}
