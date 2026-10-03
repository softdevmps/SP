import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 1

/** Avisos breves que aparecen abajo a la derecha y se cierran solos. */
export function useToast() {
  function show(message: string, tone: Toast['tone'] = 'success', durationMs = 3500) {
    const id = nextId++
    toasts.value.push({ id, message, tone })
    setTimeout(() => dismiss(id), durationMs)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return { toasts, show, dismiss }
}
