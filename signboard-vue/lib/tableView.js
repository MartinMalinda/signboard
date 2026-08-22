// Table-view helpers used by the canonical Vue renderer.
import { cardMatchesFilters } from './cardFilters.js'
import { getFrontmatterLinkedObjectCount } from './linkedObjects.js'
import {
  createCardTimestampCellValue,
  formatCardTimestampDateTime,
  getCardTimestampMs,
} from './cardTimestamps.js'
import {
  compareDashboardCards,
  dashboardSectionSortValues,
} from './dashboardSections.ts'
import { getCardDisplayTitle } from './cardTitle.js'

export const TABLE_SCORE_COLUMNS = Object.freeze([
  { id: 'priority_index', field: 'priority_index', label: 'Priority' },
  { id: 'risk_reduction_index', field: 'risk_reduction_index', label: 'Risk reduction' },
  { id: 'impact_index', field: 'impact_index', label: 'Impact' },
])

export const TABLE_COLUMNS = Object.freeze([
  { id: 'select', label: '' },
  { id: 'title', field: 'title', label: 'Card' },
  { id: 'list', field: 'listDisplayName', label: 'List' },
  { id: 'tasks', field: 'taskSortValue', label: 'Tasks' },
  { id: 'labels', field: 'labelsText', label: 'Labels' },
  { id: 'links', field: 'linkedObjectCount', label: 'Links' },
  { id: 'depends_on', field: 'dependsOnText', label: 'Depends on' },
  { id: 'blocked_by', field: 'blockedByText', label: 'Blocked By' },
  ...TABLE_SCORE_COLUMNS,
])

export const TABLE_SORT_OPTIONS = Object.freeze([
  { value: 'board', label: 'Board order' },
  { value: 'dashboard-priority', label: 'Dashboard priority' },
  { value: 'dashboard-impact', label: 'Impact' },
  { value: 'updated-asc', label: 'Updated, oldest first' },
  { value: 'updated-desc', label: 'Updated, newest first' },
  { value: 'created-asc', label: 'Created, oldest first' },
  { value: 'created-desc', label: 'Created, newest first' },
  { value: 'due-asc', label: 'Due date' },
  { value: 'title-asc', label: 'Title, A-Z' },
  { value: 'title-desc', label: 'Title, Z-A' },
])

export const TABLE_LIST_FILTERS = Object.freeze({ all: 'all', completed: 'completed', prefix: 'list:' })

export function formatTableScore(value) {
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : 'None'
}

function text(value) {
  return String(value || '').trim()
}

export function normalizeTableTitle(value, filePath = '') {
  return getCardDisplayTitle(value, filePath)
}

export function getTableDisplayDate(entry, field) {
  const cardDate = text(entry?.[field])
  if (cardDate) return { dates: [cardDate], prefix: '' }
  const taskField = field === 'start' ? 'incompleteTaskStartDates' : 'incompleteTaskDueDates'
  return { dates: Array.isArray(entry?.[taskField]) ? entry[taskField].filter(Boolean) : [], prefix: 'Task: ' }
}

