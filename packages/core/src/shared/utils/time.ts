const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "14:30" (24 h, sin "a. m.") */
export function formatTime(value: string | Date): string {
  return timeFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** Minutos enteros entre ahora y la fecha (negativo si ya pasó). */
export function minutesUntil(value: string | Date, now = Date.now()): number {
  const target = (typeof value === 'string' ? new Date(value) : value).getTime()
  return Math.round((target - now) / 60_000)
}

/** "35 min", "1 h", "2 h 10 min" */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.abs(totalMinutes)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

/** "hace instantes", "hace 12 min", "hace 2 h 15 min" */
export function formatAgo(value: string | Date, now = Date.now()): string {
  const minutes = -minutesUntil(value, now)
  return minutes < 1 ? 'hace instantes' : `hace ${formatDuration(minutes)}`
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "03/10/2026" */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}
