import type { ChatMessage, Conversation } from './types'

// MOCK: conversaciones de ejemplo y conductores que escriben solos. Con backend, los
// mensajes llegan por el mismo canal en tiempo real que la ocupación.

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

export function buildMockConversations(lotId: string): Conversation[] {
  const rows: Array<[string, string, string, string, boolean]> = [
    ['c1', 'SP-4K7Q', 'Lucía Fernández', 'AE 512 KD', false],
    ['c2', 'SP-1R5V', 'Agustina Medina', 'AE 640 TC', false],
    ['c3', 'SP-2H8R', 'Sofía Herrera', 'AF 331 LP', false],
    ['c4', 'SP-4D7S', 'Rocío Bustos', 'AF 207 KM', false],
    ['c5', 'SP-5V8E', 'Pablo Correa', 'AG 154 DR', true],
  ]
  return rows.map(([id, reservationCode, driverName, vehiclePlate, closed]) => ({
    id,
    lotId,
    reservationId: `res-${reservationCode}`,
    reservationCode,
    driverName,
    vehiclePlate,
    closed,
  }))
}

export function buildMockMessages(): ChatMessage[] {
  const rows: Array<[string, 'driver' | 'lot', string, number, number | null]> = [
    ['c1', 'driver', 'Hola, ¿la entrada es por Av. Colón o por la calle de atrás?', 14, null],
    ['c1', 'driver', 'Estoy llegando en 5 minutos.', 12, null],
    ['c2', 'driver', 'Buenas, se me complicó, voy a llegar un rato más tarde a buscar el auto.', 40, 38],
    ['c2', 'lot', 'Hola Agustina, no hay problema. Te recordamos que el tiempo extra se cobra al salir.', 37, 30],
    ['c2', 'driver', 'Dale, gracias!', 29, 28],
    ['c3', 'driver', '¿Puedo dejar la camioneta? Es un poco alta.', 6, null],
    ['c4', 'lot', 'Hola Rocío, tu auto quedó en el piso 2. Cualquier cosa avisanos.', 80, 75],
    ['c5', 'driver', 'Ya retiré el auto, gracias por todo.', 150, 149],
    ['c5', 'lot', '¡Gracias a vos, Pablo! Buen viaje.', 148, 140],
  ]
  return rows.map(([conversationId, author, body, sent, read], index) => ({
    id: `m${index + 1}`,
    conversationId,
    author,
    body,
    sentAt: minutesAgo(sent),
    ...(read !== null ? { readAt: minutesAgo(read) } : {}),
  }))
}

const DRIVER_MESSAGES = [
  '¿Hasta qué hora abren hoy?',
  'Gracias, ya estoy entrando.',
  '¿Hay lugar en planta baja?',
  'Perdón, ¿me confirman en qué piso dejé el auto?',
  'Voy 10 minutos tarde, ¿me guardan el lugar?',
  'Perfecto, muchas gracias.',
]

/** Cada tanto un conductor con conversación abierta escribe un mensaje. */
export function startMockDriverFeed(
  pickConversation: () => Conversation | undefined,
  onMessage: (conversationId: string, body: string) => void,
  intervalMs = 45_000,
): () => void {
  const timer = setInterval(() => {
    const conversation = pickConversation()
    if (!conversation) return
    const body = DRIVER_MESSAGES[Math.floor(Math.random() * DRIVER_MESSAGES.length)] ?? 'Hola'
    onMessage(conversation.id, body)
  }, intervalMs)
  return () => clearInterval(timer)
}
