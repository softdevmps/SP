<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDate } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'
import StatusPill from '@/components/StatusPill.vue'
import LotFormDialog from '@/features/admin-lots/components/LotFormDialog.vue'
import { LOT_STATUSES } from '@/features/admin-lots/statuses'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'

const { lot, owner, layout, devices, sensors, isSubscribed } = useAdminLot()
const editOpen = ref(false)

const hardware = computed(() => ({
  devicesOnline: devices.value.filter((device) => device.online).length,
  sensorsOk: sensors.value.filter((sensor) => sensor.health === 'ok').length,
  unassigned: sensors.value.filter((sensor) => !sensor.spaceId).length,
  floors: layout.value?.floors.length ?? 0,
}))
</script>

<template>
  <div v-if="lot" class="grid">
    <PanelCard title="Datos de la playa">
      <template #actions>
        <button type="button" class="btn btn--sm" @click="editOpen = true">Editar</button>
      </template>
      <dl class="data">
        <div><dt>Nombre</dt><dd>{{ lot.name }}</dd></div>
        <div><dt>Dirección</dt><dd>{{ lot.address }}</dd></div>
        <div><dt>Barrio</dt><dd>{{ lot.neighborhood || '—' }}</dd></div>
        <div><dt>Ubicación</dt><dd class="mono">{{ lot.location.lat }}, {{ lot.location.lng }}</dd></div>
        <div><dt>Cocheras</dt><dd>{{ lot.totalSpaces }}</dd></div>
        <div><dt>Alta en la plataforma</dt><dd>{{ formatDate(lot.createdAt) }}</dd></div>
        <div v-if="lot.mqttCode"><dt>Código para los equipos</dt><dd class="mono">{{ lot.mqttCode }}</dd></div>
      </dl>
    </PanelCard>

    <div class="side">
      <PanelCard title="Estado">
        <StatusPill :label="LOT_STATUSES[lot.status].label" :tone="LOT_STATUSES[lot.status].tone" />
        <p class="muted">{{ LOT_STATUSES[lot.status].description }}</p>
      </PanelCard>

      <PanelCard title="Dueño">
        <dl v-if="owner" class="data">
          <div><dt>Nombre</dt><dd>{{ owner.name }}</dd></div>
          <div><dt>Email</dt><dd>{{ owner.email }}</dd></div>
          <div><dt>Teléfono</dt><dd>{{ owner.phone }}</dd></div>
        </dl>
        <p v-else class="muted">Sin dueño asignado.</p>
      </PanelCard>

      <PanelCard v-if="isSubscribed" title="Instalación">
        <dl class="data">
          <div><dt>Pisos en el plano</dt><dd>{{ hardware.floors }}</dd></div>
          <div><dt>Equipos en línea</dt><dd>{{ hardware.devicesOnline }} de {{ devices.length }}</dd></div>
          <div><dt>Sensores funcionando</dt><dd>{{ hardware.sensorsOk }} de {{ sensors.length }}</dd></div>
          <div v-if="hardware.unassigned">
            <dt>Sensores sin cochera</dt><dd class="is-warning">{{ hardware.unassigned }}</dd>
          </div>
        </dl>
      </PanelCard>
    </div>

    <LotFormDialog v-model:open="editOpen" :lot="lot" />
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.side {
  display: grid;
  gap: 20px;
}

.data {
  display: grid;
  gap: 12px;
  margin: 0;
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
  text-align: right;
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}

.is-warning {
  color: var(--sp-warning);
}

.muted {
  margin: 10px 0 0;
  color: var(--sp-text-muted);
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