export function createTableEntries(lists, isCompletedList = () => false, v2Cards = [], dashboardSectionId = 'priority') {
  const v2ByPath = new Map((Array.isArray(v2Cards) ? v2Cards : [])
    .filter((card) => card && card.cardPath)
    .map((card) => [text(card.cardPath), card]))
  const rows = []
  for (const [listIndex, list] of (Array.isArray(lists) ? lists : []).entries()) {
    const completed = Boolean(isCompletedList(list?.listName))
    for (const [cardIndex, card] of (Array.isArray(list?.cards) ? list.cards : []).entries()) {
      const frontmatter = card?.frontmatter && typeof card.frontmatter === 'object' ? card.frontmatter : {}
      const projection = card?.v2 && typeof card.v2 === 'object'
        ? card.v2
        : v2ByPath.get(text(card?.cardPath))
      const metadata = frontmatter.signboard_v2 && typeof frontmatter.signboard_v2 === 'object' && !Array.isArray(frontmatter.signboard_v2)
        ? frontmatter.signboard_v2
        : (projection?.metadata && typeof projection.metadata === 'object' ? projection.metadata : {})
      const scores = projection?.scores && typeof projection.scores === 'object' ? projection.scores : {}
      const prioritySection = Array.isArray(projection?.sections)
        ? projection.sections.find((section) => section && section.name === 'priority')
        : undefined
      const tieBreakInputs = prioritySection?.tie_break_inputs && typeof prioritySection.tie_break_inputs === 'object'
        ? prioritySection.tie_break_inputs
        : {}
      const dependsOn = Array.isArray(metadata.depends_on) ? metadata.depends_on.map(text).filter(Boolean) : []
      const blockedBy = Array.isArray(metadata.blocked_by) ? metadata.blocked_by.map(text).filter(Boolean) : []
      const labels = Array.isArray(frontmatter.labels) ? frontmatter.labels.map(String) : []
      const taskSummary = card?.taskSummary && typeof card.taskSummary === 'object' ? card.taskSummary : {}
      const timestamps = card?.timestamps && typeof card.timestamps === 'object' ? card.timestamps : {}
      const dashboardCard = projection && typeof projection === 'object'
        ? { ...projection, cardPath: text(card?.cardPath), cardName: text(projection.cardName) || text(card?.cardName), listName: text(list?.listName) }
        : null
      const sectionSort = dashboardCard ? dashboardSectionSortValues(dashboardCard, dashboardSectionId) : { score: Number.NEGATIVE_INFINITY, priority: Number.MAX_SAFE_INTEGER, status: Number.MAX_SAFE_INTEGER, cardName: text(card?.cardName) }
      rows.push({
        ...card,
        cardPath: text(card?.cardPath),
        listName: text(list?.listName),
        listPath: text(list?.listPath),
        listDisplayName: text(list?.listName).replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, '') || text(list?.listName),
        isCompletedList: completed,
        title: normalizeTableTitle(frontmatter.title, card?.cardName || card?.cardPath),
        start: text(frontmatter.start),
        due: text(frontmatter.due),
        labels,
        labelsText: labels.join(', '),
        dependsOn,
        dependsOnText: dependsOn.join(', '),
        blockedBy,
        blockedByText: blockedBy.join(', '),
        body: text(card?.body),
        linkedObjectCount: getFrontmatterLinkedObjectCount(frontmatter),
        timestamps,
        updatedAtMs: getCardTimestampMs(timestamps.updatedAt),
        createdAtMs: getCardTimestampMs(timestamps.createdAt),
        dueSortValue: text(frontmatter.due) || text(card?.incompleteTaskDueDates?.[0]),
        taskSortValue: Number(taskSummary.remaining ?? taskSummary.total ?? 0),
        priority_index: typeof scores.priority_index === 'number' ? scores.priority_index : null,
        risk_reduction_index: typeof scores.risk_reduction_index === 'number' ? scores.risk_reduction_index : null,
        impact_index: typeof scores.impact_index === 'number' ? scores.impact_index : null,
        impactSortValue: typeof scores.impact_index === 'number' ? scores.impact_index : Number.NEGATIVE_INFINITY,
        dashboardPriorityRank: typeof tieBreakInputs.priority_rank === 'number' ? tieBreakInputs.priority_rank : null,
        dashboardScore: typeof tieBreakInputs.score === 'number' ? tieBreakInputs.score : null,
        dashboardStatusRank: typeof tieBreakInputs.status_rank === 'number' ? tieBreakInputs.status_rank : null,
        dashboardCardName: text(projection?.cardName) || text(card?.cardName),
        dashboardSectionScore: sectionSort.score,
        dashboardSectionPriorityRank: sectionSort.priority,
        dashboardSectionStatusRank: sectionSort.status,
        dashboardSectionCardName: sectionSort.cardName,
        dashboardProjection: dashboardCard,
        boardOrderIndex: rows.length,
        listOrderIndex: listIndex,
        cardOrderIndex: cardIndex,
      })
    }
  }
  return rows
}

