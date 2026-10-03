<script setup lang="ts">
import { ref, watch } from 'vue'
import { Copy } from 'lucide-vue-next'
import BaseDialog from '@/components/BaseDialog.vue'

const props = defineProps<{ title: string; username: string; password: string }>()
const open = defineModel<boolean>('open', { default: false })
const copied = ref(false)

watch(open, () => (copied.value = false))

async function copy() {
  try {
    await navigator.clipboard.writeText(props.password)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <BaseDialog v-model:open="open" :title="title">
    <p class="lead">Pasale estos datos a la persona. La contraseña es temporal: se le va a pedir cambiarla al ingresar.</p>
    <dl class="data">
      <div><dt>Usuario</dt><dd class="mono">{{ username }}</dd></div>
      <div>
        <dt>Contraseña temporal</dt>
        <dd class="password">
          <span class="mono">{{ password }}</span>
          <button type="button" class="btn btn--sm" @click="copy"><Copy :size="14" /> {{ copied ? 'Copiada' : 'Copiar' }}</button>
        </dd>
      </div>
    </dl>
    <p class="warning">Esta es la única vez que se muestra. Si se pierde, hay que restablecerla.</p>

    <template #footer>
      <button type="button" class="btn btn--primary" @click="open = false">Listo</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.lead {
  margin: 0 0 16px;
  color: var(--sp-text-muted);
}

.data {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 14px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-bg);
}

.data div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.data dt {
  color: var(--sp-text-muted);
}

.data dd {
  margin: 0;
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.password {
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--sp-warning);
}
</style>
