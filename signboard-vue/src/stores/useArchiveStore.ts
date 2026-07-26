import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { archiveDisplayNameForList, buildArchiveRestoreListDirectoryName, filterArchiveEntries } from '../../lib/archiveBrowser.js'
import { useBoardDataStore } from './useBoardDataStore'
import { useBoardsStore } from './useBoardsStore'
import { useUiStore } from './useUiStore'
import type { ArchiveDetail, ArchiveEntry } from '../types'

type ArchiveTab = 'cards' | 'lists'

export const useArchiveStore = defineStore('archive', () => {
  const boards = useBoardsStore()
  const data = useBoardDataStore()
  const ui = useUiStore()
  const isOpen = ref(false)
  const activeTab = ref<ArchiveTab>('cards')
  const searchQuery = ref('')
  const sortKey = ref('archived-desc')
  const entries = ref<{ cards: ArchiveEntry[]; lists: ArchiveEntry[] }>({ cards: [], lists: [] })
  const selectedEntryPath = ref('')
  const details = ref<Record<string, ArchiveDetail>>({})
  const loading = ref(false)
  const detailLoadingPath = ref('')
  const error = ref('')
  const detailError = ref('')
  const restoreOpen = ref(false)
  const restoreEntryPath = ref('')
  const restoreLists = ref<Array<{ directoryName: string; displayName: string; path: string }>>([])
  const restoreQuery = ref('')
  const restoreSelectedListPath = ref('')
  const restoreSaving = ref(false)
  const restoreError = ref('')
  let requestId = 0

  const activeEntries = computed(() => activeTab.value === 'lists' ? entries.value.lists : entries.value.cards)
  const filteredEntries = computed(() => filterArchiveEntries(activeEntries.value, searchQuery.value, sortKey.value, activeTab.value))
  const selectedEntry = computed(() => filteredEntries.value.find((entry) => entry.entryPath === selectedEntryPath.value) || null)
  const selectedDetail = computed(() => selectedEntry.value ? details.value[selectedEntry.value.entryPath] || null : null)
  const visibleRestoreLists = computed(() => {
    const query = restoreQuery.value.trim().toLowerCase()
    return restoreLists.value.filter((list) => !query || `${list.displayName} ${list.directoryName}`.toLowerCase().includes(query))
  })
  const restoreEntry = computed(() => entries.value.cards.find((entry) => entry.entryPath === restoreEntryPath.value) || null)

  function reset() {
    activeTab.value = 'cards'
    searchQuery.value = ''
    sortKey.value = 'archived-desc'
    entries.value = { cards: [], lists: [] }
    selectedEntryPath.value = ''
    details.value = {}
    loading.value = false
    detailLoadingPath.value = ''
    error.value = ''
    detailError.value = ''
    closeRestore()
  }

  function selectFirstVisible() {
    if (!filteredEntries.value.length) {
      selectedEntryPath.value = ''
      return ''
    }
    if (!filteredEntries.value.some((entry) => entry.entryPath === selectedEntryPath.value)) selectedEntryPath.value = filteredEntries.value[0]?.entryPath || ''
    return selectedEntryPath.value
  }

  async function loadDetail(entryPath: string) {
    const path = String(entryPath || '').trim()
    if (!path || details.value[path] || !window.board.readArchiveEntry) return
    detailLoadingPath.value = path
    detailError.value = ''
    try {
      const response = await window.board.readArchiveEntry(path)
      if (response.entry) details.value = { ...details.value, [path]: response.entry }
    } catch (nextError) {
      detailError.value = nextError instanceof Error ? nextError.message : 'Unable to load archive entry.'
    } finally {
      if (detailLoadingPath.value === path) detailLoadingPath.value = ''
    }
  }

  async function load() {
    if (!boards.activeBoardPath || !window.board.listArchiveEntries) return
    const token = ++requestId
    loading.value = true
    error.value = ''
    try {
      const response = await window.board.listArchiveEntries()
      if (token !== requestId) return
      entries.value = { cards: response.cards || [], lists: response.lists || [] }
      details.value = {}
      selectFirstVisible()
      await loadDetail(selectedEntryPath.value)
    } catch (nextError) {
      if (token !== requestId) return
      error.value = nextError instanceof Error ? nextError.message : 'Unable to load archive.'
    } finally {
      if (token === requestId) loading.value = false
    }
  }

  async function open() {
    if (!boards.activeBoardPath) return false
    reset()
    isOpen.value = true
    await load()
    return true
  }

  function close() {
    isOpen.value = false
    restoreOpen.value = false
    requestId += 1
  }

  function setTab(tab: ArchiveTab) {
    activeTab.value = tab === 'lists' ? 'lists' : 'cards'
    sortKey.value = 'archived-desc'
    selectedEntryPath.value = ''
    detailError.value = ''
    selectFirstVisible()
    void loadDetail(selectedEntryPath.value)
  }

  function setSearch(value: string) {
    searchQuery.value = value
    selectFirstVisible()
    void loadDetail(selectedEntryPath.value)
  }

  function setSort(value: string) {
    sortKey.value = value
    selectFirstVisible()
    void loadDetail(selectedEntryPath.value)
  }

  function select(path: string) {
    selectedEntryPath.value = path
    detailError.value = ''
    void loadDetail(path)
  }

  async function openRestoreCard(entry: ArchiveEntry) {
    if (!boards.activeBoardPath || entry.kind !== 'card' || !window.board.listLists) return
    const names = await window.board.listLists(boards.activeBoardPath)
    restoreLists.value = names.filter((name) => name !== 'XXX-Archive').map((directoryName) => ({
      directoryName,
      displayName: archiveDisplayNameForList(directoryName),
      path: `${boards.activeBoardPath}${directoryName}`,
    })).sort((left, right) => left.displayName.localeCompare(right.displayName, undefined, { numeric: true, sensitivity: 'base' }))
    const preferred = restoreLists.value.find((list) => list.directoryName === entry.originalListDirectoryName)
    restoreEntryPath.value = entry.entryPath
    restoreQuery.value = ''
    restoreSelectedListPath.value = preferred?.path || ''
    restoreError.value = ''
    restoreOpen.value = true
  }

  function closeRestore() {
    restoreOpen.value = false
    restoreEntryPath.value = ''
    restoreLists.value = []
    restoreQuery.value = ''
    restoreSelectedListPath.value = ''
    restoreSaving.value = false
    restoreError.value = ''
  }

  async function confirmRestoreCard() {
    if (!restoreSelectedListPath.value || !restoreEntryPath.value || !window.board.restoreArchivedCard) return false
    restoreSaving.value = true
    restoreError.value = ''
    try {
      await window.board.restoreArchivedCard(restoreEntryPath.value, restoreSelectedListPath.value)
      closeRestore()
      await data.reconcileAfterMutation(boards.activeBoardPath)
      await load()
      ui.announceStatus('Restored archived card.')
      return true
    } catch (nextError) {
      restoreError.value = nextError instanceof Error ? nextError.message : 'Unable to restore archived card.'
      return false
    } finally {
      restoreSaving.value = false
    }
  }

  async function restoreList(entry: ArchiveEntry, requestedDisplayName = '') {
    if (!window.board.restoreArchivedList || entry.kind !== 'list') return false
    const existing = new Set((await window.board.listLists?.(boards.activeBoardPath) || []).map((name) => String(name)))
    const preferred = String(entry.originalListDirectoryName || entry.listDirectoryName || '')
    let restoredName = preferred && !existing.has(preferred) ? preferred : buildArchiveRestoreListDirectoryName(preferred, requestedDisplayName || entry.originalListDisplayName || entry.listDisplayName || preferred)
    if (existing.has(restoredName)) {
      const promptValue = window.prompt(`A list named "${entry.originalListDisplayName || entry.listDisplayName || 'this list'}" already exists.\n\nRestore it as:`, entry.originalListDisplayName || entry.listDisplayName || preferred)
      if (promptValue == null) return false
      restoredName = buildArchiveRestoreListDirectoryName(preferred, promptValue)
    }
    await window.board.restoreArchivedList(entry.entryPath, restoredName)
    await data.reconcileAfterMutation(boards.activeBoardPath)
    await load()
    ui.announceStatus('Restored archived list.')
    return true
  }

  return {
    isOpen, activeTab, searchQuery, sortKey, entries, activeEntries, filteredEntries, selectedEntryPath, selectedEntry, selectedDetail,
    loading, detailLoadingPath, error, detailError, restoreOpen, restoreEntryPath, restoreEntry, restoreLists, visibleRestoreLists,
    restoreQuery, restoreSelectedListPath, restoreSaving, restoreError, open, close, load, setTab, setSearch, setSort, select,
    openRestoreCard, closeRestore, confirmRestoreCard, restoreList,
  }
})
