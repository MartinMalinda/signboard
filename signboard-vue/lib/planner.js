// THIS CAN BE REMOVED WHEN Vue cutover makes this the canonical module; keep in sync with app/board/plannerView.js and app/board/boardViews.js.
import { parseTaskListItems } from './taskList.js'
import { isCompletedListByWorkflow } from './boardLabels.js'

export const PLANNER_VIEW_IDS = Object.freeze({ calendar: 'calendar', thisWeek: 'this-week', day: 'day', agenda: 'agenda' })
export const PLANNER_DATE_FILTERS = Object.freeze({ none: '', today: 'today', overdue: 'overdue', next7: 'next:7', next14: 'next:14', next30: 'next:30' })
export const PLANNER_DATE_FILTER_OPTIONS = Object.freeze([
  { value: '', label: 'All dated cards' },
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'next:7', label: 'Next 7 days' },
  { value: 'next:14', label: 'Next 14 days' },
  { value: 'next:30', label: 'Next 30 days' },
])

const BOARD_SOURCE_PALETTES = Object.freeze({
  default: { light: { surface: '#ffffff', accent: '#0b5fff' }, dark: { surface: '#12200a', accent: '#6fcf97' } },
  harvest: { light: { surface: '#fcfaf4', accent: '#c4850a' }, dark: { surface: '#282012', accent: '#f9a03f' } },
  lavender: { light: { surface: '#fafbf7', accent: '#7b6e8a' }, dark: { surface: '#292631', accent: '#c4bdd2' } },
  olive: { light: { surface: '#fefcee', accent: '#5d6832' }, dark: { surface: '#212a14', accent: '#a2ad62' } },
})

function text(value) { return String(value || '').trim() }

export function normalizePlannerView(value) {
  const normalized = text(value).toLowerCase()
  return Object.values(PLANNER_VIEW_IDS).includes(normalized) ? normalized : PLANNER_VIEW_IDS.calendar
}

export function normalizePlannerDateFilter(value) {
  const normalized = text(value).toLowerCase()
  return Object.values(PLANNER_DATE_FILTERS).includes(normalized) ? normalized : PLANNER_DATE_FILTERS.none
}

export function parsePlannerIsoDate(value) {
  const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null
}

export function formatPlannerIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function addPlannerDays(isoDate, amount) {
  const date = parsePlannerIsoDate(isoDate)
  if (!date) return ''
  date.setDate(date.getDate() + Number(amount || 0))
  return formatPlannerIsoDate(date)
}

export function createPlannerMonthCursor(value = new Date()) {
  const source = value instanceof Date ? value : new Date(value)
  return new Date(source.getFullYear(), source.getMonth(), 1)
}

export function createPlannerWeekCursor(value = new Date()) {
  const source = value instanceof Date ? value : new Date(value)
  const date = new Date(source.getFullYear(), source.getMonth(), source.getDate())
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}

export function createPlannerDayCursor(value = new Date()) {
  const source = value instanceof Date ? value : new Date(value)
  return new Date(source.getFullYear(), source.getMonth(), source.getDate())
}

export function getPlannerTodayIso(now = new Date()) { return formatPlannerIsoDate(now) }

export function plannerDateMatchesFilter(dateValue, filter = '', todayIso = getPlannerTodayIso()) {
  const date = text(dateValue)
  const normalizedFilter = normalizePlannerDateFilter(filter)
  if (!parsePlannerIsoDate(date)) return false
  if (!normalizedFilter) return true
  if (normalizedFilter === PLANNER_DATE_FILTERS.today) return date === todayIso
  if (normalizedFilter === PLANNER_DATE_FILTERS.overdue) return date < todayIso
  const days = Number(normalizedFilter.split(':')[1])
  const end = addPlannerDays(todayIso, days)
  return date >= todayIso && date <= end
}

function listTaskDates(entry, field) {
  const explicit = entry?.[field]
  if (Array.isArray(explicit)) return explicit.map(text).filter(Boolean)
  return []
}

