<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Info } from 'lucide-vue-next'
import { usePaymentsStore, type SettlementRules } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import { FREQUENCY } from '@/features/admin-finance/labels'
import { useToast } from '@/composables/useToast'

const paymentsStore = usePaymentsStore()
const { rules } = storeToRefs(paymentsStore)
const toast = useToast()

// Todavía sin definir: quedan editables y vacías.
const draft = ref<{ percent: string; frequency: SettlementRules['frequency'] }>({ percent: '', frequency: null })
watch(
  rules,
  (value) => (draft.value = { percent: value.platformFeePercent?.toString() ?? '', frequency: value.frequency }),
  { immediate: true },
)

const percentError = computed(() => {
  if (!draft.value.percent.trim()) return ''
  const value = Number(draft.value.percent.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 && value <= 100 ? '' : 'Entre 0 y 100.'
})
const isDirty = computed(
  () =>
    draft.value.percent !== (rules.value.platformFeePercent?.toString() ?? '') ||
    draft.value.frequency !== rules.value.frequency,
)
const rulesDefined = computed(() => rules.value.platformFeePercent !== null && rules.value.frequency !== null)

function save() {
  if (percentError.value) return
  const percent = draft.value.percent.trim()
  paymentsStore.saveRules({
    platformFeePercent: percent ? Number(percent.replace(',', '.')) : null,
    frequency: draft.value.frequency,
  })
  toast.show('Reglas de liquidación guardadas')
}
</script>

<template>
  <section class="page">
    <PageHeader title="Reglas de liquidación" subtitle="Cuánto se queda la plataforma y cada cuánto se le transfiere a cada playa." />

    <PanelCard class="card">
      <p v-if="!rulesDefined" class="notice">
        <Info :size="16" />
        Todavía no están definidas. Mientras tanto se calcula sin comisión de la plataforma.
      </p>
      <div class="form-grid">
        <label class="field">
          <span class="field__label">Comisión de la plataforma (%)</span>
          <input v-model="draft.percent" class="input" inputmode="decimal" placeholder="Sin definir" :aria-invalid="!!percentError" />
          <span v-if="percentError" class="field__error">{{ percentError }}</span>
          <span v-else class="field__hint">Sobre lo cobrado, después de la comisión del medio de pago.</span>
        </label>
        <label class="field">
          <span class="field__label">Frecuencia</span>
          <select v-model="draft.frequency" class="select">
            <option :value="null">Sin definir</option>
            <option v-for="(label, key) in FREQUENCY" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
      </div>
      <p class="footnote">
        Los excedentes que cobra el playero en efectivo quedan en la playa. Si se descuentan o comisionan se
        define junto con estas reglas.
      </p>
      <div class="actions">
        <button type="button" class="btn btn--primary" :disabled="!isDirty || !!percentError" @click="save">Guardar reglas</button>
      </div>
    </PanelCard>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.card {
  max-width: 760px;
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

.footnote {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
