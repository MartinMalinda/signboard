import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const DISMISSED_KEY = 'signboardSponsorPillDismissed'

export const useSponsorStore = defineStore('sponsor', () => {
  const dismissed = ref(false)
  const compact = ref(false)

  function updateCompact() { compact.value = window.innerWidth <= 980 || window.innerHeight <= 700 }
  function initialize() {
    dismissed.value = localStorage.getItem(DISMISSED_KEY) === 'true'
    updateCompact()
    window.addEventListener('resize', updateCompact)
  }
  function dispose() { window.removeEventListener('resize', updateCompact) }
  function dismiss() { dismissed.value = true; localStorage.setItem(DISMISSED_KEY, 'true'); document.body.classList.add('sponsor-pill-dismissed') }
  function restoreForTests() { dismissed.value = false; localStorage.removeItem(DISMISSED_KEY); document.body.classList.remove('sponsor-pill-dismissed') }

  return { dismissed, compact, visible: computed(() => !dismissed.value && !compact.value), initialize, dispose, dismiss, restoreForTests }
})
