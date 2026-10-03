import { ref, watch } from 'vue'

const STORAGE_KEY = 'sp.panel.chat-muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const muted = ref(readMuted())
let audio: AudioContext | null = null

watch(muted, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // sin storage disponible: la preferencia dura lo que dure la pestaña
  }
})

/** Dos notas cortas y suaves, generadas en el navegador (sin archivos de audio). */
function playChime() {
  try {
    audio ??= new AudioContext()
    const start = audio.currentTime
    for (const [offset, frequency] of [
      [0, 880],
      [0.12, 1320],
    ] as const) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(0.15, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.25)
      oscillator.connect(gain).connect(audio.destination)
      oscillator.start(start + offset)
      oscillator.stop(start + offset + 0.3)
    }
  } catch {
    // el navegador puede bloquear el audio hasta que el usuario interactúe con la página
  }
}

export function useChatSound() {
  function notify() {
    if (!muted.value) playChime()
  }
  return { muted, notify }
}
