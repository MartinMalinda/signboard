<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import BoardTabs from './components/BoardTabs.vue'
import WorkspaceViewDock from './components/WorkspaceViewDock.vue'
import DashboardView from './components/DashboardView.vue'
import KanbanBoard from './components/board/KanbanBoard.vue'
import TableView from './components/board/TableView.vue'
import EmptyBoardCta from './components/board/EmptyBoardCta.vue'
import MissingBoardAlert from './components/board/MissingBoardAlert.vue'
import EditCardModal from './components/editor/EditCardModal.vue'
import AddCardModal from './components/modals/AddCardModal.vue'
import QuickAddCardModal from './components/modals/QuickAddCardModal.vue'
import AddListModal from './components/modals/AddListModal.vue'
import ArchiveBrowserModal from './components/modals/ArchiveBrowserModal.vue'
import BoardSwitcherModal from './components/modals/BoardSwitcherModal.vue'
import StaticModals from './components/modals/StaticModals.vue'
import { useShortcuts } from './composables/useShortcuts'
import { useBoardsStore } from './stores/useBoardsStore'
import { useBoardDataStore } from './stores/useBoardDataStore'
import { useUiStore } from './stores/useUiStore'
import { DASHBOARD_IMPACT_SORT_KEY, DASHBOARD_PRIORITY_SORT_KEY, useViewStore, type WorkspaceView } from './stores/useViewStore'
import SettingsModal from './components/settings/SettingsModal.vue'
import { useSettingsStore } from './stores/useSettingsStore'
import { useArchiveStore } from './stores/useArchiveStore'
import { useBoardSwitcherStore } from './stores/useBoardSwitcherStore'
import { useStaticModalStore } from './stores/useStaticModalStore'
import type { DirectorySelection } from './types'
import { useDueNotificationsStore } from './stores/useDueNotificationsStore'
import { useExternalBoardSync } from './composables/useExternalBoardSync'
import { useAccessibility } from './composables/useAccessibility'
import { applyBoardThemeToElement, clearBoardThemeFromElement } from '../lib/boardTheme.js'

const boards = useBoardsStore()
const data = useBoardDataStore()
const ui = useUiStore()
const view = useViewStore()
const settings = useSettingsStore()
const archive = useArchiveStore()
const switcher = useBoardSwitcherStore()
const staticModals = useStaticModalStore()
const dueNotifications = useDueNotificationsStore()
const externalSync = useExternalBoardSync()
const editorModal = ref<InstanceType<typeof EditCardModal> | null>(null)
const quickAddOpen = ref(false); const addListOpen = ref(false); const addCardOpen = ref(false); const addCardListPath = ref(''); const addListAfterPath = ref<string | undefined>()
let quickAddDisposer: (() => void) | undefined
let settingsDisposer: (() => void) | undefined
let switcherDisposer: (() => void) | undefined
let aboutDisposer: (() => void) | undefined
let keyboardDisposer: (() => void) | undefined
let nativeViewDisposer: (() => void) | undefined
let themeDisposer: (() => void) | undefined
let signboardCardLinkDisposer: (() => void) | undefined

useAccessibility()

function syncBodyState() {
  document.body.classList.toggle('board-empty', !boards.activeBoardPath)
}

function syncBoardTheme() {
  const boardElement = document.getElementById('board')
  if (!boards.activeBoardPath || !data.snapshot?.boardSettings) {
    clearBoardThemeFromElement(boardElement)
    return
  }
  applyBoardThemeToElement(boardElement, data.snapshot.boardSettings, ui.themeMode)
}

watch(() => ({ boardPath: boards.activeBoardPath, settings: data.snapshot?.boardSettings, theme: ui.themeMode }), syncBoardTheme, { deep: true, immediate: true })

async function openBoard() {
  await boards.pickAndOpenBoard()
  syncBodyState()
}

async function locateBoard(selection: string | DirectorySelection) {
  const authorizedPath = await boards.authorizeSelection(selection)
  if (!authorizedPath) return false
  const selectedPath = authorizedPath
  const directories = await window.board.listDirectories(selectedPath)
  const looksLikeBoard = directories.some((name) => name === 'XXX-Archive' || /^\d{3}-.+/.test(name))
  if (!looksLikeBoard && typeof window.confirm === 'function' && !window.confirm("This doesn't look like a board directory.\n\nUse anyway?")) return false
  const replaced = await boards.replaceBoardPath(boards.activeBoardPath, authorizedPath)
  syncBodyState()
  return replaced
}

