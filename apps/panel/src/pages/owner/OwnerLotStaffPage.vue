<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Info } from 'lucide-vue-next'
import { formatAgo, useAccountsStore, type StaffAccount } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import StatusPill from '@/components/StatusPill.vue'
import { useOwnerLot } from '@/features/owner/useOwnerLot'
import { useNow } from '@/composables/useNow'

// Solo lectura: las cuentas de los playeros las crea el admin de plataforma.
const { activeLot, lotId } = useOwnerLot()
const { accounts } = storeToRefs(useAccountsStore())
const now = useNow()

const staff = computed(() =>
  accounts.value.filter((account) => account.role === 'attendant' && account.lotIds.includes(lotId.value)),
)

const columns: DataTableColumn<StaffAccount>[] = [
  { key: 'name', label: 'Nombre', sortBy: (a) => a.name.toLowerCase() },
  { key: 'username', label: 'Usuario', sortBy: (a) => a.username },
  { key: 'phone', label: 'Teléfono' },
  { key: 'status', label: 'Estado', width: '140px' },
  { key: 'login', label: 'Último ingreso', sortBy: (a) => a.lastLoginAt ?? '', width: '160px' },
]
</script>

<template>
  <section class="page">
    <PageHeader title="Personal" :subtitle="activeLot ? `Playeros de ${activeLot.name}` : undefined" />
    <p class="note">
      <Info :size="16" />
      Para sumar o dar de baja un playero, o restablecer su contraseña, contactá al administrador de la plataforma.
    </p>
    <DataTable :columns="columns" :rows="staff" :row-key="(a) => a.id" :initial-sort="{ key: 'name', direction: 'asc' }" empty-text="Esta playa todavía no tiene playeros asignados.">
      <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
      <template #cell-username="{ row }"><span class="mono">{{ row.username }}</span></template>
      <template #cell-phone="{ row }"><span class="muted">{{ row.phone || '—' }}</span></template>
      <template #cell-status="{ row }">
        <StatusPill :label="row.active ? 'Activo' : 'Desactivado'" :tone="row.active ? 'success' : 'muted'" />
      </template>
      <template #cell-login="{ row }"><span class="muted">{{ row.lastLoginAt ? formatAgo(row.lastLoginAt, now) : 'Nunca' }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.muted {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}
</style>
