<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Info } from 'lucide-vue-next'
import {
  formatDate,
  formatMoney,
  usePaymentsStore,
  usePlatformStore,
  type PendingSettlement,
  type Settlement,
  type SettlementRules,
} from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import RegisterSettlementDialog from '@/features/admin-finance/RegisterSettlementDialog.vue'
import { FREQUENCY } from '@/features/admin-finance/labels'
import { useToast } from '@/composables/useToast'

const paymentsStore = usePaymentsStore()
const { pendingByLot, settlements, rules } = storeToRefs(paymentsStore)
const platform = usePlatformStore()
const { lots, ownersById } = storeToRefs(platform)
const toast = useToast()
platform.load()

const lotOf = (lotId: string) => lots.value.find((lot) => lot.id === lotId)
const lotName = (lotId: string) => lotOf(lotId)?.name ?? lotId
const ownerName = (lotId: string) => {
  const ownerId = lotOf(lotId)?.ownerId
  return ownerId ? (ownersById.value[ownerId]?.name ?? '—') : '—'
}

// Reglas: hoy sin definir; quedan editables acá.
const rulesDraft = ref<{ percent: string; frequency: SettlementRules['frequency'] }>({ percent: '', frequency: null })
watch(
  rules,
  (value) => (rulesDraft.value = { percent: value.platformFeePercent?.toString() ?? '', frequency: value.frequency }),
  { immediate: true },
)
const percentError = computed(() => {
  if (!rulesDraft.value.percent.trim()) return ''
  const value = Number(rulesDraft.value.percent.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 && value <= 100 ? '' : 'Entre 0 y 100.'
})
const rulesDirty = computed(
  () =>
    rulesDraft.value.percent !== (rules.value.platformFeePercent?.toString() ?? '') ||
    rulesDraft.value.frequency !== rules.value.frequency,
)
function saveRules() {
  if (percentError.value) return
  const percent = rulesDraft.value.percent.trim()
  paymentsStore.saveRules({
    platformFeePercent: percent ? Number(percent.replace(',', '.')) : null,
    frequency: rulesDraft.value.frequency,
  })
  toast.show('Reglas de liquidación guardadas')
}
const rulesDefined = computed(() => rules.value.platformFeePercent !== null && rules.value.frequency !== null)

const totalPending = computed(() => pendingByLot.value.reduce((sum, item) => sum + item.amount, 0))

const pendingColumns: DataTableColumn<PendingSettlement>[] = [
  { key: 'lot', label: 'Playa', sortBy: (item) => lotName(item.lotId) },
  { key: 'owner', label: 'Dueño' },
  { key: 'since', label: 'Desde', sortBy: (item) => item.periodFrom ?? '', width: '110px' },
  { key: 'count', label: 'Pagos', sortBy: (item) => item.payments.length, align: 'right', width: '80px' },
  { key: 'net', label: 'Cobrado neto', sortBy: (item) => item.netCollected, align: 'right', width: '140px' },
  { key: 'fee', label: 'Comisión', align: 'right', width: '120px' },
  { key: 'amount', label: 'A transferir', sortBy: (item) => item.amount, align: 'right', width: '140px' },
  { key: 'actions', label: '', align: 'right', width: '170px' },
]

const historyColumns: DataTableColumn<Settlement>[] = [
  { key: 'paid', label: 'Fecha', sortBy: (s) => s.paidAt, width: '110px' },
  { key: 'lot', label: 'Playa', sortBy: (s) => lotName(s.lotId) },
  { key: 'period', label: 'Período', width: '200px' },
  { key: 'count', label: 'Pagos', align: 'right', width: '80px' },
  { key: 'amount', label: 'Transferido', sortBy: (s) => s.amount, align: 'right', width: '140px' },
  { key: 'reference', label: 'Transferencia', width: '150px' },
]

const selected = ref<PendingSettlement | null>(null)
const dialogOpen = ref(false)
function openRegister(item: PendingSettlement) {
  selected.value = item
  dialogOpen.value = true
}
</script>

<template>
  <section class="page">
    <PageHeader title="Liquidaciones" subtitle="Lo que la plataforma cobró por reservas y le tiene que transferir a cada playa." />

    <PanelCard title="Reglas de liquidación">
      <p v-if="!rulesDefined" class="notice">
        <Info :size="16" />
        Todavía no están definidas. Mientras tanto se calcula sin comisión de la plataforma.
      </p>
      <div class="rules">
        <label class="field">
          <span class="field__label">Comisión de la plataforma (%)</span>
          <input v-model="rulesDraft.percent" class="input" inputmode="decimal" placeholder="Sin definir" :aria-invalid="!!percentError" />
          <span v-if="percentError" class="field__error">{{ percentError }}</span>
          <span v-else class="field__hint">Sobre lo cobrado, después de la comisión del medio de pago.</span>
        </label>
        <label class="field">
          <span class="field__label">Frecuencia</span>
          <select v-model="rulesDraft.frequency" class="select">
            <option :value="null">Sin definir</option>
            <option v-for="(label, key) in FREQUENCY" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <button type="button" class="btn btn--primary rules__save" :disabled="!rulesDirty || !!percentError" @click="saveRules">
          Guardar reglas
        </button>
      </div>
    </PanelCard>

    <div class="block">
      <h2 class="block__title">Pendiente de transferir · {{ formatMoney(totalPending) }}</h2>
      <DataTable
        :columns="pendingColumns"
        :rows="pendingByLot"
        :row-key="(item) => item.lotId"
        :initial-sort="{ key: 'amount', direction: 'desc' }"
        empty-text="No hay nada pendiente: todas las playas están liquidadas."
      >
        <template #cell-lot="{ row }"><strong>{{ lotName(row.lotId) }}</strong></template>
        <template #cell-owner="{ row }"><span class="muted">{{ ownerName(row.lotId) }}</span></template>
        <template #cell-since="{ row }"><span class="muted">{{ row.periodFrom ? formatDate(row.periodFrom) : '—' }}</span></template>
        <template #cell-count="{ row }"><span class="number">{{ row.payments.length }}</span></template>
        <template #cell-net="{ row }"><span class="number">{{ formatMoney(row.netCollected) }}</span></template>
        <template #cell-fee="{ row }">
          <span class="muted">{{ row.platformFee === null ? 'Sin definir' : `− ${formatMoney(row.platformFee)}` }}</span>
        </template>
        <template #cell-amount="{ row }"><span class="number is-strong">{{ formatMoney(row.amount) }}</span></template>
        <template #cell-actions="{ row }">
          <button type="button" class="btn btn--sm btn--subtle" @click="openRegister(row)">Registrar transferencia</button>
        </template>
      </DataTable>
    </div>

    <div class="block">
      <h2 class="block__title">Historial</h2>
      <DataTable
        :columns="historyColumns"
        :rows="settlements"
        :row-key="(s) => s.id"
        :initial-sort="{ key: 'paid', direction: 'desc' }"
        empty-text="Todavía no se registró ninguna liquidación."
      >
        <template #cell-paid="{ row }"><span class="muted">{{ formatDate(row.paidAt) }}</span></template>
        <template #cell-lot="{ row }"><strong>{{ lotName(row.lotId) }}</strong></template>
        <template #cell-period="{ row }"><span class="muted">{{ formatDate(row.periodFrom) }} – {{ formatDate(row.periodTo) }}</span></template>
        <template #cell-count="{ row }"><span class="number">{{ row.paymentsCount }}</span></template>
        <template #cell-amount="{ row }"><span class="number">{{ formatMoney(row.amount) }}</span></template>
        <template #cell-reference="{ row }"><span class="mono">{{ row.reference }}</span></template>
      </DataTable>
    </div>

    <p class="footnote">
      Los excedentes que cobra el playero en efectivo quedan en la playa y no pasan por la plataforma. Si
      corresponde descontarlos o comisionarlos se define junto con las reglas.
    </p>

    <RegisterSettlementDialog v-model:open="dialogOpen" :pending="selected" :lot-name="selected ? lotName(selected.lotId) : ''" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px 12px;
  border: 1px solid rgb(226 163 54 / 0.35);
  border-radius: var(--sp-radius-sm);
  background: rgb(226 163 54 / 0.08);
  color: var(--sp-warning);
  font-size: 13px;
}

.rules {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
}

.rules__save {
  margin-top: 24px;
}

.block {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.block__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

.number.is-strong {
  font-size: 15px;
}

.footnote {
  margin: 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

@media (max-width: 800px) {
  .rules {
    grid-template-columns: 1fr;
  }

  .rules__save {
    margin-top: 0;
    justify-self: start;
  }
}
</style>
