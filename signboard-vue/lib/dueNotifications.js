import { isCompletedListByWorkflow, normalizeWorkflowSettings } from './boardLabels.js'
import { parseTaskListItems } from './taskList.js'
import { resolveV2StageSemantics } from './v2StageSemantics.js'
import { getCardDisplayTitle } from './cardTitle.js'

const MAX_TITLE = 80
const MAX_TASK = 120
const MAX_BODY = 220
const DEFAULT_TIME = '09:00'

function normalizeTaskDueDateValue(value) {
  const candidate = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : ''
}

function normalizeDueNotificationText(value, maxLength) {
  const collapsed = String(value || '').replace(/\s+/g, ' ').trim()
  if (!collapsed) return ''
  const limit = Number(maxLength) || 0
  return !limit || collapsed.length <= limit ? collapsed : `${collapsed.slice(0, Math.max(1, limit - 1)).trimEnd()}...`
}

function formatDueNotificationItemSummary(value) {
  const item = value && typeof value === 'object' ? value : {}
  const title = normalizeDueNotificationText(item.cardTitle || 'Untitled', MAX_TITLE)
  const board = normalizeDueNotificationText(item.boardName || '', MAX_TITLE)
  const scoped = board ? `${board}: ${title}` : title
  const task = item.kind === 'task' ? normalizeDueNotificationText(item.taskText || '', MAX_TASK) : ''
  return task ? `${scoped}: ${task}` : scoped
}

function buildDueNotificationBody(values) {
  const items = Array.isArray(values) ? values : []
  if (!items.length) return ''
  if (items.length === 1) return formatDueNotificationItemSummary(items[0])
  const first = items.find((item) => item?.kind === 'task') || items[0]
  return normalizeDueNotificationText(`Due today: ${items.length} items. First: ${formatDueNotificationItemSummary(first)}`, MAX_BODY)
}

function normalizeDueNotificationTime(value) {
  const candidate = String(value || '').trim()
  return /^(?:0[1-9]|1\d|2[0-4]):[0-5]\d$/.test(candidate) ? candidate : DEFAULT_TIME
}

function hasReachedDueNotificationTime(now, value) {
  const [hours, minutes] = normalizeDueNotificationTime(value).split(':').map(Number)
  const trigger = new Date(now)
  trigger.setHours(hours === 24 ? 0 : hours, minutes, 0, 0)
  return now.getTime() >= trigger.getTime()
}

async function collectDueTodayItemsForBoard(boardApi, boardRoot, todayIsoDate) {
  if (!boardApi?.listLists || !boardApi?.listCards || !boardApi?.readCard) return []
  const root = String(boardRoot || '').replace(/\\/g, '/').replace(/\/+$/, '') + '/'
  if (root === '/') return []
  let lists
  let boardSettings
  try {
    lists = await boardApi.listLists(root)
    boardSettings = boardApi.readBoardSettings ? await boardApi.readBoardSettings(root).catch(() => ({})) : {}
  } catch { return [] }
  const v2Profile = boardSettings?.v2?.enabled === true ? boardSettings.v2 : null
  const workflow = normalizeWorkflowSettings(boardSettings?.workflow)
  const items = []
  for (const listName of Array.isArray(lists) ? lists : []) {
    if (v2Profile) {
      const stageSemantics = resolveV2StageSemantics(v2Profile, listName)
      if (!stageSemantics.mapped || stageSemantics.ambiguous || stageSemantics.terminal) continue
    } else if (isCompletedListByWorkflow(listName, workflow)) {
      continue
    }
    let cards
    try { cards = await boardApi.listCards(`${root}${listName}`) } catch { continue }
    for (const cardName of Array.isArray(cards) ? cards : []) {
      try {
        const card = await boardApi.readCard(`${root}${listName}/${cardName}`)
        const cardTitle = normalizeDueNotificationText(card?.displayTitle || getCardDisplayTitle(card?.frontmatter?.title, cardName), MAX_TITLE)
        if (normalizeTaskDueDateValue(card?.frontmatter?.due) === todayIsoDate) items.push({ kind: 'card', cardTitle, taskText: '' })
        for (const task of parseTaskListItems(card?.body || '')) {
          if (task.isCompleted || normalizeTaskDueDateValue(task.due) !== todayIsoDate) continue
          const taskText = normalizeDueNotificationText(task.contentWithoutDue || task.content || '', MAX_TASK)
          if (taskText) items.push({ kind: 'task', cardTitle, taskText })
        }
      } catch { /* unreadable cards do not stop the daily scan */ }
    }
  }
  return items
}

function formatLocalIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export { buildDueNotificationBody, collectDueTodayItemsForBoard, formatDueNotificationItemSummary, formatLocalIsoDate, hasReachedDueNotificationTime, normalizeDueNotificationText, normalizeDueNotificationTime }