export function getPlannerTemporalDates(entry) {
  return [...new Set([
    text(entry?.start), text(entry?.due),
    ...listTaskDates(entry, 'incompleteTaskStartDates'),
    ...listTaskDates(entry, 'incompleteTaskDueDates'),
  ].filter((value) => parsePlannerIsoDate(value)).sort())]
}

export function plannerEntryMatches(entry, options = {}) {
  if (entry?.isCompletedList && !options.showCompletedCards) return false
  const query = text(options.searchQuery).toLowerCase()
  const tokens = query ? query.split(/\s+/).filter(Boolean) : []
  const haystack = [entry?.title, entry?.body, entry?.boardDisplayName, entry?.listDisplayName].map(text).join('\n').toLowerCase()
  if (!tokens.every((token) => haystack.includes(token))) return false
  const selectedLabels = Array.isArray(options.selectedLabelIds) ? options.selectedLabelIds.map(String).filter(Boolean) : []
  if (selectedLabels.length && !selectedLabels.some((id) => (entry?.labels || []).map(String).includes(id))) return false
  const dates = getPlannerTemporalDates(entry)
  return dates.some((date) => plannerDateMatchesFilter(date, options.dateFilter, options.todayIso))
}

export function createPlannerEntries(boardRecords) {
  const entries = []
  for (const record of Array.isArray(boardRecords) ? boardRecords : []) {
    const boardRoot = text(record?.boardRoot)
    const snapshot = record?.snapshot || {}
    const boardDisplayName = text(snapshot.boardName) || text(boardRoot).replace(/\/+$/, '').split('/').filter(Boolean).pop() || 'Board'
    const settings = snapshot.boardSettings || {}
    for (const list of Array.isArray(snapshot.lists) ? snapshot.lists : []) {
      const isCompletedList = isCompletedListByWorkflow(list?.listName, settings.workflow)
      const listDisplayName = text(list?.listName).replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, '') || text(list?.listName)
      for (const card of Array.isArray(list?.cards) ? list.cards : []) {
        const frontmatter = card?.frontmatter && typeof card.frontmatter === 'object' ? card.frontmatter : {}
        const taskItems = Array.isArray(card?.taskItems) && card.taskItems.length ? card.taskItems : parseTaskListItems(card?.body || '')
        entries.push({
          ...card,
          boardRoot,
          boardDisplayName,
          boardColorScheme: text(settings.colorScheme) || 'default',
          listName: text(list?.listName),
          listPath: text(list?.listPath),
          listDisplayName,
          isCompletedList,
          title: text(frontmatter.title).replace(/^#\s+/, '') || 'Untitled',
          start: text(frontmatter.start),
          due: text(frontmatter.due),
          labels: Array.isArray(frontmatter.labels) ? frontmatter.labels.map(String) : [],
          body: String(card?.body || ''),
          taskItems,
          incompleteTaskStartDates: Array.isArray(card?.incompleteTaskStartDates) ? card.incompleteTaskStartDates : taskItems.filter((item) => !item.isCompleted).map((item) => item.start).filter(Boolean),
          incompleteTaskDueDates: Array.isArray(card?.incompleteTaskDueDates) ? card.incompleteTaskDueDates : taskItems.filter((item) => !item.isCompleted).map((item) => item.due).filter(Boolean),
        })
      }
    }
  }
  return entries
}

export function getPlannerVisibleDates(entry, options = {}) {
  if (!plannerEntryMatches(entry, options)) return []
  return getPlannerTemporalDates(entry).filter((date) => plannerDateMatchesFilter(date, options.dateFilter, options.todayIso))
}

function taskContent(task) { return text(task?.contentWithoutDue || task?.content) || 'Task due' }