export function filterTableEntries(entries, options = {}) {
  const listFilter = text(options.listFilter) || TABLE_LIST_FILTERS.all
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    if (!cardMatchesFilters(entry, {
      ...options,
      selectedLabelIds: options.selectedLabelIds,
      dateFilter: options.dateFilter,
      isCompletedList: entry.isCompletedList,
    })) return false
    if (listFilter === TABLE_LIST_FILTERS.completed) return Boolean(entry.isCompletedList)
    if (listFilter.startsWith(TABLE_LIST_FILTERS.prefix)) return entry.listPath === listFilter.slice(TABLE_LIST_FILTERS.prefix.length)
    return true
  })
}

function compareOptionalTimestamp(left, right, descending = false) {
  const leftMs = getCardTimestampMs(left)
  const rightMs = getCardTimestampMs(right)
  if (leftMs > 0 && rightMs > 0 && leftMs !== rightMs) return descending ? rightMs - leftMs : leftMs - rightMs
  if (leftMs > 0 && rightMs <= 0) return -1
  if (leftMs <= 0 && rightMs > 0) return 1
  return 0
}

function compareOptionalDate(left, right) {
  const leftValue = text(left)
  const rightValue = text(right)
  if (leftValue && rightValue && leftValue !== rightValue) return leftValue.localeCompare(rightValue)
  if (leftValue && !rightValue) return -1
  if (!leftValue && rightValue) return 1
  return 0
}

function boardOrder(left, right) {
  return (Number.isFinite(left?.boardOrderIndex) ? left.boardOrderIndex : 0)
    - (Number.isFinite(right?.boardOrderIndex) ? right.boardOrderIndex : 0)
}

