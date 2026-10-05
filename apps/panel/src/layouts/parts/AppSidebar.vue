<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { useAuthStore, useChatStore } from '@sp/core'
import { navigation, type NavItem } from '../navigation'
import { activeNavItemTo } from '../activeNavItem'

defineProps<{ open: boolean }>()

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()

const visibleSections = computed(() =>
  navigation.filter((section) => auth.user && section.roles.includes(auth.user.role)),
)

const expanded = ref<string[]>([])

function badgeOf(item: NavItem): number {
  if (item.badge === 'chat-unread') return chat.totalUnread
  return 0
}

const activeItemTo = computed(() =>
  activeNavItemTo(
    route.path,
    visibleSections.value.flatMap((section) => section.items.map((item) => item.to)),
  ),
)

function isWithin(item: NavItem) {
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

function isExpanded(item: NavItem) {
  return expanded.value.includes(item.name)
}

function setExpanded(item: NavItem, value: boolean) {
  expanded.value = value
    ? [...new Set([...expanded.value, item.name])]
    : expanded.value.filter((name) => name !== item.name)
}

// La sección donde está el usuario siempre aparece desplegada.
watch(
  () => route.path,
  () => {
    for (const section of navigation) {
      for (const item of section.items) {
        if (item.children && isWithin(item)) setExpanded(item, true)
      }
    }
  },
  { immediate: true },
)

function onParentClick(item: NavItem) {
  if (isWithin(item)) {
    setExpanded(item, !isExpanded(item))
  } else {
    setExpanded(item, true)
    router.push(item.to)
  }
}
</script>

<template>
  <aside id="app-sidebar" class="sidebar" :class="{ 'is-open': open }" :inert="!open">
    <nav class="sidebar__nav" aria-label="Menú principal">
      <section v-for="section in visibleSections" :key="section.title" class="sidebar__section">
        <h2 class="sidebar__title">{{ section.title }}</h2>
        <ul class="sidebar__list">
          <li v-for="item in section.items" :key="item.name">
            <template v-if="item.children">
              <button
                type="button"
                class="sidebar__link"
                :class="{ 'is-active': isWithin(item) }"
                :aria-expanded="isExpanded(item)"
                @click="onParentClick(item)"
              >
                <span class="sidebar__icon">
                  <component :is="item.icon" :size="18" :stroke-width="1.8" />
                </span>
                <span class="sidebar__label">{{ item.label }}</span>
                <ChevronDown
                  :size="16"
                  class="sidebar__chevron"
                  :class="{ 'is-open': isExpanded(item) }"
                />
              </button>
              <ul v-show="isExpanded(item)" class="sidebar__sublist">
                <li v-for="child in item.children" :key="child.name">
                  <RouterLink :to="child.to" class="sidebar__sublink" active-class="is-active">
                    {{ child.label }}
                  </RouterLink>
                </li>
              </ul>
            </template>

            <RouterLink
              v-else
              :to="item.to"
              class="sidebar__link"
              :class="{ 'is-active': item.to === activeItemTo }"
            >
              <span class="sidebar__icon">
                <component :is="item.icon" :size="18" :stroke-width="1.8" />
              </span>
              <span class="sidebar__label">{{ item.label }}</span>
              <span v-if="badgeOf(item)" class="sidebar__badge">{{ badgeOf(item) }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </nav>

    <footer class="sidebar__footer">
      <span class="status-dot" aria-hidden="true" />
      Sistema en línea
    </footer>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--header-h);
  bottom: 0;
  left: 0;
  z-index: 40;
  width: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgb(18 17 19 / 0.96), rgb(10 9 10 / 0.98));
  backdrop-filter: blur(16px);
  border-right: 1px solid var(--sp-border);
  box-shadow: 12px 0 40px -24px rgb(0 0 0 / 0.9);
  transform: translateX(-100%);
  transition: transform 280ms var(--sp-ease);
}

.sidebar.is-open {
  transform: translateX(0);
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 22px 14px;
}

.sidebar__section + .sidebar__section {
  margin-top: 24px;
}

.sidebar__title {
  margin: 0 0 8px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sp-text-faint);
}

.sidebar__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
}

.sidebar__link {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: var(--sp-radius);
  background: transparent;
  color: var(--sp-text-muted);
  font: inherit;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease),
    border-color var(--sp-duration) var(--sp-ease),
    transform var(--sp-duration) var(--sp-ease);
}

.sidebar__link:hover {
  color: var(--sp-text);
  background: var(--sp-surface-2);
  transform: translateX(2px);
}

.sidebar__label {
  flex: 1;
}

.sidebar__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  border: 1px solid var(--sp-border);
  transition:
    background var(--sp-duration) var(--sp-ease),
    box-shadow var(--sp-duration) var(--sp-ease),
    color var(--sp-duration) var(--sp-ease);
}

.sidebar__link:hover .sidebar__icon {
  background: var(--sp-surface-3);
}

.sidebar__link.is-active {
  color: var(--sp-text);
  background: linear-gradient(90deg, rgb(155 31 48 / 0.18), rgb(110 20 33 / 0.06));
  border-color: rgb(155 31 48 / 0.25);
  box-shadow: 0 6px 20px -10px rgb(155 31 48 / 0.6);
}

.sidebar__link.is-active .sidebar__icon {
  background: var(--sp-gradient-accent);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 0 16px -2px rgb(155 31 48 / 0.7);
}

.sidebar__badge {
  min-width: 22px;
  height: 20px;
  display: grid;
  place-items: center;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--sp-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.sidebar__chevron {
  color: var(--sp-text-faint);
  transition: transform var(--sp-duration) var(--sp-ease);
}

.sidebar__chevron.is-open {
  transform: rotate(180deg);
}

/* Submenú: alineado con el texto del ítem padre, con una guía vertical */
.sidebar__sublist {
  display: grid;
  gap: 2px;
  margin: 4px 0 6px 26px;
  padding: 0 0 0 16px;
  border-left: 1px solid var(--sp-border-strong);
  list-style: none;
}

.sidebar__sublink {
  position: relative;
  display: block;
  padding: 7px 12px;
  border-radius: var(--sp-radius-sm);
  color: var(--sp-text-muted);
  font-size: 13px;
  transition:
    color var(--sp-duration) var(--sp-ease),
    background var(--sp-duration) var(--sp-ease);
}

.sidebar__sublink:hover {
  color: var(--sp-text);
  background: var(--sp-surface-2);
}

.sidebar__sublink.is-active {
  color: var(--sp-text);
  font-weight: 600;
  background: var(--sp-surface-2);
}

.sidebar__sublink.is-active::before {
  content: '';
  position: absolute;
  left: -17px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 2px;
  background: var(--sp-accent-hover);
}

.sidebar__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px;
  padding: 10px 14px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  font-size: 12px;
  color: var(--sp-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sp-free);
  box-shadow: 0 0 0 3px rgb(52 196 130 / 0.15), 0 0 10px rgb(52 196 130 / 0.8);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 5px rgb(52 196 130 / 0.05), 0 0 14px rgb(52 196 130 / 0.9);
  }
}
</style>
