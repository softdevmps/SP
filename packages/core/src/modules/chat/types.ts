/** Quién escribió el mensaje: el conductor desde la app o la playa desde el panel. */
export type MessageAuthor = 'driver' | 'lot'

export interface ChatMessage {
  id: string
  conversationId: string
  author: MessageAuthor
  /** Solo texto: por seguridad no se aceptan imágenes ni archivos. */
  body: string
  sentAt: string
  /** Cuándo lo leyó la otra parte (el "visto"). */
  readAt?: string
}

/**
 * Conversación entre un conductor y la playa. Existe solo a partir de que el conductor hizo
 * su reserva, y queda cerrada (solo lectura) cuando la reserva termina.
 */
export interface Conversation {
  id: string
  lotId: string
  reservationId: string
  reservationCode: string
  driverName: string
  vehiclePlate: string
  closed: boolean
}

export const MESSAGE_MAX_LENGTH = 500
