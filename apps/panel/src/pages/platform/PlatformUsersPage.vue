<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus } from 'lucide-vue-next'
import { formatAgo, useAccountsStore, usePlatformStore, type StaffAccount, type UserRole } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import TableTabs, { type TableTab } from '@/components/TableTabs.vue'
import TableSearch from '@/components/TableSearch.vue'
import StatusPill from '@/components/StatusPill.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import AccountFormDialog from '@/features/admin-users/components/AccountFormDialog.vue'
import PasswordResultDialog from '@/features/admin-users/components/PasswordResultDialog.vue'
import { ROLES } from '@/features/admin-users/roles'
import { useToast } from '@/composables/useToast'
import { useNow } from '@/composables/useNow'

const accountsStore = useAccountsStore()
const platform = usePlatformStore()
const { accounts } = storeToRefs(accountsStore)
const { lots } = storeToRefs(platform)
const toast = useToast()
const now = useNow()
platform.load()

type TabKey = 'all' | UserRole | 'inactive'
const activeTab = ref<TabKey>('all')
const search = ref('')

const tabs = computed<TableTab<TabKey>[]>(() => {
  const count = (role: UserRole) => accounts.value.filter((a) => a.role === role && a.active).length
  return [
    { key: 'all', label: 'Todos', count: accounts.value.filter((a) => a.active).length },
    { key: 'owner', label: 'Dueños', count: count('owner') },
    { key: 'attendant', label: 'Playeros', count: count('attendant') },
    { key: 'platform_admin', label: 'Admins', count: count('platform_admin') },
    { key: 'inactive', label: 'Desactivados', count: accounts.value.filter((a) => !a.active).length },
  ]
})

/** Playas de cada cuenta: las asignadas (playero) o las que tiene en Playas (dueño). */
function lotNames(account: StaffAccount) {
  const ids =
    account.role === 'owner' ? lots.value.filter((lot) => lot.ownerId === account.id).map((lot) => lot.id) : account.lotIds
  return ids.map((id) => lots.value.find((lot) => lot.id === id)?.name).filter(Boolean) as string[]
}

const rows = computed(() => {
  const term = search.value.trim().toLowerCase()
  return accounts.value
    .filter((account) => {
      if (activeTab.value === 'inactive') return !account.active
      return account.active && (activeTab.value === 'all' || account.role === activeTab.value)
    })
    .filter(
      (account) =>
        !term ||
        [account.name, account.username, account.email, ...lotNames(account)].some((value) =>
          value.toLowerCase().includes(term),
        ),
    )
})

const columns: DataTableColumn<StaffAccount>[] = [
  { key: 'name', label: 'Nombre', sortBy: (a) => a.name.toLowerCase() },
  { key: 'username', label: 'Usuario', sortBy: (a) => a.username, width: '130px' },
  { key: 'role', label: 'Rol', sortBy: (a) => a.role, width: '170px' },
  { key: 'lots', label: 'Playas' },
  { key: 'login', label: 'Último ingreso', sortBy: (a) => a.lastLoginAt ?? '', width: '150px' },
  { key: 'actions', label: '', align: 'right', width: '290px' },
]

// Alta / edición
const editing = ref<StaffAccount | null>(null)
const formOpen = ref(false)
function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(account: StaffAccount) {
  editing.value = account
  formOpen.value = true
}

// Contraseña temporal (alta o restablecimiento): se muestra una sola vez.
const passwordOpen = ref(false)
const passwordInfo = ref({ title: '', username: '', password: '' })
function showPassword(title: string, username: string, password: string) {
  passwordInfo.value = { title, username, password }
  passwordOpen.value = true
}

// Confirmaciones: restablecer contraseña y activar/desactivar.
type Pending = { kind: 'reset' | 'toggle'; account: StaffAccount }
const pending = ref<Pending | null>(null)
const confirmOpen = ref(false)
function ask(kind: Pending['kind'], account: StaffAccount) {
  pending.value = { kind, account }
  confirmOpen.value = true
}

