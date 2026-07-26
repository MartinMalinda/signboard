import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', () => {
  const SEARCH_THROTTLE_MS = 10
  const inputQuery = ref('')
  const query = ref('')
  const resultIndex = ref(-1)
  let pendingTimer: number | null = null
  let lastAppliedAt = -Infinity
  function apply() { query.value = inputQuery.value.trim().toLowerCase(); resultIndex.value = -1 }
  function applyNow() { apply(); lastAppliedAt = Date.now() }
  function setQuery(value: string) {
    inputQuery.value = String(value || '')
    const elapsed = Date.now() - lastAppliedAt
    if (elapsed >= SEARCH_THROTTLE_MS) {
      if (pendingTimer !== null) window.clearTimeout(pendingTimer)
      pendingTimer = null
      applyNow()
      return
    }
    if (pendingTimer === null) {
      pendingTimer = window.setTimeout(() => {
        pendingTimer = null
        applyNow()
      }, SEARCH_THROTTLE_MS - elapsed)
    }
  }
  function flush() { if (pendingTimer !== null) { window.clearTimeout(pendingTimer); pendingTimer = null; applyNow() } }
  function reset() { if (pendingTimer !== null) window.clearTimeout(pendingTimer); pendingTimer = null; lastAppliedAt = -Infinity; inputQuery.value = ''; query.value = ''; resultIndex.value = -1 }
  function setResultIndex(index: number) { resultIndex.value = index }
  function moveResult(offset: number, count: number) { if (!count) { resultIndex.value = -1; return -1 }; const current = resultIndex.value < 0 ? (offset < 0 ? count - 1 : 0) : resultIndex.value + offset; resultIndex.value = ((current % count) + count) % count; return resultIndex.value }
  const tokens = computed(() => query.value.split(/\s+/).filter(Boolean))
  const isActive = computed(() => tokens.value.length > 0)
  return { inputQuery, query, tokens, resultIndex, isActive, setQuery, flush, reset, setResultIndex, moveResult }
})
