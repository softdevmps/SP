<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDate, formatMoney, usePaymentsStore, type PendingSettlement } from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ pending: PendingSettlement | null; lotName: string }>()
const open = defineModel<boolean>('open', { default: false })

const payments = usePaymentsStore()
const toast = useToast()
const reference = ref('')
const submitted = ref(false)

watch(open, (value) => {
  if (!value) return
  reference.value = ''
  submitted.value = false
})

const error = computed(() => (reference.value.trim() ? '' : 'Ingresá el número de la transferencia.'))

function confirm() {
  submitted.value = true
  if (!props.pending || error.value) return
  const settlement = payments.registerSettlement(props.pending.lotId, reference.value)
  if (settlement) toast.show(`Liquidación registrada · ${props.lotName} · ${formatMoney(settlement.amount)}`)
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" title="Registrar liquidación">
    <template v-if="pending">
      <p class="lead">Registrá la transferencia hecha a <strong>{{ lotName }}</strong>.</p>
      <dl class="data">
        <div><dt>Pagos incluidos</dt><dd>{{ pending.payments.length }}</dd></div>
        <div><dt>Desde</dt><dd>{{ pending.periodFrom ? formatDate(pending.periodFrom) : '—' }}</dd></div>
        <div><dt>Cobrado neto</dt><dd>{{ formatMoney(pending.netCollected) }}</dd></div>
        <div>
          <dt>Comisión de la plataforma</dt>
          <dd>{{ pending.platformFee === null ? 'Sin definir' : `− ${formatMoney(pending.platformFee)}` }}</dd>
        </div>
        <div class="total"><dt>A transferir</dt><dd>{{ formatMoney(pending.amount) }}</dd></div>
      </dl>
      <label class="field">
        <span class="field__label">Número de transferencia</span>
        <input v-model="reference" class="input" placeholder="TRF-000000" :aria-invalid="submitted && !!error" />
        <span v-if="submitted && error" class="field__error">{{ error }}</span>
      </label>
    </template>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="button" class="btn btn--primary" @click="confirm">Registrar</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lead {
  margin: 0 0 14px;
  color: var(--sp-text-muted);
}

.lead strong {
  color: var(--sp-text);
}

.data {
  display: grid;
  gap: 8px;
  margin: 0 0 18px;
}

.data div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.data dt {
  color: var(--sp-text-muted);
}

.data dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.data .total {
  padding-top: 10px;
  border-top: 1px solid var(--sp-border);
}

.data .total dd {
  font-size: 18px;
}
</style>
