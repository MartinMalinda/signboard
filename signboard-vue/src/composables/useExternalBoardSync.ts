import { getCurrentInstance, onBeforeUnmount } from 'vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import { useBoardsStore } from '../stores/useBoardsStore'
import { useEditorStore } from '../stores/useEditorStore'

const SYNC_INTERVAL = 500
const RENDER_DEBOUNCE = 150

interface SyncOptions { refreshEditor?: (reconcileMissing?: boolean) => Promise<void>; isBlocked?: () => boolean }

export function useExternalBoardSync() {
  const boards = useBoardsStore()
  const data = useBoardDataStore()
  const editor = useEditorStore()
  let interval: number | null = null
  let renderTimer: number | null = null
  let watchRoot = ''
  let watchToken = 0
  let inFlight = false
  let renderInFlight = false
  let refreshPending = false
  let options: SyncOptions = {}

  function blocked() {
    return options.isBlocked?.() === true
  }

  function scheduleRefresh() {
    if (renderTimer !== null) return
    renderTimer = window.setTimeout(() => {
      renderTimer = null
      void refresh()
    }, RENDER_DEBOUNCE)
  }

  async function refresh() {
    const root = boards.activeBoardPath
    if (!root) { refreshPending = false; return }
    if (blocked()) {
      await options.refreshEditor?.(false)
      refreshPending = true
      return
    }
    if (renderInFlight) { refreshPending = true; return }
    renderInFlight = true
    refreshPending = false
    try {
      await data.reconcileAfterMutation(root)
      await options.refreshEditor?.(true)
    }
    finally { renderInFlight = false }
  }

  async function tick() {
    if (inFlight || !window.board.startBoardWatch || !window.board.getBoardWatchToken) return
    inFlight = true
    try {
      const root = boards.activeBoardPath
      if (!root) {
        if (watchRoot && window.board.stopBoardWatch) await window.board.stopBoardWatch()
        watchRoot = ''; watchToken = 0; refreshPending = false
        return
      }
      if (watchRoot !== root) {
        const result = await window.board.startBoardWatch(root)
        if (result?.ok) { watchRoot = root; watchToken = Number(await window.board.getBoardWatchToken()) || 0 }
        return
      }
      if (refreshPending && !blocked()) scheduleRefresh()
      const latest = Number(await window.board.getBoardWatchToken())
      if (Number.isFinite(latest) && latest > watchToken) { watchToken = latest; scheduleRefresh() }
    } finally { inFlight = false }
  }

  function start(nextOptions: SyncOptions = {}) {
    stop()
    options = nextOptions
    interval = window.setInterval(() => { void tick() }, SYNC_INTERVAL)
    void tick()
  }

  function stop() {
    if (interval !== null) { window.clearInterval(interval); interval = null }
    if (renderTimer !== null) { window.clearTimeout(renderTimer); renderTimer = null }
    if (watchRoot && window.board.stopBoardWatch) void window.board.stopBoardWatch()
    watchRoot = ''; watchToken = 0; refreshPending = false
  }

  async function refreshEditorIfClean() {
    const changed = await editor.refreshFromDiskIfClean()
    if (changed) options.refreshEditor?.()
  }

  if (getCurrentInstance()) onBeforeUnmount(stop)
  return { start, stop, tick, refresh, refreshEditorIfClean }
}
