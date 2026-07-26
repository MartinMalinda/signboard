import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useBoardsStore, normalizeBoardPath } from './useBoardsStore'
import { normalizeLabels } from '../../lib/boardLabels.js'
import { useUiStore } from './useUiStore'
import {
  PLANNER_VIEW_IDS,
  createPlannerDayCursor,
  createPlannerMonthCursor,
  createPlannerWeekCursor,
  normalizePlannerDateFilter,
  normalizePlannerView,
  createPlannerEntries,
} from '../../lib/planner.js'
import { setTaskListItemDateByLineIndex } from '../../lib/taskList.js'
import type { BoardLabel, BoardSnapshot } from '../types'

export type PlannerScope = 'all' | 'current' | 'custom'
export type PlannerView = 'calendar' | 'this-week' | 'day' | 'agenda'

interface PlannerBoardRecord { boardRoot: string; snapshot: BoardSnapshot }

export const usePlannerStore = defineStore('planner', () => {
  const boards = useBoardsStore()
  const ui = useUiStore()
  const records = ref<PlannerBoardRecord[]>([])
  const errors = ref<string[]>([])
  const activeView = ref<PlannerView>(PLANNER_VIEW_IDS.calendar)
  const monthCursor = ref(createPlannerMonthCursor())
  const weekCursor = ref(createPlannerWeekCursor())
  const dayCursor = ref(createPlannerDayCursor())
  const searchQuery = ref('')
  const dateFilter = ref('')
  const showCompletedCards = ref(false)
  const selectedBoardRoots = ref<string[]>([])
  const boardFilterTouched = ref(false)
  const selectedLabelIds = ref<string[]>([])
  const loading = ref(false)
  let loadToken = 0

  const activeBoardRoot = computed(() => normalizeBoardPath(boards.activeBoardPath))
  const openBoardRoots = computed(() => boards.openBoardPaths.map(normalizeBoardPath).filter(Boolean))
  const selectedRoots = computed(() => {
    if (!boardFilterTouched.value) {
      return openBoardRoots.value
    }
    const open = new Set(openBoardRoots.value)
    selectedBoardRoots.value = selectedBoardRoots.value.filter((root) => open.has(root))
    return selectedBoardRoots.value
  })
  const scope = computed<PlannerScope>(() => {
    if (selectedRoots.value.length === openBoardRoots.value.length && openBoardRoots.value.length > 0) return 'all'
    if (selectedRoots.value.length === 1 && selectedRoots.value[0] === activeBoardRoot.value) return 'current'
    return 'custom'
  })
  const entries = computed(() => createPlannerEntries(records.value.filter((record) => selectedRoots.value.includes(record.boardRoot))))
  const currentBoardLabels = computed<BoardLabel[]>(() => {
    const record = records.value.find((candidate) => candidate.boardRoot === activeBoardRoot.value)
    return normalizeLabels(record?.snapshot.boardSettings?.labels)
  })
  const currentBoardName = computed(() => {
    const record = records.value.find((candidate) => candidate.boardRoot === activeBoardRoot.value)
    return record?.snapshot.boardName || activeBoardRoot.value.replace(/\\+$/, '').split('/').filter(Boolean).pop() || 'Current board'
  })
  const canUseLabelFilters = computed(() => selectedRoots.value.length === 1 && selectedRoots.value[0] === activeBoardRoot.value && Boolean(activeBoardRoot.value))

  function setView(view: PlannerView) { activeView.value = normalizePlannerView(view) as PlannerView }
  function setSearchQuery(value: string) { searchQuery.value = String(value || '').trim().toLowerCase() }
  function setDateFilter(value: string) { dateFilter.value = normalizePlannerDateFilter(value) }
  function setShowCompletedCards(value: boolean) { showCompletedCards.value = Boolean(value) }
  function setScope(value: 'all' | 'current') {
    if (value === 'current' && activeBoardRoot.value && openBoardRoots.value.includes(activeBoardRoot.value)) {
      selectedBoardRoots.value = [activeBoardRoot.value]
      boardFilterTouched.value = true
    } else {
      selectedBoardRoots.value = [...openBoardRoots.value]
      boardFilterTouched.value = false
      selectedLabelIds.value = []
    }
    if (!canUseLabelFilters.value) selectedLabelIds.value = []
  }
  function setBoardSelected(boardRoot: string, selected: boolean) {
    const root = normalizeBoardPath(boardRoot)
    if (!root || !openBoardRoots.value.includes(root)) return
    const next = new Set(selectedRoots.value)
    if (selected) next.add(root)
    else next.delete(root)
    selectedBoardRoots.value = [...next]
    boardFilterTouched.value = true
    if (!canUseLabelFilters.value) selectedLabelIds.value = []
  }
  function setLabelSelected(labelId: string, selected: boolean) {
    if (!canUseLabelFilters.value) return
    const id = String(labelId || '').trim()
    if (!id || !currentBoardLabels.value.some((label) => label.id === id)) return
    const next = new Set(selectedLabelIds.value)
    if (selected) next.add(id)
    else next.delete(id)
    selectedLabelIds.value = [...next]
  }
  function clearFilters() {
    dateFilter.value = ''
    showCompletedCards.value = false
    boardFilterTouched.value = false
    selectedBoardRoots.value = [...openBoardRoots.value]
    selectedLabelIds.value = []
  }
  function shiftMonth(amount: number) { const next = new Date(monthCursor.value); next.setMonth(next.getMonth() + Number(amount || 0)); monthCursor.value = createPlannerMonthCursor(next) }
  function shiftWeek(amount: number) { const next = new Date(weekCursor.value); next.setDate(next.getDate() + Number(amount || 0) * 7); weekCursor.value = createPlannerWeekCursor(next) }
  function shiftDay(amount: number) { const next = new Date(dayCursor.value); next.setDate(next.getDate() + Number(amount || 0)); dayCursor.value = createPlannerDayCursor(next) }
  function monthToday() { monthCursor.value = createPlannerMonthCursor() }
  function weekToday() { weekCursor.value = createPlannerWeekCursor() }
  function dayToday() { dayCursor.value = createPlannerDayCursor() }

  async function load() {
    const token = ++loadToken
    const roots = [...openBoardRoots.value]
    if (!roots.length) { records.value = []; errors.value = []; loading.value = false; return }
    if (!boardFilterTouched.value) selectedBoardRoots.value = roots
    loading.value = true
    const results = await Promise.all(roots.map(async (boardRoot) => {
      try {
        const snapshot = await window.board.readBoardSnapshot(boardRoot, { includeBoardSettings: true, includeTimestamps: false, includeTaskItems: true })
        return { boardRoot, snapshot, error: '' }
      } catch (error) {
        console.error('Failed to load Planner board snapshot.', error)
        return { boardRoot, snapshot: null, error: boardRoot }
      }
    }))
    if (token !== loadToken) return
    records.value = results.filter((result) => result.snapshot).map((result) => ({ boardRoot: result.boardRoot, snapshot: result.snapshot as BoardSnapshot }))
    errors.value = results.filter((result) => result.error).map((result) => result.error)
    loading.value = false
  }

  async function openCard(entry: { boardRoot: string; cardPath: string }, openEditor: (cardPath: string) => Promise<void>) {
    const target = normalizeBoardPath(entry.boardRoot)
    if (!target || !entry.cardPath) return
    if (normalizeBoardPath(boards.activeBoardPath) !== target) await boards.activateBoard(target)
    await openEditor(entry.cardPath)
  }

  async function moveTemporalDate(entry: any, sourceDate: string, targetDate: string) {
    const card = await window.board.readCard(entry.cardPath)
    const frontmatter = card.frontmatter || {}
    const lineIndexes = Array.isArray(entry.temporalTaskLineIndexes) ? entry.temporalTaskLineIndexes : []
    let body = card.body || ''
    if (entry.temporalReason === 'task') {
      for (const lineIndex of lineIndexes) body = setTaskListItemDateByLineIndex(body, lineIndex, 'due', targetDate)
      await window.board.writeCard(entry.cardPath, { frontmatter, body })
    } else if (entry.temporalReason === 'task-start') {
      for (const lineIndex of lineIndexes) body = setTaskListItemDateByLineIndex(body, lineIndex, 'start', targetDate)
      await window.board.writeCard(entry.cardPath, { frontmatter, body })
    } else if (entry.temporalReason === 'card-start') {
      await window.board.updateFrontmatter(entry.cardPath, { start: targetDate })
    } else {
      await window.board.updateFrontmatter(entry.cardPath, { due: targetDate })
    }
    ui.announceStatus('Planner date updated.')
  }

  return {
    records, errors, loading, activeView, monthCursor, weekCursor, dayCursor, searchQuery, dateFilter, showCompletedCards,
    selectedBoardRoots, selectedLabelIds, openBoardRoots, selectedRoots, scope, entries, activeBoardRoot, currentBoardLabels, currentBoardName, canUseLabelFilters,
    setView, setSearchQuery, setDateFilter, setShowCompletedCards, setScope, setBoardSelected, setLabelSelected, clearFilters,
    shiftMonth, shiftWeek, shiftDay, monthToday, weekToday, dayToday, load, openCard, moveTemporalDate,
  }
})
