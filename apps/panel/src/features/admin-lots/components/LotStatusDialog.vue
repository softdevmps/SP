<script setup lang="ts">
import { computed } from 'vue'
import { usePlatformStore, type LotStatus, type PlatformLot } from '@sp/core'
import BaseDialog from '@/components/BaseDialog.vue'
import { useToast } from '@/composables/useToast'
import { LOT_STATUSES } from '../statuses'

const props = defineProps<{ lot: PlatformLot | null; target: LotStatus | null }>()
const open = defineModel<boolean>('open', { default: false })

const platform = usePlatformStore()
const toast = useToast()

const ACTIONS: Partial<Record<LotStatus, { title: string; button: string; danger?: boolean }>> = {
  active: { title: 'Activar playa', button: 'Activar' },
  suspended: { title: 'Suspender playa', button: 'Suspender', danger: true },
}

const action = computed(() => (props.target ? ACTIONS[props.target] : undefined))

function confirm() {
  if (!props.lot || !props.target) return
  platform.setStatus(props.lot.id, props.target)
  toast.show(`${props.lot.name} · ${LOT_STATUSES[props.target].label}`)
  open.value = false
}
</script>

<template>
  <BaseDialog v-model:open="open" :title="action?.title ?? 'Cambiar estado'">
    <template v-if="lot && target">
      <p class="lead">
        <strong>{{ lot.name }}</strong> pasa de
        <em>{{ LOT_STATUSES[lot.status].label }}</em> a <em>{{ LOT_STATUSES[target].label }}</em>.
      </p>
      <p class="description">{{ LOT_STATUSES[target].description }}</p>
      <p v-if="target === 'suspended'" class="warning">
        Las reservas ya pagadas siguen vigentes; solo se dejan de recibir nuevas.
      </p>
    </template>

    <template #footer>
      <button type="button" class="btn" @click="open = false">Cancelar</button>
      <button type="button" class="btn btn--primary" @click="confirm">{{ action?.button ?? 'Confirmar' }}</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lead {
  margin: 0 0 10px;
}

.lead em {
  font-style: normal;
  font-weight: 600;
}

.description {
  margin: 0;
  color: var(--sp-text-muted);
}

.warning {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: var(--sp-radius-sm);
  background: rgb(226 163 54 / 0.1);
  color: var(--sp-warning);
  font-size: 13px;
}
</style>
