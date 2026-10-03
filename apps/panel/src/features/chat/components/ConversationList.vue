<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Lock } from 'lucide-vue-next'
import { formatTime, useChatStore } from '@sp/core'
import TableSearch from '@/components/TableSearch.vue'
import ChatAvatar from './ChatAvatar.vue'

defineProps<{ activeId?: string | null }>()
defineEmits<{ select: [conversationId: string] }>()

const { summaries } = storeToRefs(useChatStore())
const search = ref('')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return summaries.value
  return summaries.value.filter((c) =>
    [c.driverName, c.vehiclePlate, c.reservationCode].some((v) => v.toLowerCase().includes(term)),
  )
})
</script>

<template>
  <div class="list">
    <div class="list__search">
      <TableSearch v-model="search" placeholder="Buscar conductor, patente o código" />
    </div>

    <ul v-if="filtered.length" class="items">
      <li v-for="conversation in filtered" :key="conversation.id">
        <button
          type="button"
          class="item"
          :class="{ 'is-active': conversation.id === activeId, 'is-closed': conversation.closed }"
          @click="$emit('select', conversation.id)"
        >
          <ChatAvatar :name="conversation.driverName" />
          <span class="item__body">
            <span class="item__top">
              <strong class="item__name">{{ conversation.driverName }}</strong>
              <span v-if="conversation.lastMessage" class="item__time">
                {{ formatTime(conversation.lastMessage.sentAt) }}
              </span>
            </span>
            <span class="item__bottom">
              <span class="item__preview">
                <Lock v-if="conversation.closed" :size="12" class="item__lock" />
                <template v-if="conversation.lastMessage">
                  {{ conversation.lastMessage.author === 'lot' ? 'Vos: ' : '' }}{{ conversation.lastMessage.body }}
                </template>
                <template v-else>{{ conversation.vehiclePlate }} · {{ conversation.reservationCode }}</template>
              </span>
              <span v-if="conversation.unread" class="item__unread">{{ conversation.unread }}</span>
            </span>
          </span>
        </button>
      </li>
    </ul>
    <p v-else class="empty">
      {{ search ? 'Ninguna conversación coincide.' : 'Todavía no hay conversaciones.' }}
    </p>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.list__search {
  padding: 12px;
  border-bottom: 1px solid var(--sp-border);
}

.list__search :deep(.search),
.list__search :deep(input) {
  width: 100%;
}

.items {
  flex: 1;
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  list-style: none;
}

.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: var(--sp-radius-sm);
  background: none;
  color: var(--sp-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--sp-duration) var(--sp-ease);
}

.item:hover {
  background: var(--sp-surface-2);
}

.item.is-active {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-2);
}

.item.is-closed {
  opacity: 0.6;
}

/* minmax(0, 1fr): la columna no se estira con textos largos, los recorta con "…" */
.item__body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  min-width: 0;
}

.item__top,
.item__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item__time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--sp-text-faint);
}

.item__preview {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--sp-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item__lock {
  margin-right: 4px;
  vertical-align: -1px;
}

.item__unread {
  min-width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--sp-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.empty {
  margin: 0;
  padding: 24px 16px;
  font-size: 13px;
  text-align: center;
  color: var(--sp-text-muted);
}
</style>
