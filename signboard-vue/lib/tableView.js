// THIS CAN BE REMOVED WHEN Vue cutover makes this the canonical module; keep in sync with app/board/tableView.js.
import { cardMatchesFilters } from './cardFilters.js'
import { getFrontmatterLinkedObjectCount } from './linkedObjects.js'
import {
  createCardTimestampCellValue,
  formatCardTimestampDateTime,
  getCardTimestampMs,
} from './cardTimestamps.js'

export const TABLE_COLUMNS = Object.freeze([
  { id: 'select', label: '' },
  { id: 'start', label: 'Start' },
  { id: 'due', label: 'Due' },
  { id: 'updated', label: 'Updated' },
  { id: 'created', label: 'Created' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'links', label: 'Links' },
  { id: 'title', label: 'Card' },
  { id: 'list', label: 'List' },
  { id: 'labels', label: 'Labels' },
])

export const TABLE_SORT_OPTIONS = Object.freeze([
  { value: 'board', label: 'Board order' },
  { value: 'updated-asc', label: 'Updated, oldest first' },
  { value: 'updated-desc', label: 'Updated, newest first' },
  { value: 'created-asc', label: 'Created, oldest first' },
  { value: 'created-desc', label: 'Created, newest first' },
  { value: 'due-asc', label: 'Due date' },
  { value: 'title-asc', label: 'Title, A-Z' },
])

export const TABLE_LIST_FILTERS = Object.freeze({ all: 'all', completed: 'completed', prefix: 'list:' })

function text(value) {
  return String(value || '').trim()
}

export function normalizeTableTitle(value) {
  return text(value).replace(/^#\s+/, '') || 'Untitled'
}

export function getTableDisplayDate(entry, field) {
  const cardDate = text(entry?.[field])
  if (cardDate) return { dates: [cardDate], prefix: '' }
  const taskField = field === 'start' ? 'incompleteTaskStartDates' : 'incompleteTaskDueDates'
  return { dates: Array.isArray(entry?.[taskField]) ? entry[taskField].filter(Boolean) : [], prefix: 'Task: ' }
}

export function createTableEntries(lists, isCompletedList = () => false) {
  const rows = []
  for (const [listIndex, list] of (Array.isArray(lists) ? lists : []).entries()) {
    const completed = Boolean(isCompletedList(list?.listName))
    for (const [cardIndex, card] of (Array.isArray(list?.cards) ? list.cards : []).entries()) {
      const frontmatter = card?.frontmatter && typeof card.frontmatter === 'object' ? card.frontmatter : {}
      rows.push({
        ...card,
        cardPath: text(card?.cardPath),
        listName: text(list?.listName),
        listPath: text(list?.listPath),
        listDisplayName: text(list?.listName).replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, '') || text(list?.listName),
        isCompletedList: completed,
        title: normalizeTableTitle(frontmatter.title),
        start: text(frontmatter.start),
        due: text(frontmatter.due),
        labels: Array.isArray(frontmatter.labels) ? frontmatter.labels.map(String) : [],
        body: text(card?.body),
        linkedObjectCount: getFrontmatterLinkedObjectCount(frontmatter),
        timestamps: card?.timestamps && typeof card.timestamps === 'object' ? card.timestamps : {},
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
      query: options.query,
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
    } else if (validSort === 'due-asc') {
      const result = compareOptionalDate(getTableDisplayDate(left, 'due').dates[0], getTableDisplayDate(right, 'due').dates[0])
      if (result) return result
    } else if (validSort === 'title-asc') {
      const result = text(left?.title).localeCompare(text(right?.title), undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
      if (result) return result
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
