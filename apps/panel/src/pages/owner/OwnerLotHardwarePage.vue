<script setup lang="ts">
import { computed } from 'vue'
import { Info, Server } from 'lucide-vue-next'
import { formatAgo, type Device, type HardwareAlert } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import StatusPill from '@/components/StatusPill.vue'
import { SEVERITY } from '@/features/admin-hardware/alertMeta'
import { DEVICE_TYPES, signalQuality } from '@/features/admin-hardware/labels'
import { useOwnerLot } from '@/features/owner/useOwnerLot'
import { useNow } from '@/composables/useNow'

// Solo lectura: los equipos los instala y controla el admin de plataforma.
const { activeLot, devices, sensors, alerts } = useOwnerLot()
const now = useNow()

const subtitle = computed(() => {
  if (!activeLot.value) return undefined
  const ok = sensors.value.filter((s) => s.health === 'ok').length
  const count = devices.value.length
  return `${activeLot.value.name} · ${count} ${count === 1 ? 'equipo' : 'equipos'} · ${ok} de ${sensors.value.length} sensores funcionando`
})

/** Números de cada equipo: sus sensores y sus problemas abiertos. */
function stats(device: Device) {
  const own = sensors.value.filter((sensor) => sensor.deviceId === device.id)
  const ok = own.filter((sensor) => sensor.health === 'ok').length
  const problems = alerts.value.filter((alert) => alert.deviceId === device.id && alert.severity !== 'info')
  return {
    ok,
    total: own.length,
    percent: own.length ? Math.round((ok / own.length) * 100) : 0,
    problems: problems.length,
    critical: problems.some((alert) => alert.severity === 'critical'),
  }
}

const columns: DataTableColumn<HardwareAlert>[] = [
  { key: 'severity', label: 'Severidad', width: '150px' },
  { key: 'alert', label: 'Problema' },
  { key: 'since', label: 'Último dato', sortBy: (a) => a.since ?? '', width: '170px' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Equipos y sensores" :subtitle="subtitle" />

    <article v-for="device in devices" :key="device.id" class="device">
      <header class="device__head">
        <span class="device__icon"><Server :size="20" /></span>
        <span class="device__title">
          <strong>{{ device.name }}</strong>
          <span>{{ DEVICE_TYPES[device.type] }}</span>
        </span>
        <StatusPill :label="device.online ? 'En línea' : 'Sin conexión'" :tone="device.online ? 'success' : 'danger'" />
      </header>

      <dl class="metrics">
        <div>
          <dt>Último contacto</dt>
          <dd>{{ device.lastSeenAt ? formatAgo(device.lastSeenAt, now) : 'Nunca' }}</dd>
        </div>
        <div>
          <dt>Señal 4G</dt>
          <dd v-if="device.telemetry?.signal4gDbm">
            {{ signalQuality(device.telemetry.signal4gDbm).label }}
            <small>{{ device.telemetry.signal4gDbm }} dBm</small>
          </dd>
          <dd v-else>Por cable</dd>
        </div>
        <div>
          <dt>Sensores funcionando</dt>
          <dd>{{ stats(device).ok }} <small>de {{ stats(device).total }}</small></dd>
          <span class="bar" aria-hidden="true"><span :style="{ width: `${stats(device).percent}%` }" /></span>
        </div>
        <div>
          <dt>Problemas abiertos</dt>
          <dd :class="{ 'is-danger': stats(device).critical, 'is-warning': stats(device).problems && !stats(device).critical }">
            {{ stats(device).problems }}
          </dd>
        </div>
      </dl>
    </article>

    <p v-if="!devices.length" class="empty">Esta playa todavía no tiene equipos instalados.</p>

    <div class="block">
      <div class="block__head">
        <h2 class="block__title">Problemas</h2>
        <p class="note">
          <Info :size="15" />
          El administrador de la plataforma ya está al tanto y se encarga de resolverlos.
        </p>
      </div>
      <DataTable :columns="columns" :rows="alerts" :row-key="(a) => a.id" empty-text="No hay problemas: todo el hardware responde.">
        <template #cell-severity="{ row }"><StatusPill :label="SEVERITY[row.severity].label" :tone="SEVERITY[row.severity].tone" /></template>
        <template #cell-alert="{ row }">
          <span class="alert"><strong>{{ row.title }}</strong><span>{{ row.detail }}</span></span>
        </template>
        <template #cell-since="{ row }"><span class="muted">{{ row.since ? formatAgo(row.since, now) : '—' }}</span></template>
      </DataTable>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.device {
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.device__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sp-border);
}

.device__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  color: var(--sp-text-muted);
}

.device__title {
  flex: 1;
  display: grid;
  min-width: 0;
}

.device__title span {
  font-size: 12px;
  color: var(--sp-text-muted);
}

/* Cuatro números del equipo en una fila, separados por líneas verticales */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
}

.metrics > div {
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 16px 20px;
}

.metrics > div + div {
  border-left: 1px solid var(--sp-border);
}

.metrics dt {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.metrics dd {
  margin: 0;
  font-family: var(--sp-font-display);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.metrics dd small {
  font-family: var(--sp-font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--sp-text-muted);
}

.metrics dd.is-danger {
  color: #f08a8d;
}

.metrics dd.is-warning {
  color: var(--sp-warning);
}

.bar {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--sp-surface-3);
}

.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--sp-free);
}

.empty {
  margin: 0;
  padding: 32px;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius);
  text-align: center;
  color: var(--sp-text-muted);
}

.block {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.block__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-text-muted);
}

.note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

.muted,
.alert span {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.alert {
  display: grid;
}

@media (max-width: 900px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metrics > div:nth-child(3) {
    border-left: 0;
  }

  .metrics > div:nth-child(n + 3) {
    border-top: 1px solid var(--sp-border);
  }
}
</style>
