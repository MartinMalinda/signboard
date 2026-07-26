import { onBeforeUnmount, onMounted } from 'vue'

const KEYBOARD_NAVIGATION_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Enter', ' ', 'Spacebar'])

export function isKeyboardNavigationKey(key: string) {
  return KEYBOARD_NAVIGATION_KEYS.has(key)
}

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (isKeyboardNavigationKey(event.key)) document.documentElement.classList.add('sb-keyboard-focus-active')
}

function clearKeyboardModality() {
  document.documentElement.classList.remove('sb-keyboard-focus-active')
}

export function useAccessibility() {
  onMounted(() => {
    document.addEventListener('keydown', onKeydown, true)
    document.addEventListener('pointerdown', clearKeyboardModality, true)
    document.addEventListener('mousedown', clearKeyboardModality, true)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown, true)
    document.removeEventListener('pointerdown', clearKeyboardModality, true)
    document.removeEventListener('mousedown', clearKeyboardModality, true)
    clearKeyboardModality()
  })
}
