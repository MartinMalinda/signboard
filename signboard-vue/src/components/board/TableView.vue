<script setup lang="ts">
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { DataTableSortMeta } from 'primevue/datatable'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useLabelsStore } from '../../stores/useLabelsStore'
import { useUiStore } from '../../stores/useUiStore'
import { DASHBOARD_IMPACT_SORT_KEY, DASHBOARD_PRIORITY_SORT_KEY, useViewStore } from '../../stores/useViewStore'
import { waitForNativeSelectChangeToSettle } from '../../composables/useNativeMenuSettle'
import TableBulkActions from './TableBulkActions.vue'
import TableSortControls from './TableSortControls.vue'
import {
  TABLE_SCORE_COLUMNS,
  TABLE_LIST_FILTERS,
  createTableEntries,
  filterTableEntries,
  formatTableScore,
  pruneTableSelection,
  selectTableEntryRange,
  selectVisibleTableEntries,
  selectedTableEntries,
} from '../../../lib/tableView.js'
import { dashboardCardsForSection, dashboardSectionSortFields, isDashboardSectionId } from '../../../lib/dashboardSections'

const props = defineProps<{ onOpen?: (path: string) => void }>()
const data = useBoardDataStore()
const boards = useBoardsStore()
const labels = useLabelsStore()
const ui = useUiStore()
const view = useViewStore()

const dashboardSortSection = computed(() => isDashboardSectionId(view.dashboardSectionFilter) ? view.dashboardSectionFilter : 'priority')
const allEntries = computed(() => createTableEntries(data.lists, (listName) => labels.isCompletedList(listName), data.snapshot?.v2?.cards || [], dashboardSortSection.value))
const dashboardEntries = computed(() => {
  const sectionId = view.dashboardSectionFilter
  if (!sectionId) return allEntries.value
  const projectedCards = data.snapshot?.v2?.cards || []
  const sectionCards = sectionId === 'unshaped'
    ? projectedCards.filter((card) => card.metadata?.present !== true || card.metadata?.valid !== true || card.scores?.priority_index === null)
    : dashboardCardsForSection(projectedCards, sectionId, data.snapshot?.v2?.profile)
  const allowedPaths = new Set(sectionCards
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
  selectedLabelIds: labels.filterIds,
  dateFilter: labels.dateFilter,
  listFilter: TABLE_LIST_FILTERS.all,
}))
const visibleEntries = computed(() => filterTableEntries(dashboardEntries.value, {
  selectedLabelIds: labels.filterIds,
  dateFilter: labels.dateFilter,
  listFilter: effectiveListFilter.value,
}))
const selectedEntries = computed(() => selectedTableEntries(visibleEntries.value, view.selectedPaths))
const allVisibleSelected = computed(() => visibleEntries.value.length > 0 && visibleEntries.value.every((entry) => view.selectedPaths.has(entry.cardPath)))
const someVisibleSelected = computed(() => visibleEntries.value.some((entry) => view.selectedPaths.has(entry.cardPath)) && !allVisibleSelected.value)

const selectedRows = computed({
  get: () => selectedEntries.value,
  set: (rows: any[]) => {
    const paths = Array.isArray(rows) ? rows.map((entry) => entry?.cardPath).filter(Boolean) : []
    view.setSelection(paths, paths[paths.length - 1] || '')
  },
})

const SORT_FIELDS: Record<string, DataTableSortMeta> = Object.freeze({
  'updated-asc': { field: 'updatedAtMs', order: 1 },
  'updated-desc': { field: 'updatedAtMs', order: -1 },
  'created-asc': { field: 'createdAtMs', order: 1 },
  'created-desc': { field: 'createdAtMs', order: -1 },
  'due-asc': { field: 'dueSortValue', order: 1 },
  'title-asc': { field: 'title', order: 1 },
  'title-desc': { field: 'title', order: -1 },
})

