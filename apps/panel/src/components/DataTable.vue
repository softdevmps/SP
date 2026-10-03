<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-vue-next'

export interface DataTableColumn<Row> {
  key: string
  label: string
  /** Valor por el que se ordena; si no se define, la columna no es ordenable. */
  sortBy?: (row: Row) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn<T>[]
    rows: T[]
    rowKey: (row: T) => string
    rowClass?: (row: T) => string | undefined
    initialSort?: { key: string; direction: 'asc' | 'desc' }
    emptyText?: string
  }>(),
  { emptyText: 'No hay datos para mostrar.' },
)

defineSlots<{
  toolbar?: () => unknown
  [cell: `cell-${string}`]: (props: { row: T }) => unknown
}>()

const PAGE_SIZES = [10, 25, 50]

const sortKey = ref(props.initialSort?.key ?? null)
const sortDirection = ref<'asc' | 'desc'>(props.initialSort?.direction ?? 'asc')
const pageSize = ref(PAGE_SIZES[0] as number)
const page = ref(1)

const sortedRows = computed(() => {
  const column = props.columns.find((candidate) => candidate.key === sortKey.value)
  if (!column?.sortBy) return props.rows
  const factor = sortDirection.value === 'asc' ? 1 : -1
  const sortBy = column.sortBy
  return [...props.rows].sort((a, b) => {
    const left = sortBy(a)
    const right = sortBy(b)
    return (left < right ? -1 : left > right ? 1 : 0) * factor
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / pageSize.value)))

const visibleRows = computed(() =>
  sortedRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)

const rangeLabel = computed(() => {
  const total = sortedRows.value.length
  if (!total) return 'Sin resultados'
  const from = (page.value - 1) * pageSize.value + 1
  const to = Math.min(page.value * pageSize.value, total)
  return `Mostrando ${from}–${to} de ${total}`
})

/** Páginas a mostrar: primera, última y las vecinas de la actual, con "…" en los saltos. */
const pageItems = computed<Array<number | 'gap'>>(() => {
  const pages = new Set([1, pageCount.value, page.value - 1, page.value, page.value + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount.value).sort((a, b) => a - b)
  const items: Array<number | 'gap'> = []
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1]
    if (previous !== undefined && p - previous > 1) items.push('gap')
    items.push(p)
  })
  return items
})

// Si cambia la cantidad de resultados (filtro, búsqueda) o el tamaño de página, se vuelve al
// principio. No se mira el array en sí para no perder la página en cada actualización en vivo.
watch([() => props.rows.length, pageSize], () => (page.value = 1))
watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

function toggleSort(column: DataTableColumn<T>) {
  if (!column.sortBy) return
  if (sortKey.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = column.key
    sortDirection.value = 'asc'
  }
  page.value = 1
}

function ariaSort(column: DataTableColumn<T>) {
  if (!column.sortBy) return undefined
  if (sortKey.value !== column.key) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="table-card">
    <div v-if="$slots.toolbar" class="toolbar"><slot name="toolbar" /></div>

    <div class="scroll">
      <table class="table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :style="{ width: column.width, textAlign: column.align ?? 'left' }"
              :aria-sort="ariaSort(column)"
            >
              <button
                v-if="column.sortBy"
                type="button"
                class="sort"
                :class="{ 'is-active': sortKey === column.key }"
                @click="toggleSort(column)"
              >
                {{ column.label }}
                <ArrowUp v-if="sortKey === column.key && sortDirection === 'asc'" :size="14" />
                <ArrowDown v-else-if="sortKey === column.key" :size="14" />
                <ChevronsUpDown v-else :size="14" class="sort__idle" />
              </button>
              <template v-else>{{ column.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="rowKey(row)" :class="rowClass?.(row)">
            <td
              v-for="column in columns"
              :key="column.key"
              :style="{ textAlign: column.align ?? 'left' }"
            >
              <slot :name="`cell-${column.key}`" :row="row" />
            </td>
          </tr>
          <tr v-if="!visibleRows.length">
            <td :colspan="columns.length" class="empty">{{ emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="footer">
      <span class="footer__range">{{ rangeLabel }}</span>

      <div class="footer__controls">
        <label class="page-size">
          Filas
          <select v-model.number="pageSize">
            <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>

        <nav class="pager" aria-label="Paginación">
          <button
            type="button"
            class="pager__button"
            :disabled="page === 1"
            aria-label="Página anterior"
            @click="page--"
          >
            <ChevronLeft :size="16" />
          </button>
          <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
            <span v-if="item === 'gap'" class="pager__gap">…</span>
            <button
              v-else
              type="button"
              class="pager__button"
              :class="{ 'is-current': item === page }"
              :aria-current="item === page ? 'page' : undefined"
              @click="page = item"
            >
              {{ item }}
            </button>
          </template>
          <button
            type="button"
            class="pager__button"
            :disabled="page === pageCount"
            aria-label="Página siguiente"
            @click="page++"
          >
            <ChevronRight :size="16" />
          </button>
        </nav>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* min-width: 0 → dentro de una grilla la tabla no empuja el ancho; se desplaza adentro de .scroll */
.table-card {
  min-width: 0;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--sp-border);
}

.scroll {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  padding: 10px 16px;
  background: var(--sp-surface-2);
  border-bottom: 1px solid var(--sp-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--sp-text-muted);
  white-space: nowrap;
}

.sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.sort:hover,
.sort.is-active {
  color: var(--sp-text);
}

.sort__idle {
  opacity: 0.45;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--sp-border);
  vertical-align: middle;
}

tbody tr {
  transition: background var(--sp-duration) var(--sp-ease);
}

tbody tr:hover {
  background: var(--sp-surface-2);
}

tbody tr:last-child td {
  border-bottom: 0;
}

.empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--sp-text-muted);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--sp-border);
  font-size: 13px;
  color: var(--sp-text-muted);
}

.footer__controls {
  display: flex;
  align-items: center;
  gap: 18px;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--sp-border-strong);
  border-radius: 6px;
  background: var(--sp-bg);
  color: var(--sp-text);
  font: inherit;
}

.pager {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pager__button {
  min-width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background var(--sp-duration) var(--sp-ease),
    color var(--sp-duration) var(--sp-ease);
}

.pager__button:hover:not(:disabled) {
  background: var(--sp-surface-2);
  color: var(--sp-text);
}

.pager__button.is-current {
  border-color: rgb(155 31 48 / 0.5);
  background: var(--sp-accent-soft);
  color: var(--sp-text);
  font-weight: 600;
}

.pager__button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pager__gap {
  padding: 0 4px;
}
</style>
