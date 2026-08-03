<script setup lang="ts">
import { computed } from 'vue'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useLabelsStore } from '../../stores/useLabelsStore'
import { useSearchStore } from '../../stores/useSearchStore'
import { useUiStore } from '../../stores/useUiStore'
import { useViewStore } from '../../stores/useViewStore'
import { waitForNativeSelectChangeToSettle } from '../../composables/useNativeMenuSettle'
import TableBulkActions from './TableBulkActions.vue'
import TableRow from './TableRow.vue'
import TableSortControls from './TableSortControls.vue'
import {
  TABLE_COLUMNS,
  TABLE_LIST_FILTERS,
  createTableEntries,
  filterTableEntries,
  pruneTableSelection,
  selectTableEntryRange,
  selectVisibleTableEntries,
  selectedTableEntries,
  sortTableEntries,
} from '../../../lib/tableView.js'

const props = defineProps<{ onOpen?: (path: string) => void }>()
const data = useBoardDataStore()
const boards = useBoardsStore()
const labels = useLabelsStore()
const search = useSearchStore()
const ui = useUiStore()
const view = useViewStore()

const allEntries = computed(() => createTableEntries(data.lists, (listName) => labels.isCompletedList(listName)))
const dashboardEntries = computed(() => {
  const sectionId = view.dashboardSectionFilter
  if (!sectionId) return allEntries.value
  const allowedPaths = new Set((data.snapshot?.v2?.cards || [])
    .filter((card) => sectionId === 'unshaped'
      ? card.metadata?.present !== true || card.metadata?.valid !== true || card.scores?.priority_index === null
      : Array.isArray(card.sections) && card.sections.some((section) => (
        section && typeof section === 'object' && section.name === sectionId && section.included === true
      )))
    .map((card) => card.cardPath))
  return allEntries.value.filter((entry) => allowedPaths.has(entry.cardPath))
})
const listOptions = computed(() => data.lists.map((list) => ({
  listPath: list.listPath,
  listName: list.listName,
  listDisplayName: list.listName.replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, ''),
  isCompletedList: labels.isCompletedList(list.listName),
})))
const effectiveListFilter = computed(() => {
  if (view.listFilter === TABLE_LIST_FILTERS.completed) return listOptions.value.some((list) => list.isCompletedList) ? view.listFilter : TABLE_LIST_FILTERS.all
  if (view.listFilter.startsWith(TABLE_LIST_FILTERS.prefix)) return listOptions.value.some((list) => `list:${list.listPath}` === view.listFilter) ? view.listFilter : TABLE_LIST_FILTERS.all
  return TABLE_LIST_FILTERS.all
})
const boardFilteredEntries = computed(() => filterTableEntries(dashboardEntries.value, {
  query: search.query,
  selectedLabelIds: labels.filterIds,
  dateFilter: labels.dateFilter,
  listFilter: TABLE_LIST_FILTERS.all,
}))
const visibleEntries = computed(() => sortTableEntries(filterTableEntries(dashboardEntries.value, {
  query: search.query,
  selectedLabelIds: labels.filterIds,
  dateFilter: labels.dateFilter,
  listFilter: effectiveListFilter.value,
}), view.sortKey))
const selectedEntries = computed(() => selectedTableEntries(visibleEntries.value, view.selectedPaths))
const allVisibleSelected = computed(() => visibleEntries.value.length > 0 && visibleEntries.value.every((entry) => view.selectedPaths.has(entry.cardPath)))
const someVisibleSelected = computed(() => visibleEntries.value.some((entry) => view.selectedPaths.has(entry.cardPath)) && !allVisibleSelected.value)

function syncSelection() {
  const next = pruneTableSelection(view.selectedPaths, view.lastSelectedPath, visibleEntries.value)
  view.setSelection(next.selectedPaths, next.lastSelectedPath)
}

function selectAll(event: Event) {
  const checkbox = event.target as HTMLInputElement
  const next = selectVisibleTableEntries(visibleEntries.value, view.selectedPaths, checkbox.checked)
  view.setSelection(next.selectedPaths, next.lastSelectedPath)
}

function selectRow(entry: any, event: Event) {
  const checkbox = event.target as HTMLInputElement
  const next = selectTableEntryRange(entry, visibleEntries.value, view.selectedPaths, view.lastSelectedPath, checkbox.checked, (event as MouseEvent).shiftKey)
  view.setSelection(next.selectedPaths, next.lastSelectedPath)
}

function openEntry(entry: any) {
  if (entry?.cardPath) props.onOpen?.(entry.cardPath)
}

async function chooseSort(event: Event) {
  const select = event.target as HTMLSelectElement
  const next = String(select.value || 'board')
  if (!await waitForNativeSelectChangeToSettle(select, next)) return
  view.setSortKey(next)
}

async function chooseListFilter(event: Event) {
  const select = event.target as HTMLSelectElement
  const next = String(select.value || TABLE_LIST_FILTERS.all)
  if (!await waitForNativeSelectChangeToSettle(select, next)) return
  view.setListFilter(next)
  syncSelection()
}

async function moveEntry(entry: any, targetListPath: string) {
  const target = String(targetListPath || '').trim()
  if (!target || target === entry.listPath || !window.board.moveCardToTop) return
  try {
    await waitForNativeSelectChangeToSettle(document.activeElement as HTMLSelectElement, target)
    await window.board.moveCardToTop(entry.cardPath, target)
    await data.reconcileAfterMutation(boards.activeBoardPath)
    ui.announceStatus(`Moved ${entry.title}.`)
    view.clearSelection()
  } catch (error) {
    console.error('Failed to move table row card.', error)
    ui.announceStatus('Card move could not be saved.')
  }
}