const tableSortMeta = computed<DataTableSortMeta[]>(() => {
  if (view.sortKey === DASHBOARD_PRIORITY_SORT_KEY || view.sortKey === DASHBOARD_IMPACT_SORT_KEY) {
    const sectionId = view.dashboardSectionFilter === 'impact' || view.sortKey === DASHBOARD_IMPACT_SORT_KEY
      ? 'impact'
      : dashboardSortSection.value
    return dashboardSectionSortFields(sectionId)
  }
  if (view.sortKey === 'board') return []
  const sort = SORT_FIELDS[view.sortKey as keyof typeof SORT_FIELDS] || (() => {
    const match = String(view.sortKey || '').match(/^(.+)-(asc|desc)$/)
    return match ? { field: match[1], order: match[2] === 'desc' ? -1 : 1 } : undefined
  })()
  return sort ? [sort] : []
})

function syncSelection() {
  const next = pruneTableSelection(view.selectedPaths, view.lastSelectedPath, visibleEntries.value)
  view.setSelection(next.selectedPaths, next.lastSelectedPath)
}

function selectAll(checked: boolean) {
  const next = selectVisibleTableEntries(visibleEntries.value, view.selectedPaths, checked)
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

function openTableRow(event: any) {
  const target = event?.originalEvent?.target as HTMLElement | undefined
  if (target?.closest('button, input, select, a')) return
  openEntry(event?.data)
}

function tableSortKeyFromMeta(meta: any[]) {
  if (!meta.length) return 'board'
  if (meta.length >= 4
    && meta[0]?.field === 'dashboardSectionPriorityRank' && meta[0]?.order === 1
    && meta[1]?.field === 'dashboardSectionScore' && meta[1]?.order === -1
    && meta[2]?.field === 'dashboardSectionStatusRank' && meta[2]?.order === 1
    && meta[3]?.field === 'dashboardSectionCardName' && meta[3]?.order === 1) {
    return DASHBOARD_PRIORITY_SORT_KEY
  }
  if (meta.length >= 4
    && meta[0]?.field === 'dashboardSectionScore' && meta[0]?.order === -1
    && meta[1]?.field === 'dashboardSectionStatusRank' && meta[1]?.order === 1
    && meta[2]?.field === 'dashboardSectionPriorityRank' && meta[2]?.order === 1
    && meta[3]?.field === 'dashboardSectionCardName' && meta[3]?.order === 1) {
    return DASHBOARD_IMPACT_SORT_KEY
  }
  if (meta.length >= 3
    && meta[0]?.field === 'impactSortValue' && meta[0]?.order === -1
    && meta[1]?.field === 'dashboardStatusRank' && meta[1]?.order === 1
    && meta[2]?.field === 'dashboardCardName' && meta[2]?.order === 1) {
    return DASHBOARD_IMPACT_SORT_KEY
  }
  const first = meta[0]
  const matchingKey = Object.entries(SORT_FIELDS).find(([, value]) => value.field === first?.field && value.order === first?.order)?.[0]
  return matchingKey || (first?.field ? `${first.field}-${first.order === -1 ? 'desc' : 'asc'}` : 'board')
}

function handleTableSort(event: any) {
  const meta = Array.isArray(event?.multiSortMeta)
    ? event.multiSortMeta
    : event?.sortField
      ? [{ field: event.sortField, order: event.sortOrder }]
      : []
  view.setSortKey(tableSortKeyFromMeta(meta))
}

function tableRowClass(entry: any) {
  return {
    'board-table-row': true,
    'is-selected': view.selectedPaths.has(entry?.cardPath),
  }
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
    <div v-if="!visibleEntries.length" class="board-table-empty"><h3>{{ allEntries.length ? 'No visible cards' : 'No cards yet' }}</h3><p>{{ allEntries.length ? 'Filters or the Table list scope are hiding every card on this board.' : 'Create a card to start filling this board.' }}</p></div>
    <div v-else class="board-table-scroll">
      <DataTable
        :selection="selectedRows"
        :value="visibleEntries"
        data-key="cardPath"
        sort-mode="multiple"
        :multi-sort-meta="tableSortMeta"
        removable-sort
        :row-class="tableRowClass"
        table-class="board-table"
        class="board-table-datatable"
        @sort="handleTableSort"
        @row-click="openTableRow"
      >
        <Column header-class="board-table-heading board-table-heading-select" body-class="board-table-cell board-table-cell-select">
          <template #header><input class="board-table-select-checkbox board-table-select-all-checkbox" type="checkbox" aria-label="Select visible cards" :checked="allVisibleSelected" :indeterminate="someVisibleSelected" @click.stop @change="selectAll(($event.target as HTMLInputElement).checked)" /></template>
          <template #body="slotProps"><input class="board-table-select-checkbox" type="checkbox" :aria-label="`Select ${slotProps.data.title}`" :checked="view.selectedPaths.has(slotProps.data.cardPath)" @click.stop="selectRow(slotProps.data, $event)" /></template>
        </Column>
        <Column field="title" header="Card" sortable header-class="board-table-heading board-table-heading-title" body-class="board-table-cell board-table-cell-title">
          <template #body="slotProps"><button class="board-table-card-title-button" type="button" :aria-label="`Open ${slotProps.data.title}`" @click.stop="openEntry(slotProps.data)">{{ slotProps.data.title }}</button></template>
        </Column>
        <Column field="listDisplayName" header="List" sortable header-class="board-table-heading board-table-heading-list" body-class="board-table-cell board-table-cell-list">
          <template #body="slotProps"><select class="board-table-list-select" :aria-label="`Move ${slotProps.data.title} to list`" :value="slotProps.data.listPath" @click.stop @change.stop="moveFromChange(slotProps.data, $event)"><option v-for="list in listOptions" :key="list.listPath" :value="list.listPath">{{ list.listDisplayName }}</option></select></template>
        </Column>
        <Column field="taskSortValue" header="Tasks" sortable header-class="board-table-heading board-table-heading-tasks" body-class="board-table-cell board-table-cell-tasks">
          <template #body="slotProps"><span class="board-table-task-progress">{{ slotProps.data.taskSummary?.total ? `${slotProps.data.taskSummary.completed || 0}/${slotProps.data.taskSummary.total}` : 'None' }}</span></template>
        </Column>
        <Column field="labelsText" header="Labels" sortable header-class="board-table-heading board-table-heading-labels" body-class="board-table-cell board-table-cell-labels">
          <template #body="slotProps"><div class="board-table-labels"><span v-for="label in labels.labels.filter((candidate) => slotProps.data.labels.includes(candidate.id))" :key="label.id" class="card-label-chip">{{ label.name }}</span><span v-if="!labels.labels.some((candidate) => slotProps.data.labels.includes(candidate.id))" class="board-table-empty-value">None</span></div></template>
        </Column>
        <Column field="linkedObjectCount" header="Links" sortable header-class="board-table-heading board-table-heading-links" body-class="board-table-cell board-table-cell-links">
          <template #body="slotProps"><span v-if="slotProps.data.linkedObjectCount" class="board-table-linked-objects-badge" :aria-label="`${slotProps.data.linkedObjectCount} linked objects`">{{ slotProps.data.linkedObjectCount }}</span><span v-else class="board-table-empty-value">None</span></template>
        </Column>
        <Column field="dependsOnText" header="Depends on" sortable header-class="board-table-heading board-table-heading-depends_on" body-class="board-table-cell board-table-cell-depends_on">
          <template #body="slotProps"><div v-if="slotProps.data.dependsOn.length" class="board-table-card-references"><span v-for="reference in slotProps.data.dependsOn" :key="reference" class="board-table-card-reference" :title="reference"><span class="board-table-card-reference-text">{{ reference }}</span></span></div><span v-else class="board-table-empty-value">None</span></template>
        </Column>
        <Column field="blockedByText" header="Blocked By" sortable header-class="board-table-heading board-table-heading-blocked_by" body-class="board-table-cell board-table-cell-blocked_by">
          <template #body="slotProps"><div v-if="slotProps.data.blockedBy.length" class="board-table-card-references"><span v-for="reference in slotProps.data.blockedBy" :key="reference" class="board-table-card-reference" :title="reference"><span class="board-table-card-reference-text">{{ reference }}</span></span></div><span v-else class="board-table-empty-value">None</span></template>
        </Column>
        <Column v-for="column in TABLE_SCORE_COLUMNS" :key="column.id" :field="column.field" :header="column.label" sortable :header-class="`board-table-heading board-table-heading-${column.id}`" :body-class="`board-table-cell board-table-cell-${column.id}`">
          <template #body="slotProps"><span :class="{ 'board-table-empty-value': slotProps.data[column.field] === null }">{{ formatTableScore(slotProps.data[column.field]) }}</span></template>
        </Column>
      </DataTable>
    </div>
  </section>
</template>
