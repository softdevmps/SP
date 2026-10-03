import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Reloj reactivo para textos relativos ("hace 3 min") en pantallas sin feed en vivo. */
export function useNow(intervalMs = 30_000) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => (timer = setInterval(() => (now.value = Date.now()), intervalMs)))
  onBeforeUnmount(() => clearInterval(timer))
  return now
}
