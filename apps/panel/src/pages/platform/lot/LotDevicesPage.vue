<script setup lang="ts">
import { ref } from 'vue'
import { Cable, Plus, TriangleAlert } from 'lucide-vue-next'
import { formatAgo } from '@sp/core'
import StatusPill from '@/components/StatusPill.vue'
import AddDeviceDialog from '@/features/admin-hardware/components/AddDeviceDialog.vue'
import { DEVICE_TYPES, formatUptime, signalQuality } from '@/features/admin-hardware/labels'
import { useAdminLot } from '@/features/admin-lots/useAdminLot'
import { useNow } from '@/composables/useNow'

const { lot, devices, sensors } = useAdminLot()
const now = useNow()
const addOpen = ref(false)

function sensorsOn(deviceId: string, port: number) {
  return sensors.value.filter((sensor) => sensor.deviceId === deviceId && sensor.port === port)
}

function faultsOn(deviceId: string, port: number) {
  return sensorsOn(deviceId, port).filter((sensor) => sensor.health !== 'ok').length
}
</script>

<template>
  <div v-if="lot" class="devices">
    <div class="toolbar">
      <p class="summary">
        {{ devices.filter((d) => d.online).length }} de {{ devices.length }} equipos en línea ·
        {{ sensors.length }} sensores conectados
      </p>
      <button type="button" class="btn" @click="addOpen = true"><Plus :size="16" /> Agregar equipo</button>
    </div>

    <article v-for="device in devices" :key="device.id" class="device">
      <header class="device__header">
        <div>
          <div class="device__title">
            <h3>{{ device.name }}</h3>
            <StatusPill :label="device.online ? 'En línea' : 'Sin conexión'" :tone="device.online ? 'success' : 'danger'" />
          </div>
          <p class="device__meta">
            {{ DEVICE_TYPES[device.type] }} · <span class="mono">{{ device.code }}</span>
          </p>
        </div>
        <p class="device__seen">
          {{ device.lastSeenAt ? `Último contacto ${formatAgo(device.lastSeenAt, now)}` : 'Nunca se conectó' }}
        </p>
      </header>

      <dl v-if="device.telemetry" class="telemetry">
        <div>
          <dt>Encendido hace</dt>
          <dd>{{ formatUptime(device.telemetry.uptimeSeconds) }}</dd>
        </div>
        <div>
          <dt>Señal 4G</dt>
          <dd v-if="device.telemetry.signal4gDbm !== null">
            {{ device.telemetry.signal4gDbm }} dBm
            <StatusPill
              :label="signalQuality(device.telemetry.signal4gDbm).label"
              :tone="signalQuality(device.telemetry.signal4gDbm).tone"
            />
          </dd>
          <dd v-else>Por cable</dd>
        </div>
        <div>
          <dt>Temperatura CPU</dt>
          <dd>{{ device.telemetry.cpuTempC }} °C</dd>
        </div>
        <div>
          <dt>Memoria en uso</dt>
          <dd>{{ device.telemetry.ramPercent }}%</dd>
        </div>
      </dl>

      <div class="ports">
        <div v-for="port in device.ports" :key="port.number" class="port" :class="{ 'is-alert': !port.ok }">
          <span class="port__icon"><Cable :size="16" /></span>
          <div class="port__body">
            <strong>Línea {{ port.number }}</strong>
            <span>
              {{ sensorsOn(device.id, port.number).length }} sensores
              <template v-if="faultsOn(device.id, port.number)"> · {{ faultsOn(device.id, port.number) }} con falla</template>
            </span>
            <span v-if="port.alert" class="port__alert"><TriangleAlert :size="13" /> {{ port.alert }}</span>
          </div>
          <RouterLink
            :to="{ name: 'admin-lot-sensors', params: { lotId: lot.id }, query: { equipo: device.id, linea: port.number } }"
            class="btn btn--sm"
          >
            Ver sensores
          </RouterLink>
        </div>
      </div>
    </article>

    <p v-if="!devices.length" class="empty">Esta playa todavía no tiene equipos instalados.</p>

    <AddDeviceDialog v-model:open="addOpen" :lot-id="lot.id" />
  </div>
</template>

<style scoped>
.devices {
  display: grid;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.summary {
  margin: 0;
  color: var(--sp-text-muted);
}

.device {
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.device__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sp-border);
}

.device__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.device__title h3 {
  margin: 0;
  font-size: 16px;
}

.device__meta,
.device__seen {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}

.telemetry {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sp-border);
}

.telemetry dt {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.telemetry dd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ports {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 20px;
}

.port {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
}

.port.is-alert {
  border-color: rgb(226 163 54 / 0.4);
}

.port__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-3);
  color: var(--sp-text-muted);
}

.port.is-alert .port__icon {
  color: var(--sp-warning);
}

.port__body {
  flex: 1;
  display: grid;
  min-width: 0;
  font-size: 13px;
}

.port__body span {
  color: var(--sp-text-muted);
}

.port__alert {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: var(--sp-warning) !important;
}

.empty {
  margin: 0;
  padding: 32px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius);
  text-align: center;
  color: var(--sp-text-muted);
}

@media (max-width: 900px) {
  .telemetry,
  .ports {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .ports {
    grid-template-columns: 1fr;
  }
}
</style>