function moveFromChange(entry: any, event: Event) {
  void moveEntry(entry, (event.target as HTMLSelectElement).value)
}

async function archiveSelected() {
  if (!selectedEntries.value.length || !window.board.archiveCard) return
  if (typeof window.confirm === 'function' && !window.confirm(`Archive ${selectedEntries.value.length} selected card${selectedEntries.value.length === 1 ? '' : 's'}?\n\nThis will move them into XXX-Archive.`)) return
  let count = 0
  for (const entry of selectedEntries.value) {
    try { await window.board.archiveCard(entry.cardPath); count += 1 } catch (error) { console.error('Failed to archive table card.', error) }
  }
  view.clearSelection()
  await data.reconcileAfterMutation(boards.activeBoardPath)
  ui.announceStatus(`Archived ${count} card${count === 1 ? '' : 's'}.`)
}

async function moveSelected(targetListPath: string) {
  const target = String(targetListPath || '').trim()
  const entries = selectedEntries.value.filter((entry) => entry.listPath !== target)
  if (!target || !entries.length || !window.board.moveCardToTop) return
  let count = 0
  for (const entry of entries.slice().reverse()) {
    try { await window.board.moveCardToTop(entry.cardPath, target); count += 1 } catch (error) { console.error('Failed to move selected table card.', error) }
  }
  view.clearSelection()
  await data.reconcileAfterMutation(boards.activeBoardPath)
  ui.announceStatus(`Moved ${count} card${count === 1 ? '' : 's'}.`)
}

async function updateSelectedLabels(mode: 'add' | 'remove', ids: string[]) {
  if (!ids.length || !selectedEntries.value.length) return
  for (const entry of selectedEntries.value) {
    const current: string[] = Array.isArray(entry.labels) ? entry.labels.map((label: unknown) => String(label)) : []
    const next = mode === 'add'
      ? [...current, ...ids.filter((id) => !current.includes(id))]
      : current.filter((id) => !ids.includes(id))
    if (next.join('\u0000') === current.join('\u0000')) continue
    try { await window.board.updateFrontmatter(entry.cardPath, { labels: next }) } catch (error) { console.error('Failed to update selected table labels.', error) }
  }
  view.clearSelection()
  await data.reconcileAfterMutation(boards.activeBoardPath)
  ui.announceStatus('Updated labels on selected cards.')
}

async function updateSelectedDate(field: 'start' | 'due', value: string) {
  const normalized = String(value || '').trim()
  if (normalized && !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    ui.announceStatus('Use a valid YYYY-MM-DD date.')
    return
  }
  if (!normalized && typeof window.confirm === 'function' && !window.confirm(`Clear the ${field} date from selected cards?`)) return
  for (const entry of selectedEntries.value) {
    try { await window.board.updateFrontmatter(entry.cardPath, { [field]: normalized }) } catch (error) { console.error(`Failed to update selected ${field} dates.`, error) }
  }
  view.clearSelection()
  await data.reconcileAfterMutation(boards.activeBoardPath)
  ui.announceStatus(`${normalized ? 'Set' : 'Cleared'} ${field} date on selected cards.`)
}

</script>

<template>
  <section id="boardTableView" class="board-table-view" aria-label="Table view">
    <div class="board-table-header">
      <div class="board-table-header-left">
        <TableBulkActions v-if="selectedEntries.length" :count="selectedEntries.length" :active-menu="view.activeBulkMenu" :labels="labels.labels" :list-options="listOptions" :on-toggle-menu="view.toggleBulkMenu" :on-archive="archiveSelected" :on-move="moveSelected" :on-update-labels="updateSelectedLabels" :on-update-date="updateSelectedDate" :on-clear="view.clearSelection" />
      </div>
      <div class="board-table-header-right">
        <TableSortControls :sort-key="view.sortKey" :list-filter="effectiveListFilter" :list-options="listOptions" :on-sort="chooseSort" :on-list-filter="chooseListFilter" />
        <p class="board-table-summary">{{ visibleEntries.length === boardFilteredEntries.length ? `${visibleEntries.length} ${visibleEntries.length === 1 ? 'card' : 'cards'}` : `${visibleEntries.length} of ${boardFilteredEntries.length} cards` }}</p>
      </div>
    </div>
    <div v-if="!visibleEntries.length" class="board-table-empty"><h3>{{ allEntries.length ? 'No visible cards' : 'No cards yet' }}</h3><p>{{ allEntries.length ? 'Search, filters, or the Table list scope are hiding every card on this board.' : 'Create a card to start filling this board.' }}</p></div>
    <div v-else class="board-table-scroll">
      <table class="board-table">
        <thead><tr><th v-for="column in TABLE_COLUMNS" :key="column.id" :class="`board-table-heading board-table-heading-${column.id}`" scope="col"><input v-if="column.id === 'select'" class="board-table-select-checkbox board-table-select-all-checkbox" type="checkbox" aria-label="Select visible cards" :checked="allVisibleSelected" :indeterminate="someVisibleSelected" @change="selectAll" /><template v-else>{{ column.label }}</template></th></tr></thead>
        <tbody>
          <TableRow v-for="entry in visibleEntries" :key="entry.cardPath" :entry="entry" :labels="labels.labels" :list-options="listOptions" :selected="view.selectedPaths.has(entry.cardPath)" :on-select="selectRow" :on-open="openEntry" :on-move="moveFromChange" />
        </tbody>
      </table>
    </div>
  </section>
</template>
