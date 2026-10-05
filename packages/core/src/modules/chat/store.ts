import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildMockConversations, buildMockMessages, startMockDriverFeed } from './mock'
import { MESSAGE_MAX_LENGTH, type ChatMessage, type Conversation } from './types'

export interface ConversationSummary extends Conversation {
  lastMessage?: ChatMessage
  unread: number
}

export const useChatStore = defineStore('chat', () => {
  /** Conversaciones de todas las playas cargadas; la bandeja muestra las de la playa activa. */
  const allConversations = ref<Conversation[]>([])
  const messages = ref<ChatMessage[]>([])
  const activeLotId = ref<string | null>(null)
  const loadedLots = new Set<string>()

  const conversations = computed(() =>
    allConversations.value.filter((conversation) => conversation.lotId === activeLotId.value),
  )
  /** Último mensaje que llegó de un conductor, para avisar (sonido, animación). */
  const lastIncoming = ref<ChatMessage | null>(null)

  let stopFeed: (() => void) | null = null
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function messagesOf(conversationId: string) {
    return messages.value
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  }

  const summaries = computed<ConversationSummary[]>(() =>
    conversations.value
      .map((conversation) => {
        const thread = messagesOf(conversation.id)
        return {
          ...conversation,
          lastMessage: thread[thread.length - 1],
          unread: thread.filter((m) => m.author === 'driver' && !m.readAt).length,
        }
      })
      // Abiertas primero; dentro de cada grupo, la de actividad más reciente arriba.
      .sort(
        (a, b) =>
          Number(a.closed) - Number(b.closed) ||
          (b.lastMessage?.sentAt ?? '').localeCompare(a.lastMessage?.sentAt ?? ''),
      ),
  )

  const totalUnread = computed(() => summaries.value.reduce((sum, c) => sum + c.unread, 0))

  function later(callback: () => void, ms: number) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, ms)
    timers.add(timer)
  }

  function receive(conversationId: string, body: string) {
    const message: ChatMessage = {
      id: `in-${Date.now()}`,
      conversationId,
      author: 'driver',
      body,
      sentAt: new Date().toISOString(),
    }
    messages.value.push(message)
    lastIncoming.value = message
  }

  /** Mensaje de la playa al conductor. Solo texto, sin vacíos y con largo máximo. */
  function send(conversationId: string, rawBody: string) {
    const body = rawBody.trim().slice(0, MESSAGE_MAX_LENGTH)
    const conversation = allConversations.value.find((c) => c.id === conversationId)
    if (!body || !conversation || conversation.closed) return

    const message: ChatMessage = {
      id: `out-${Date.now()}`,
      conversationId,
      author: 'lot',
      body,
      sentAt: new Date().toISOString(),
    }
    messages.value.push(message)

    // MOCK: el conductor ve el mensaje a los pocos segundos y a veces responde.
    later(() => {
      const sent = messages.value.find((m) => m.id === message.id)
      if (sent) sent.readAt = new Date().toISOString()
    }, 2500)
    if (Math.random() < 0.5) later(() => receive(conversationId, 'Perfecto, gracias!'), 6000)
  }

  /** La playa leyó la conversación: los mensajes del conductor quedan con visto. */
  function markRead(conversationId: string) {
    const now = new Date().toISOString()
    for (const message of messages.value) {
      if (message.conversationId === conversationId && message.author === 'driver' && !message.readAt) {
        message.readAt = now
      }
    }
  }

  function connect(lotId: string) {
    if (stopFeed && activeLotId.value === lotId) return
    disconnect()
    activeLotId.value = lotId
    if (!loadedLots.has(lotId)) {
      loadedLots.add(lotId)
      allConversations.value.push(...buildMockConversations(lotId))
      messages.value.push(...buildMockMessages(lotId))
    }
    stopFeed = startMockDriverFeed(() => {
      const open = conversations.value.filter((c) => !c.closed)
      return open[Math.floor(Math.random() * open.length)]
    }, receive)
  }

  function disconnect() {
    stopFeed?.()
    stopFeed = null
    timers.forEach(clearTimeout)
    timers.clear()
  }

  return {
    conversations,
    summaries,
    totalUnread,
    lastIncoming,
    messagesOf,
    send,
    markRead,
    connect,
    disconnect,
  }
})
