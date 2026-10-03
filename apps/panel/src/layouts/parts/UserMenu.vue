<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, LogOut } from 'lucide-vue-next'
import { useAuthStore, type UserRole } from '@sp/core'

const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: 'Admin de plataforma',
  owner: 'Dueño',
  attendant: 'Playero',
}

const auth = useAuthStore()
const router = useRouter()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const initials = computed(() =>
  (auth.user?.name ?? '?')
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

function onDocumentClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

async function logout() {
  open.value = false
  auth.logout()
  await router.replace({ name: 'login' })
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="auth.user" ref="root" class="user-menu">
    <button
      type="button"
      class="trigger"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <span class="avatar">{{ initials }}</span>
      <span class="trigger__name">{{ auth.user.name }}</span>
      <ChevronDown :size="16" class="trigger__chevron" :class="{ 'is-open': open }" />
    </button>

    <Transition name="pop">
      <div v-if="open" class="dropdown" role="menu">
        <div class="dropdown__head">
          <strong>{{ auth.user.name }}</strong>
          <span>@{{ auth.user.username }}</span>
          <span class="role">{{ ROLE_LABELS[auth.user.role] }}</span>
        </div>
        <button type="button" class="dropdown__item" role="menuitem" @click="logout">
          <LogOut :size="16" />
          Cerrar sesión
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 10px 0 4px;
  border: 1px solid var(--sp-border);
  border-radius: 999px;
  background: var(--sp-surface-2);
  cursor: pointer;
  box-shadow: var(--sp-inner-highlight);
  transition:
    border-color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.trigger:hover {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-3);
}

.avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sp-gradient-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 14px -2px rgb(155 31 48 / 0.6);
}

.trigger__name {
  font-weight: 600;
  font-size: 13px;
}

.trigger__chevron {
  color: var(--sp-text-faint);
  transition: transform var(--sp-duration) var(--sp-ease);
}

.trigger__chevron.is-open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 240px;
  padding: 6px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius);
  background: rgb(25 23 26 / 0.95);
  backdrop-filter: blur(14px);
  box-shadow: var(--sp-shadow-lg), var(--sp-inner-highlight);
  transform-origin: top right;
}

.dropdown__head {
  display: grid;
  gap: 2px;
  padding: 10px 10px 12px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--sp-border);
  font-size: 13px;
}

.dropdown__head span {
  color: var(--sp-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  justify-self: start;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sp-accent-soft);
  color: var(--sp-text) !important;
  font-size: 11px;
  font-weight: 600;
}

.dropdown__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text-muted);
  cursor: pointer;
  text-align: left;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.dropdown__item:hover {
  color: var(--sp-danger);
  background: rgb(229 72 77 / 0.08);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 160ms var(--sp-ease),
    transform 160ms var(--sp-ease);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

@media (max-width: 640px) {
  .trigger__name {
    display: none;
  }
}
</style>