export function createPlannerPlacement(entry, isoDate) {
  const taskItems = Array.isArray(entry?.taskItems) ? entry.taskItems : []
  const dueTasks = taskItems.filter((item) => !item.isCompleted && text(item.due) === isoDate)
  if (dueTasks.length) return { ...entry, temporalDisplayTitle: dueTasks.length === 1 ? taskContent(dueTasks[0]) : `${taskContent(dueTasks[0])} +${dueTasks.length - 1} more`, temporalDisplaySubtitle: entry.title, temporalReason: 'task', temporalTaskLineIndexes: dueTasks.map((item) => Number(item.lineIndex)).filter(Number.isInteger) }
  if (text(entry.due) !== isoDate) {
    const startTasks = taskItems.filter((item) => !item.isCompleted && text(item.start) === isoDate)
    if (startTasks.length) return { ...entry, temporalDisplayTitle: `Start: ${startTasks.length === 1 ? taskContent(startTasks[0]) : `${taskContent(startTasks[0])} +${startTasks.length - 1} more`}`, temporalDisplaySubtitle: entry.title, temporalReason: 'task-start', temporalTaskLineIndexes: startTasks.map((item) => Number(item.lineIndex)).filter(Number.isInteger) }
    if (text(entry.start) === isoDate) return { ...entry, temporalDisplayTitle: `Start: ${entry.title}`, temporalDisplaySubtitle: '', temporalReason: 'card-start', temporalTaskLineIndexes: [] }
    return null
  }
  return { ...entry, temporalDisplayTitle: entry.title, temporalDisplaySubtitle: '', temporalReason: 'card', temporalTaskLineIndexes: [] }
}

export function buildPlannerBuckets(entries, range, options = {}) {
  const buckets = new Map()
  for (const entry of Array.isArray(entries) ? entries : []) {
    for (const date of getPlannerVisibleDates(entry, options)) {
      if (!range(date)) continue
      const placement = createPlannerPlacement(entry, date)
      if (!placement) continue
      if (!buckets.has(date)) buckets.set(date, [])
      buckets.get(date).push(placement)
    }
  }
  for (const values of buckets.values()) values.sort(comparePlannerPlacements)
  return buckets
}

export function buildPlannerAgenda(entries, options = {}) {
  const placements = []
  for (const entry of Array.isArray(entries) ? entries : []) {
    for (const date of getPlannerVisibleDates(entry, options)) {
      const placement = createPlannerPlacement(entry, date)
      if (placement) placements.push({ ...placement, agendaDate: date })
    }
  }
  return placements.sort((left, right) => text(left.agendaDate).localeCompare(text(right.agendaDate)) || comparePlannerPlacements(left, right))
}

export function comparePlannerPlacements(left, right) {
  return [left?.boardDisplayName, left?.listDisplayName, left?.temporalDisplayTitle || left?.title].map(text).join('\n').localeCompare([right?.boardDisplayName, right?.listDisplayName, right?.temporalDisplayTitle || right?.title].map(text).join('\n'), undefined, { sensitivity: 'base' })
}

function hex(value) { const source = text(value).replace('#', ''); return /^[\da-f]{6}$/i.test(source) ? source : '808080' }
function mix(left, right, ratio) { const a = hex(left); const b = hex(right); return `#${[0, 2, 4].map((index) => Math.round(Number.parseInt(a.slice(index, index + 2), 16) * ratio + Number.parseInt(b.slice(index, index + 2), 16) * (1 - ratio)).toString(16).padStart(2, '0')).join('')}` }

export function getPlannerSourceTheme(colorScheme = 'default') {
  const palette = BOARD_SOURCE_PALETTES[text(colorScheme).toLowerCase()] || BOARD_SOURCE_PALETTES.default
  return Object.fromEntries(['light', 'dark'].map((mode) => [mode, { background: mix(palette[mode].accent, palette[mode].surface, mode === 'dark' ? 0.26 : 0.12), border: mix(palette[mode].accent, palette[mode].surface, mode === 'dark' ? 0.58 : 0.45), color: palette[mode].accent, accent: palette[mode].accent }]))
}
