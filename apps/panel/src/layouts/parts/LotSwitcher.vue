<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Building2, Check, ChevronDown } from 'lucide-vue-next'
import { useActiveLotStore } from '@sp/core'
import { LOT_STATUSES } from '@/features/admin-lots/statuses'

// Muestra en qué playa se está trabajando. Solo quien tiene más de una playa puede cambiarla.
const activeLotStore = useActiveLotStore()
const { lots, hasMany, activeLot } = storeToRefs(activeLotStore)

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function choose(lotId: string) {
  activeLotStore.select(lotId)
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (root.value && !event.composedPath().includes(root.value)) open.value = false
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
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
  <div v-if="activeLot" ref="root" class="lot-switcher">
    <button
      v-if="hasMany"
      type="button"
      class="current is-button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <Building2 :size="16" class="current__icon" />
      <span class="current__name">{{ activeLot.name }}</span>
      <ChevronDown :size="15" class="current__chevron" :class="{ 'is-open': open }" />
    </button>
    <span v-else class="current" title="Playa">
      <Building2 :size="16" class="current__icon" />
      <span class="current__name">{{ activeLot.name }}</span>
    </span>

    <Transition name="pop">
      <ul v-if="open" class="menu" role="listbox" aria-label="Elegir playa">
        <li v-for="lot in lots" :key="lot.id">
          <button
            type="button"
            class="option"
            role="option"
            :aria-selected="lot.id === activeLot.id"
            @click="choose(lot.id)"
          >
            <span class="option__text">
              <strong>{{ lot.name }}</strong>
              <span>
                {{ lot.neighborhood }}<template v-if="lot.status !== 'active'"> · {{ LOT_STATUSES[lot.status].label }}</template>
              </span>
            </span>
            <Check v-if="lot.id === activeLot.id" :size="16" class="option__check" />
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.lot-switcher {
  position: relative;
  min-width: 0;
}

.current {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  max-width: 260px;
  padding: 0 12px;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface);
  color: var(--sp-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
}

.current.is-button {
  cursor: pointer;
  transition:
    background var(--sp-duration) var(--sp-ease),
    border-color var(--sp-duration) var(--sp-ease);
}

.current.is-button:hover {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
}

.current__icon {
  flex-shrink: 0;
  color: var(--sp-accent-hover);
}

.current__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current__chevron {
  flex-shrink: 0;
  color: var(--sp-text-faint);
  transition: transform var(--sp-duration) var(--sp-ease);
}

.current__chevron.is-open {
  transform: rotate(180deg);
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 60;
  width: 280px;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius);
  background: var(--sp-surface-2);
  box-shadow: var(--sp-shadow-lg);
  list-style: none;
}

.option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--sp-radius-sm);
  background: transparent;
  color: var(--sp-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.option:hover {
  background: var(--sp-surface-3);
}

.option__text {
  flex: 1;
  display: grid;
  min-width: 0;
  font-size: 13px;
}

.option__text span {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.option__check {
  color: var(--sp-accent-hover);
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
  transform: translateY(-4px);
}

@media (max-width: 640px) {
  .current {
    max-width: 150px;
  }
}
</style>
