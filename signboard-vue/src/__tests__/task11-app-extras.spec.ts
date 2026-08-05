import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { buildDueNotificationBody, collectDueTodayItemsForBoard, hasReachedDueNotificationTime, normalizeDueNotificationTime } from '../../lib/dueNotifications.js'
import { normalizeAppSettings } from '../../lib/appSettingsSchema.js'
import { useEditorStore } from '../stores/useEditorStore'
import { useSponsorStore } from '../stores/useSponsorStore'
import { useDueNotificationsStore } from '../stores/useDueNotificationsStore'
import { useBoardsStore } from '../stores/useBoardsStore'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import { useExternalBoardSync } from '../composables/useExternalBoardSync'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  window.board = {
    readCard: vi.fn(async () => ({ frontmatter: { title: 'Original' }, body: 'Original body' })),
    writeCard: vi.fn(async () => undefined),
    normalizeFrontmatter: vi.fn(async (value) => value),
    readBoardSettings: vi.fn(async () => ({ workflow: { autoDetectCompletedLists: true } })),
    listLists: vi.fn(async () => ['001-Doing-stock', '002-Done-stock']),
    listCards: vi.fn(async (listPath) => String(listPath).includes('Done') ? ['000-completed.md'] : ['000-today.md']),
  } as unknown as typeof window.board
  window.electronAPI = { readAppSettings: vi.fn(async () => normalizeAppSettings({})), notifyDueCards: vi.fn(async () => ({ ok: true })) } as typeof window.electronAPI
  window.chooser = { pickDirectory: async () => null }
})

describe('Task 11 app extras', () => {
  it('aggregates actionable card and incomplete-task due items while excluding completed lists/tasks', async () => {
    window.board.readCard = vi.fn(async (path) => String(path).includes('completed')
      ? { frontmatter: { title: 'Done card', due: '2026-07-25' }, body: '- [x] (due: 2026-07-25) Completed' }
      : { frontmatter: { title: 'Ship release', due: '2026-07-25' }, body: '- [ ] (due: 2026-07-25) Publish notes\n- [x] (due: 2026-07-25) Already done' })
    const items = await collectDueTodayItemsForBoard(window.board, '/boards/demo/', '2026-07-25')
    expect(items).toHaveLength(2)
    expect(buildDueNotificationBody(items.map((item) => ({ ...item, boardName: 'Demo' })))).toContain('2 items')
    expect(buildDueNotificationBody(items.map((item) => ({ ...item, boardName: 'Demo' })))).toContain('Publish notes')
  })

  it('keeps notification time normalization and local trigger semantics aligned', () => {
    expect(normalizeDueNotificationTime(' 24:00 ')).toBe('24:00')
    expect(normalizeDueNotificationTime('25:00')).toBe('09:00')
    expect(hasReachedDueNotificationTime(new Date(2026, 6, 25, 9, 1), '09:00')).toBe(true)
    expect(hasReachedDueNotificationTime(new Date(2026, 6, 25, 8, 59), '09:00')).toBe(false)
  })

  it('dispatches one aggregated due notification per local day through the bridge', async () => {
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/boards/demo/']
    boards.activeBoardPath = '/boards/demo/'
    const notifications = useDueNotificationsStore()
    notifications.enabled = true
    notifications.notificationTime = '09:00'
    window.electronAPI.readAppSettings = vi.fn(async () => normalizeAppSettings({ notifications: { enabled: true, time: '09:00' } }))
    window.board.readCard = vi.fn(async () => ({ frontmatter: { title: 'Ship release', due: '2026-07-25' }, body: '- [ ] (due: 2026-07-25) Publish notes' }))
    const items = await notifications.check(new Date(2026, 6, 25, 9, 1))
    expect(items.length).toBe(2)
    expect(window.electronAPI.notifyDueCards).toHaveBeenCalledWith(expect.objectContaining({ body: expect.stringContaining('Ship release') }))
    expect(await notifications.check(new Date(2026, 6, 25, 10, 0))).toEqual([])
  })

  it('preserves clean external editor changes and protects dirty drafts', async () => {
    const editor = useEditorStore()
    await editor.open('/boards/demo/001-Doing-stock/000-card.md')
    window.board.readCard = vi.fn(async () => ({ frontmatter: { title: 'External title' }, body: 'External body' }))
    expect(await editor.refreshFromDiskIfClean()).toBe(true)
    expect(editor.title).toBe('External title')
    editor.setBody('Local draft')
    expect(await editor.refreshFromDiskIfClean()).toBe(false)
    expect(editor.body).toBe('Local draft')
    await editor.close()
  })

  it('stacks related card editors and restores the previous draft when the top card closes', async () => {
    window.board.readCard = vi.fn(async (path) => String(path).includes('second')
      ? { frontmatter: { title: 'Second card' }, body: 'Second body' }
      : { frontmatter: { title: 'First card' }, body: 'First body' })
    const editor = useEditorStore()
    await editor.open('/boards/demo/001-Doing-stock/first-card.md')
    editor.setBody('First draft')

    await editor.openStacked('/boards/demo/001-Doing-stock/second-card.md')
    expect(editor.title).toBe('Second card')
    expect(editor.stackDepth).toBe(1)

    await editor.close()
    expect(editor.title).toBe('First card')
    expect(editor.body).toBe('First draft')
    expect(editor.stackDepth).toBe(0)
    await editor.close()
    expect(editor.isOpen).toBe(false)
  })

  it('reconciles a changed watch token through the snapshot store', async () => {
    vi.useFakeTimers()
    const boards = useBoardsStore(); boards.activeBoardPath = '/boards/demo/'
    const data = useBoardDataStore(); vi.spyOn(data, 'reconcileAfterMutation').mockResolvedValue(undefined)
    let token = 1
    window.board.startBoardWatch = vi.fn(async () => ({ ok: true }))
    window.board.getBoardWatchToken = vi.fn(async () => token)
    const sync = useExternalBoardSync()
    await sync.tick()
    token = 2
    await sync.tick()
    await vi.advanceTimersByTimeAsync(200)
    expect(data.reconcileAfterMutation).toHaveBeenCalledWith('/boards/demo/')
    sync.stop()
    vi.useRealTimers()
  })

  it('normalizes shortcut settings and persists sponsor dismissal locally', () => {
    expect(normalizeAppSettings({ quickAdd: { globalShortcut: ' CommandOrControl + Shift + Space ' } }).quickAdd.globalShortcut).toBe('CommandOrControl+Shift+Space')
    const sponsor = useSponsorStore()
    sponsor.initialize()
    sponsor.dismiss()
    expect(localStorage.getItem('signboardSponsorPillDismissed')).toBe('true')
    expect(sponsor.visible).toBe(false)
    sponsor.restoreForTests()
    sponsor.dispose()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    sponsor.initialize()
    expect(sponsor.compact).toBe(true)
    sponsor.dispose()
  })
})
