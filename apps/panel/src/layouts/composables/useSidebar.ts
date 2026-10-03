import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'sp.panel.sidebar-open'
const desktopQuery = window.matchMedia('(min-width: 1024px)')

function readStoredOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

// Estado compartido: en escritorio el sidebar empuja el contenido y recuerda si quedó
// abierto; en pantallas chicas se superpone como drawer y arranca siempre cerrado.
const isDesktop = ref(desktopQuery.matches)
const desktopOpen = ref(readStoredOpen())
const overlayOpen = ref(false)

desktopQuery.addEventListener('change', (event) => {
  isDesktop.value = event.matches
  overlayOpen.value = false
})

watch(desktopOpen, (open) => {
  try {
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0')
  } catch {
    // sin storage disponible: el estado vive solo en memoria
  }
})

export function useSidebar() {
  const isOpen = computed(() => (isDesktop.value ? desktopOpen.value : overlayOpen.value))

  function toggle() {
    if (isDesktop.value) desktopOpen.value = !desktopOpen.value
    else overlayOpen.value = !overlayOpen.value
  }

  function closeOverlay() {
    overlayOpen.value = false
  }

  return { isOpen, isDesktop, toggle, closeOverlay }
}