async function removeBoard() {
  await boards.closeBoard(boards.activeBoardPath)
  syncBodyState()
}

async function openCard(cardPath: string, options: { focusNotes?: boolean; stack?: boolean } = {}) {
  await editorModal.value?.openCard(cardPath, options)
}

function openQuickAdd() { quickAddOpen.value = true }
function openAddList(afterPath?: string) { addListAfterPath.value = afterPath; addListOpen.value = true }
function openAddCard(listPath: string) { addCardListPath.value = listPath; addCardOpen.value = true }
function closeCreationModals() { quickAddOpen.value = false; addCardOpen.value = false; addListOpen.value = false }
async function createdCard(path: string, options: { openAfterCreate?: boolean } = {}) {
  closeCreationModals(); await data.reconcileAfterMutation(boards.activeBoardPath)
  if (options.openAfterCreate) await editorModal.value?.openCard(path, { focusNotes: true })
}
async function archiveCard(path: string) {
  if (!window.board.archiveCard) return
  if (typeof window.confirm === 'function' && !window.confirm('Archive this card?')) return
  await window.board.archiveCard(path); await data.reconcileAfterMutation(boards.activeBoardPath); ui.announceStatus('Archived card.')
}
async function duplicateCard(path: string) {
  if (!window.board.duplicateCard) return
  try {
    await window.board.duplicateCard(path)
    await data.reconcileAfterMutation(boards.activeBoardPath)
    ui.announceStatus('Duplicated card.')
  } catch (error) {
    console.error('Failed to duplicate card.', error)
    ui.announceStatus('Card could not be duplicated.')
  }
}

function openArchive() { void archive.open() }
function openBoardSwitcher() { switcher.open() }
async function switchBoard(path: string) {
  console.error('[App switchBoard start]', path, boards.activeBoardPath)
  if (editorModal.value) await editorModal.value.closeCard()
  const result = await boards.activateBoard(path)
  console.error('[App switchBoard result]', path, result, boards.activeBoardPath)
  return result
}

async function switchView(nextView: WorkspaceView) {
  if (editorModal.value) await editorModal.value.closeCard()
  if (nextView !== 'table') view.clearDashboardSectionFilter()
  view.setView(nextView)
}

function openDashboardSection(section: string) {
  view.setDashboardSectionFilter(section)
  view.setSortKey(section === 'impact' ? DASHBOARD_IMPACT_SORT_KEY : DASHBOARD_PRIORITY_SORT_KEY)
  void switchView('table')
}

async function moveEditorAdjacent(direction: -1 | 1) {
  await editorModal.value?.moveAdjacent(direction)
}

async function archiveEditorCard() {
  await editorModal.value?.archiveActive()
}

async function cycleColorScheme() {
  if (!boards.activeBoardPath) return
  await settings.cycleColorScheme()
}

useShortcuts({ onQuickAdd: openQuickAdd, onAddList: () => openAddList(), onFocusSearch: () => document.getElementById('boardSearchInput')?.focus(), onSettings: () => settings.open(), onBoardSwitcher: openBoardSwitcher, onKeyboardShortcuts: () => staticModals.openKeyboardShortcuts(), onArchive: openArchive, onView: switchView, onToggleTheme: () => ui.toggleTheme(), onCycleColorScheme: cycleColorScheme, onMoveCardLeft: () => moveEditorAdjacent(-1), onMoveCardRight: () => moveEditorAdjacent(1), onArchiveCard: archiveEditorCard })

