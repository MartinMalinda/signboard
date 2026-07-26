import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { isCompletedListByWorkflow, normalizeLabels, normalizeWorkflowSettings } from '../../lib/boardLabels.js'
import { DATE_FILTERS, normalizeDateFilter } from '../../lib/cardFilters.js'
import type { BoardLabel, BoardSettings } from '../types'

export const useLabelsStore = defineStore('labels', () => {
  const labels = ref<BoardLabel[]>([])
  const workflow = ref(normalizeWorkflowSettings({}))
  const filterIds = ref<string[]>([])
  const dateFilter = ref('')
  const boardRoot = ref('')

  function loadFromBoardSettings(settings: BoardSettings | null, nextBoardRoot: string) {
    if (boardRoot.value !== nextBoardRoot) { filterIds.value = []; dateFilter.value = '' }
    boardRoot.value = nextBoardRoot
    labels.value = normalizeLabels(settings?.labels).map((label) => ({ ...label }))
    workflow.value = normalizeWorkflowSettings(settings?.workflow)
    const valid = new Set(labels.value.map((label) => label.id)); filterIds.value = filterIds.value.filter((id) => valid.has(id))
  }
  function prepareBoard(nextBoardRoot: string) { if (boardRoot.value !== nextBoardRoot) { filterIds.value = []; dateFilter.value = '' } boardRoot.value = nextBoardRoot }
  function clear() { labels.value = []; workflow.value = normalizeWorkflowSettings({}); filterIds.value = []; dateFilter.value = ''; boardRoot.value = '' }
  function toggleFilterLabel(id: string, enabled: boolean) { const next = new Set(filterIds.value); if (enabled) next.add(id); else next.delete(id); filterIds.value = [...next] }
  function setDateFilter(value: string) { const next = normalizeDateFilter(value); dateFilter.value = dateFilter.value === next ? DATE_FILTERS.none : next }
  function resetFilters() { filterIds.value = []; dateFilter.value = '' }
  function isCompletedList(listName: string) { return isCompletedListByWorkflow(listName, workflow.value) }
  async function createLabel(name: string) {
    const trimmed = String(name || '').trim(); if (!trimmed || !boardRoot.value) return null
    const existing = labels.value.find((label) => label.name.toLowerCase() === trimmed.toLowerCase()); if (existing) return existing
    const next: BoardLabel = { id: `label-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name: trimmed, colorLight: '#3b82f6', colorDark: '#2563eb' }
    const nextLabels = [...labels.value, next]; await window.board.updateBoardLabels?.(boardRoot.value, nextLabels); labels.value = nextLabels; return next
  }
  async function updateCardLabels(cardPath: string, nextIds: string[]) { await window.board.updateFrontmatter(cardPath, { labels: [...new Set(nextIds.map(String))] }) }

  return { labels, workflow, filterIds, dateFilter, boardRoot, activeFilterCount: computed(() => filterIds.value.length + (dateFilter.value ? 1 : 0)), prepareBoard, loadFromBoardSettings, clear, toggleFilterLabel, setDateFilter, resetFilters, isCompletedList, createLabel, updateCardLabels }
})