function confirm() {
  const action = pending.value
  if (!action) return
  confirmOpen.value = false
  if (action.kind === 'reset') {
    showPassword('Contraseña restablecida', action.account.username, accountsStore.resetPassword(action.account.id))
  } else {
    accountsStore.setActive(action.account.id, !action.account.active)
    toast.show(`${action.account.name} · ${action.account.active ? 'activado' : 'desactivado'}`)
  }
}
</script>

<template>
  <section class="page">
    <PageHeader title="Usuarios" subtitle="Cuentas de dueños, playeros y admins. El admin las crea y las administra.">
      <template #actions>
        <button type="button" class="btn btn--primary" @click="openCreate"><Plus :size="16" /> Nuevo usuario</button>
      </template>
    </PageHeader>

    <DataTable :columns="columns" :rows="rows" :row-key="(a) => a.id" :initial-sort="{ key: 'name', direction: 'asc' }">
      <template #toolbar>
        <TableTabs v-model="activeTab" :tabs="tabs" label="Filtrar usuarios" />
        <TableSearch v-model="search" placeholder="Buscar nombre, usuario, email o playa" />
      </template>

      <template #cell-name="{ row }">
        <span class="person">
          <strong>{{ row.name }}</strong>
          <span>{{ row.email || row.phone || '—' }}</span>
        </span>
      </template>
      <template #cell-username="{ row }"><span class="mono">{{ row.username }}</span></template>
      <template #cell-role="{ row }">
        <StatusPill :label="ROLES[row.role].label" :tone="ROLES[row.role].tone" />
      </template>
      <template #cell-lots="{ row }">
        <span v-if="row.role === 'platform_admin'" class="muted">Todas</span>
        <span v-else-if="lotNames(row).length" class="lots">{{ lotNames(row).join(' · ') }}</span>
        <span v-else class="muted">Ninguna</span>
      </template>
      <template #cell-login="{ row }">
        <span v-if="row.lastLoginAt" class="muted">{{ formatAgo(row.lastLoginAt, now) }}</span>
        <StatusPill v-else label="Nunca ingresó" tone="warning" />
      </template>
      <template #cell-actions="{ row }">
        <span class="actions">
          <button type="button" class="btn btn--sm" @click="openEdit(row)">Editar</button>
          <button type="button" class="btn btn--sm" @click="ask('reset', row)">Restablecer contraseña</button>
          <button v-if="row.id !== 'mock-admin'" type="button" class="btn btn--sm btn--subtle" @click="ask('toggle', row)">
            {{ row.active ? 'Desactivar' : 'Activar' }}
          </button>
        </span>
      </template>
    </DataTable>

    <AccountFormDialog
      v-model:open="formOpen"
      :account="editing"
      @created="(username, password) => showPassword('Usuario creado', username, password)"
    />
    <PasswordResultDialog v-model:open="passwordOpen" v-bind="passwordInfo" />

    <BaseDialog v-model:open="confirmOpen" :title="pending?.kind === 'reset' ? 'Restablecer contraseña' : pending?.account.active ? 'Desactivar usuario' : 'Activar usuario'">
      <p v-if="pending?.kind === 'reset'" class="confirm-text">
        Se genera una contraseña temporal nueva para <strong>{{ pending.account.name }}</strong>. La actual deja de funcionar.
      </p>
      <p v-else-if="pending" class="confirm-text">
        <strong>{{ pending.account.name }}</strong>
        {{ pending.account.active ? 'no va a poder ingresar al panel hasta que se lo vuelva a activar.' : 'va a poder volver a ingresar al panel.' }}
      </p>
      <template #footer>
        <button type="button" class="btn" @click="confirmOpen = false">Cancelar</button>
        <button type="button" class="btn btn--primary" @click="confirm">Confirmar</button>
      </template>
    </BaseDialog>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.person {
  display: grid;
}

.person span,
.muted {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}

.lots {
  font-size: 13px;
}

.actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.confirm-text {
  margin: 0;
  color: var(--sp-text-muted);
}

.confirm-text strong {
  color: var(--sp-text);
}
</style>