export function sortTableEntries(entries, sortKey = 'board') {
  const validSort = TABLE_SORT_OPTIONS.some((option) => option.value === sortKey) ? sortKey : 'board'
  return (Array.isArray(entries) ? entries : []).slice().sort((left, right) => {
    if (validSort.startsWith('updated-')) {
      const result = compareOptionalTimestamp(left?.timestamps?.updatedAt, right?.timestamps?.updatedAt, validSort.endsWith('desc'))
      if (result) return result
    } else if (validSort.startsWith('created-')) {
      const result = compareOptionalTimestamp(left?.timestamps?.createdAt, right?.timestamps?.createdAt, validSort.endsWith('desc'))
      if (result) return result
    } else if (validSort === 'dashboard-priority') {
      const result = left?.dashboardProjection && right?.dashboardProjection
        ? compareDashboardCards(left.dashboardProjection, right.dashboardProjection, 'priority')
        : (typeof left?.dashboardPriorityRank === 'number' ? left.dashboardPriorityRank : Number.MAX_SAFE_INTEGER)
          - (typeof right?.dashboardPriorityRank === 'number' ? right.dashboardPriorityRank : Number.MAX_SAFE_INTEGER)
          || (typeof right?.dashboardScore === 'number' ? right.dashboardScore : Number.NEGATIVE_INFINITY)
            - (typeof left?.dashboardScore === 'number' ? left.dashboardScore : Number.NEGATIVE_INFINITY)
          || (typeof left?.dashboardStatusRank === 'number' ? left.dashboardStatusRank : Number.MAX_SAFE_INTEGER)
            - (typeof right?.dashboardStatusRank === 'number' ? right.dashboardStatusRank : Number.MAX_SAFE_INTEGER)
          || text(left?.dashboardCardName).localeCompare(text(right?.dashboardCardName), undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
      if (result) return result
    } else if (validSort === 'dashboard-impact') {
      const result = left?.dashboardProjection && right?.dashboardProjection
        ? compareDashboardCards(left.dashboardProjection, right.dashboardProjection, 'impact')
        : (typeof right?.impact_index === 'number' ? right.impact_index : Number.NEGATIVE_INFINITY)
          - (typeof left?.impact_index === 'number' ? left.impact_index : Number.NEGATIVE_INFINITY)
          || (typeof left?.dashboardStatusRank === 'number' ? left.dashboardStatusRank : Number.MAX_SAFE_INTEGER)
            - (typeof right?.dashboardStatusRank === 'number' ? right.dashboardStatusRank : Number.MAX_SAFE_INTEGER)
          || text(left?.dashboardCardName).localeCompare(text(right?.dashboardCardName), undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
      if (result) return result
    } else if (validSort === 'due-asc') {
      const result = compareOptionalDate(getTableDisplayDate(left, 'due').dates[0], getTableDisplayDate(right, 'due').dates[0])
      if (result) return result
    } else if (validSort === 'title-asc' || validSort === 'title-desc') {
      const result = text(left?.title).localeCompare(text(right?.title), undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
      if (result) return validSort === 'title-desc' ? -result : result
    }
    return boardOrder(left, right)
  })
}

export function selectedTableEntries(entries, selectedPaths) {
  const selected = selectedPaths instanceof Set ? selectedPaths : new Set(selectedPaths || [])
  return (Array.isArray(entries) ? entries : []).filter((entry) => selected.has(text(entry?.cardPath)))
}

export function pruneTableSelection(selectedPaths, lastSelectedPath, visibleEntries) {
  const next = selectedPaths instanceof Set ? new Set(selectedPaths) : new Set(selectedPaths || [])
  const visible = new Set((Array.isArray(visibleEntries) ? visibleEntries : []).map((entry) => text(entry?.cardPath)).filter(Boolean))
  for (const path of next) if (!visible.has(path)) next.delete(path)
  return { selectedPaths: next, lastSelectedPath: visible.has(text(lastSelectedPath)) ? text(lastSelectedPath) : '' }
}

export function selectVisibleTableEntries(visibleEntries, selected, shouldSelect) {
  const next = selected instanceof Set ? new Set(selected) : new Set(selected || [])
  for (const entry of (Array.isArray(visibleEntries) ? visibleEntries : [])) {
    const path = text(entry?.cardPath)
    if (path && shouldSelect) next.add(path)
    else if (path) next.delete(path)
  }
  const firstPath = shouldSelect && visibleEntries?.length ? text(visibleEntries[0]?.cardPath) : ''
  return { selectedPaths: next, lastSelectedPath: firstPath }
}

export function selectTableEntryRange(entry, visibleEntries, selected, lastSelectedPath, shouldSelect, useRange) {
  const entries = Array.isArray(visibleEntries) ? visibleEntries : []
  const currentPath = text(entry?.cardPath)
  const currentIndex = entries.findIndex((candidate) => text(candidate?.cardPath) === currentPath)
  const anchorIndex = entries.findIndex((candidate) => text(candidate?.cardPath) === text(lastSelectedPath))
  const next = selected instanceof Set ? new Set(selected) : new Set(selected || [])
  const start = useRange && currentIndex >= 0 && anchorIndex >= 0 ? Math.min(currentIndex, anchorIndex) : currentIndex
  const end = useRange && currentIndex >= 0 && anchorIndex >= 0 ? Math.max(currentIndex, anchorIndex) : currentIndex
  for (let index = start; index <= end; index += 1) {
    const path = text(entries[index]?.cardPath)
    if (!path) continue
    if (shouldSelect) next.add(path)
    else next.delete(path)
  }
  return { selectedPaths: next, lastSelectedPath: shouldSelect || next.size ? currentPath : '' }
}

export {
  createCardTimestampCellValue,
  formatCardTimestampDateTime,
}
