import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { buildDueNotificationBody, collectDueTodayItemsForBoard, formatLocalIsoDate, hasReachedDueNotificationTime } from '../../lib/dueNotifications.js'
import { getBoardDisplayName, useBoardsStore } from './useBoardsStore'
import { useUiStore } from './useUiStore'
import type { AppSettings } from '../types'

const LAST_RUN_KEY = 'dueCardsNotificationLastRunDate'
const CHECK_INTERVAL = 60 * 1000

export const useDueNotificationsStore = defineStore('dueNotifications', () => {
  const boards = useBoardsStore()
  const ui = useUiStore()
  const running = ref(false)
  const lastError = ref('')
  const lastRunDate = ref(localStorage.getItem(LAST_RUN_KEY) || '')
  let timer: number | null = null

  const enabled = ref(false)
  const notificationTime = ref('09:00')

  async function loadSettings() {
    if (!window.electronAPI.readAppSettings) return
    const settings = await window.electronAPI.readAppSettings()
    const next = settings as AppSettings
    enabled.value = next.notifications.enabled
    notificationTime.value = next.notifications.time
  }

  async function check(now = new Date(), force = false) {
    if (running.value || !window.electronAPI.notifyDueCards) return []
    await loadSettings().catch(() => undefined)
    if (!enabled.value || !hasReachedDueNotificationTime(now, notificationTime.value)) return []
    const today = formatLocalIsoDate(now)
    if (!today || (!force && lastRunDate.value === today)) return []
    const roots = boards.openBoardPaths.length ? [...boards.openBoardPaths] : boards.activeBoardPath ? [boards.activeBoardPath] : []
    if (!roots.length) return []
    running.value = true
    lastError.value = ''
    try {
      const items = []
      for (const root of roots) {
        const boardItems = await collectDueTodayItemsForBoard(window.board, root, today)
        items.push(...boardItems.map((item) => ({ ...item, boardName: getBoardDisplayName(root) })))
      }
      const body = buildDueNotificationBody(items)
      if (body) await window.electronAPI.notifyDueCards({ title: 'Signboard', body })
      lastRunDate.value = today
      localStorage.setItem(LAST_RUN_KEY, today)
      return items
    } catch (error) {
      lastError.value = String(error instanceof Error ? error.message : error)
      ui.announceStatus('Due notifications could not be checked.')
      return []
    } finally { running.value = false }
  }

  function start() {
    stop()
    void check()
    timer = window.setInterval(() => { void check() }, CHECK_INTERVAL)
  }
  function stop() { if (timer !== null) { window.clearInterval(timer); timer = null } }

  return { running, lastError, lastRunDate, enabled, notificationTime, isScheduled: computed(() => timer !== null), loadSettings, check, start, stop }
})
