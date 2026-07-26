import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const THEME_STORAGE_KEY = 'theme'

export const useUiStore = defineStore('ui', () => {
  const themeMode = ref<'light' | 'dark'>('light')
  const boardMenuOpen = ref(false)
  const statusMessage = ref('')
  let statusTimer: number | null = null

  function applyTheme(nextTheme: 'light' | 'dark') {
    themeMode.value = nextTheme
    document.documentElement.dataset.theme = nextTheme === 'dark' ? 'dark' : ''
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme === 'dark' ? 'dark' : '')
  }

  function restoreTheme() {
    applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light')
  }

  function toggleTheme() {
    applyTheme(themeMode.value === 'dark' ? 'light' : 'dark')
  }

  function toggleBoardMenu() {
    boardMenuOpen.value = !boardMenuOpen.value
  }

  function closeBoardMenu() {
    boardMenuOpen.value = false
  }

  function announceStatus(message: string) {
    statusMessage.value = ''
    if (statusTimer !== null) window.clearTimeout(statusTimer)
    window.setTimeout(() => { statusMessage.value = String(message || '') }, 20)
    statusTimer = window.setTimeout(() => { statusMessage.value = ''; statusTimer = null }, 5000)
  }

  return {
    themeMode,
    isDarkMode: computed(() => themeMode.value === 'dark'),
    boardMenuOpen,
    applyTheme,
    restoreTheme,
    toggleTheme,
    toggleBoardMenu,
    closeBoardMenu,
    statusMessage,
    announceStatus,
  }
})
