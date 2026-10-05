<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { formatAgo, type PlatformLot } from '@sp/core'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import StatusPill from '@/components/StatusPill.vue'
import { LOT_STATUSES } from '@/features/admin-lots/statuses'
import { useAllLotsHardware } from '@/features/admin-hardware/useAllLotsHardware'
import { useNow } from '@/composables/useNow'

const { lots, devices, sensors, alerts } = useAllLotsHardware()
const now = useNow()

const subscribedLots = computed(() => lots.value.filter((lot) => lot.status !== 'not_subscribed'))

function lotHealth(lot: PlatformLot) {
  const lotDevices = devices.value.filter((device) => device.lotId === lot.id)
  const lotSensors = sensors.value.filter((sensor) => sensor.lotId === lot.id)
  const lotAlerts = alerts.value.filter((alert) => alert.lotId === lot.id)
  return {
    devicesOnline: lotDevices.filter((d) => d.online).length,
    devices: lotDevices.length,
    sensorsOk: lotSensors.filter((s) => s.health === 'ok').length,
    sensors: lotSensors.length,
    critical: lotAlerts.filter((a) => a.severity === 'critical').length,
    warnings: lotAlerts.filter((a) => a.severity === 'warning').length,
    lastSeen: lotDevices.map((d) => d.lastSeenAt).filter(Boolean).sort().pop() ?? null,
  }
}

const lotColumns: DataTableColumn<PlatformLot>[] = [
  { key: 'lot', label: 'Playa', sortBy: (lot) => lot.name.toLowerCase() },
  { key: 'status', label: 'Estado', width: '140px' },
  { key: 'devices', label: 'Equipos en línea', align: 'right', width: '150px' },
  { key: 'sensors', label: 'Sensores funcionando', sortBy: (lot) => lotHealth(lot).sensorsOk / (lotHealth(lot).sensors || 1), align: 'right', width: '180px' },
  { key: 'alerts', label: 'Alertas', sortBy: (lot) => lotHealth(lot).critical * 100 + lotHealth(lot).warnings, width: '170px' },
  { key: 'seen', label: 'Último contacto', width: '150px' },
  { key: 'go', label: '', align: 'right', width: '60px' },
]
</script>

<template>
  <DataTable :columns="lotColumns" :rows="subscribedLots" :row-key="(lot) => lot.id" :initial-sort="{ key: 'alerts', direction: 'desc' }">
    <template #cell-lot="{ row }">
      <span class="lot">
        <strong>{{ row.name }}</strong>
        <span>{{ row.neighborhood }}</span>
      </span>
    </template>
    <template #cell-status="{ row }">
      <StatusPill :label="LOT_STATUSES[row.status].label" :tone="LOT_STATUSES[row.status].tone" />
    </template>
    <template #cell-devices="{ row }">
      <span class="number">{{ lotHealth(row).devicesOnline }} / {{ lotHealth(row).devices }}</span>
    </template>
    <template #cell-sensors="{ row }">
      <span v-if="lotHealth(row).sensors" class="number">{{ lotHealth(row).sensorsOk }} / {{ lotHealth(row).sensors }}</span>
      <span v-else class="muted">Sin sensores</span>
    </template>
    <template #cell-alerts="{ row }">
      <span class="pills">
        <StatusPill v-if="lotHealth(row).critical" :label="`${lotHealth(row).critical} críticas`" tone="danger" />
        <StatusPill v-if="lotHealth(row).warnings" :label="`${lotHealth(row).warnings} adv.`" tone="warning" />
        <StatusPill v-if="!lotHealth(row).critical && !lotHealth(row).warnings" label="Sin problemas" tone="success" />
      </span>
    </template>
    <template #cell-seen="{ row }">
      <span class="muted">{{ lotHealth(row).lastSeen ? formatAgo(lotHealth(row).lastSeen!, now) : 'Nunca' }}</span>
    </template>
    <template #cell-go="{ row }">
      <RouterLink :to="{ name: 'admin-lot-devices', params: { lotId: row.id } }" class="open" :aria-label="`Abrir ${row.name}`">
        <ChevronRight :size="18" />
      </RouterLink>
    </template>
  </DataTable>
</template>

<style scoped>
.lot {
  display: grid;
}

.lot span,
.muted {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.number {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.open {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  color: var(--sp-text-muted);
}

.open:hover {
  background: var(--sp-surface-3);
  color: var(--sp-text);
}
</style>
