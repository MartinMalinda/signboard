import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type WorkspaceView = 'dashboard' | 'planner' | 'kanban' | 'table'

const VALID_VIEWS: WorkspaceView[] = ['dashboard', 'planner', 'kanban', 'table']

function normalizeView(value: unknown): WorkspaceView {
  const normalized = String(value || '').toLowerCase() as WorkspaceView
  return VALID_VIEWS.includes(normalized) ? normalized : 'kanban'
}

export const useViewStore = defineStore('view', () => {
  const activeBoardRoot = ref('')
  const activeView = ref<WorkspaceView>('kanban')
  const sortKey = ref('board')
  const listFilter = ref('all')
  const selectedPaths = ref<Set<string>>(new Set())
  const lastSelectedPath = ref('')
  const activeBulkMenu = ref('')
  const dashboardSectionFilter = ref('')
  const viewByBoard = new Map<string, WorkspaceView>()

  function prepareBoard(boardRoot: string) {
    const normalized = String(boardRoot || '').trim()
    if (normalized === activeBoardRoot.value) return
    activeBoardRoot.value = normalized
    activeView.value = viewByBoard.get(normalized) || 'kanban'
    listFilter.value = 'all'
    dashboardSectionFilter.value = ''
    clearSelection()
  }

  function syncBoardProfile(boardRoot: string, dashboardEnabled: boolean) {
    const normalized = String(boardRoot || '').trim()
    if (normalized !== activeBoardRoot.value) return
    if (!dashboardEnabled && activeView.value === 'dashboard') {
      activeView.value = 'kanban'
      viewByBoard.set(normalized, 'kanban')
    } else if (dashboardEnabled && !viewByBoard.has(normalized)) {
      activeView.value = 'dashboard'
      viewByBoard.set(normalized, 'dashboard')
    }
  }

  function setView(view: WorkspaceView) {
    const next = normalizeView(view)
    activeView.value = next
    if (activeBoardRoot.value) viewByBoard.set(activeBoardRoot.value, next)
    clearSelection()
    return next
  }

  function setSortKey(value: string) {
    sortKey.value = value || 'board'
  }

  function setListFilter(value: string) {
    listFilter.value = value || 'all'
    clearSelection()
  }

  function setDashboardSectionFilter(value: string) {
    dashboardSectionFilter.value = String(value || '').trim()
    clearSelection()
  }

  function clearDashboardSectionFilter() {
    dashboardSectionFilter.value = ''
  }

  function setSelection(paths: Iterable<string>, anchor = '') {
    selectedPaths.value = new Set([...paths].map((path) => String(path || '').trim()).filter(Boolean))
    lastSelectedPath.value = String(anchor || '').trim()
    activeBulkMenu.value = ''
  }

  function clearSelection() {
    selectedPaths.value = new Set()
    lastSelectedPath.value = ''
    activeBulkMenu.value = ''
  }

  function toggleBulkMenu(menu: string) {
    activeBulkMenu.value = activeBulkMenu.value === menu ? '' : menu
  }

  return {
    activeBoardRoot,
    activeView: computed(() => activeView.value),
    sortKey,
    listFilter,
    selectedPaths,
    lastSelectedPath,
    activeBulkMenu,
    dashboardSectionFilter,
    prepareBoard,
    syncBoardProfile,
    setView,
    setSortKey,
    setListFilter,
    setDashboardSectionFilter,
    clearDashboardSectionFilter,
    setSelection,
    clearSelection,
    toggleBulkMenu,
  }
})
