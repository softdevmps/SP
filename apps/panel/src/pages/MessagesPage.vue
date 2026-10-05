<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { MessagesSquare, Volume2, VolumeX } from 'lucide-vue-next'
import { useChatStore } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import LotGate from '@/components/LotGate.vue'
import ConversationList from '@/features/chat/components/ConversationList.vue'
import ChatThread from '@/features/chat/components/ChatThread.vue'
import { useChatSound } from '@/features/chat/composables/useChatSound'

const { summaries, totalUnread } = storeToRefs(useChatStore())
const { muted } = useChatSound()

const activeId = ref<string | null>(null)

// Al entrar (o al cambiar de playa) se abre la conversación con mensajes sin leer, o la más reciente.
watch(
  summaries,
  (list) => {
    if (activeId.value && list.some((conversation) => conversation.id === activeId.value)) return
    activeId.value = null
    if (!list.length) return
    activeId.value = (list.find((c) => c.unread > 0) ?? list[0])?.id ?? null
  },
  { immediate: true },
)

const subtitle = computed(() =>
  totalUnread.value ? `${totalUnread.value} sin leer` : 'Conversaciones con conductores que reservaron',
)
</script>

<template>
  <section class="page">
    <PageHeader title="Mensajes" :subtitle="subtitle">
      <template #actions>
        <button type="button" class="btn btn--sm" @click="muted = !muted">
          <VolumeX v-if="muted" :size="15" />
          <Volume2 v-else :size="15" />
          {{ muted ? 'Sonido desactivado' : 'Sonido activado' }}
        </button>
      </template>
    </PageHeader>

    <LotGate>
      <div class="inbox">
        <ConversationList class="inbox__list" :active-id="activeId" @select="activeId = $event" />
        <ChatThread v-if="activeId" :conversation-id="activeId" class="inbox__thread" />
        <div v-else class="inbox__empty">
          <MessagesSquare :size="28" />
          Elegí una conversación
        </div>
      </div>
    </LotGate>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.inbox {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  height: calc(100vh - var(--header-h) - 170px);
  min-height: 460px;
  overflow: hidden;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-surface);
  box-shadow: var(--sp-shadow), var(--sp-inner-highlight);
}

.inbox__list {
  border-right: 1px solid var(--sp-border);
}

.inbox__empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: var(--sp-text-muted);
}

@media (max-width: 860px) {
  .inbox {
    grid-template-columns: 1fr;
    height: auto;
  }

  .inbox__list {
    max-height: 280px;
    border-right: 0;
    border-bottom: 1px solid var(--sp-border);
  }

  .inbox__thread {
    height: 520px;
  }
}
</style>
