<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Building2, Wrench } from 'lucide-vue-next'
import { useActiveLotStore } from '@sp/core'

// Las pantallas de operación solo tienen sentido en una playa activa: si el usuario no tiene
// playas o la suya todavía se está instalando, se explica en lugar de mostrar datos vacíos.
const { activeLot } = storeToRefs(useActiveLotStore())
</script>

<template>
  <div v-if="!activeLot" class="gate">
    <span class="gate__icon"><Building2 :size="22" /></span>
    <strong>No tenés playas asignadas</strong>
    <p>Pedile al administrador de la plataforma que te asigne una playa.</p>
  </div>
  <div v-else-if="activeLot.status === 'onboarding'" class="gate">
    <span class="gate__icon"><Wrench :size="22" /></span>
    <strong>{{ activeLot.name }} está en instalación</strong>
    <p>Cuando los sensores estén funcionando vas a ver acá la ocupación, las reservas y los mensajes.</p>
  </div>
  <slot v-else />
</template>

<style scoped>
.gate {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 56px 24px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
  text-align: center;
}

.gate__icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 8px;
  border: 1px solid rgb(155 31 48 / 0.3);
  border-radius: 14px;
  background: var(--sp-accent-soft);
  color: var(--sp-accent-hover);
}

.gate p {
  margin: 0;
  color: var(--sp-text-muted);
}
</style>