onMounted(async () => {
  ui.restoreTheme()
  syncBodyState()
  syncBoardTheme()
  themeDisposer = window.electronAPI.onToggleThemeMode?.(() => ui.toggleTheme())
  signboardCardLinkDisposer = window.electronAPI.onOpenSignboardCardLink?.((payload) => {
    const cardPath = String(payload?.cardPath || '')
    if (cardPath) void openCard(cardPath, { stack: true })
  })
  nativeViewDisposer = window.electronAPI.onSwitchBoardView?.((nextView) => { void switchView(nextView === 'table' ? 'table' : 'kanban') })
  if (window.electronAPI.onOpenQuickAddCard) quickAddDisposer = window.electronAPI.onOpenQuickAddCard(openQuickAdd)
  settingsDisposer = window.electronAPI.onOpenBoardSettings?.(() => { void settings.open() })
  switcherDisposer = window.electronAPI.onOpenBoardSwitcher?.(openBoardSwitcher)
  aboutDisposer = window.electronAPI.onOpenAboutSignboard?.(() => staticModals.openAbout())
  keyboardDisposer = window.electronAPI.onOpenKeyboardShortcuts?.(() => staticModals.openKeyboardShortcuts())
  const initialBoardPath = await window.electronAPI.getInitialBoardPath?.()
  if (initialBoardPath) {
    await boards.openBoard(initialBoardPath)
  } else {
    await boards.restoreSession()
  }
  syncBodyState()
  dueNotifications.start()
  externalSync.start({
    refreshEditor: async (reconcileMissing = false) => { await editorModal.value?.refreshFromExternalChange(reconcileMissing) },
    isBlocked: () => Boolean(document.querySelector('[role="dialog"]:not([hidden]):not([aria-hidden="true"]), .app-popover:not(.hidden)')),
  })
})
onBeforeUnmount(() => { quickAddDisposer?.(); settingsDisposer?.(); switcherDisposer?.(); aboutDisposer?.(); keyboardDisposer?.(); nativeViewDisposer?.(); themeDisposer?.(); signboardCardLinkDisposer?.(); dueNotifications.stop(); externalSync.stop(); clearBoardThemeFromElement(document.getElementById('board')) })
</script>

<template>
  <AppHeader :on-quick-add="openQuickAdd" :on-open-settings="() => settings.open()" :on-open-archive="openArchive" :on-open-sponsor="() => staticModals.openSponsor()" :on-open-board-switcher="openBoardSwitcher"><BoardTabs :on-open="openBoard" :on-switch="switchBoard" :on-open-switcher="openBoardSwitcher" /></AppHeader>
  <main id="board" :class="{ 'board-view-dashboard': Boolean(boards.activeBoardPath) && view.activeView === 'dashboard', 'board-view-kanban': Boolean(boards.activeBoardPath) && view.activeView === 'kanban', 'board-view-table': Boolean(boards.activeBoardPath) && view.activeView === 'table' }">
    <template v-if="!boards.activeBoardPath"><EmptyBoardCta :on-open="openBoard" /></template>
    <MissingBoardAlert v-else-if="data.error" :board-path="boards.activeBoardPath" :on-locate="locateBoard" :on-remove="removeBoard" />
    <DashboardView v-else-if="view.activeView === 'dashboard' && data.snapshot?.v2" :on-open="openCard" :on-view-all="openDashboardSection" />
    <KanbanBoard v-else-if="view.activeView === 'kanban'" :on-open="openCard" :on-add-card="openAddCard" :on-add-list="openAddList" :on-archive-card="archiveCard" :on-duplicate-card="duplicateCard" :on-labels-changed="() => data.reconcileAfterMutation(boards.activeBoardPath)" />
    <TableView v-else-if="view.activeView === 'table'" :on-open="openCard" />
    <div v-else aria-hidden="true"></div>
  </main>
  <WorkspaceViewDock :active-view="view.activeView" :dashboard-enabled="Boolean(data.snapshot?.v2)" :on-change="switchView" />
  <EditCardModal ref="editorModal" />
  <AddCardModal :is-open="addCardOpen" :list-path="addCardListPath" :labels="data.snapshot?.boardSettings?.labels || []" :on-close="closeCreationModals" :on-created="createdCard" />
  <QuickAddCardModal :is-open="quickAddOpen" :on-close="closeCreationModals" :on-created="createdCard" />
  <AddListModal :is-open="addListOpen" :after-path="addListAfterPath" :on-close="closeCreationModals" :on-created="() => { addListOpen = false }" />
  <SettingsModal />
  <ArchiveBrowserModal />
  <BoardSwitcherModal :on-switch="switchBoard" :on-open-card="openCard" />
  <StaticModals />
  <div id="signboardStatusRegion" class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ ui.statusMessage }}</div>
</template>
