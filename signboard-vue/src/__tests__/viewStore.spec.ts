import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useViewStore } from '../stores/useViewStore'

describe('workspace view store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('keeps view selection per board and clears table selection on scope changes', () => {
    const store = useViewStore()
    store.prepareBoard('/one/')
    store.setView('table')
    store.setSelection(['/one/card.md'], '/one/card.md')
    store.setListFilter('completed')
    expect(store.selectedPaths.size).toBe(0)
    store.prepareBoard('/two/')
    expect(store.activeView).toBe('kanban')
    store.prepareBoard('/one/')
    expect(store.activeView).toBe('table')
  })

  it('toggles bulk menus and normalizes unsupported views', () => {
    const store = useViewStore()
    expect(store.setView('unknown' as never)).toBe('kanban')
    store.toggleBulkMenu('move')
    expect(store.activeBulkMenu).toBe('move')
    store.toggleBulkMenu('move')
    expect(store.activeBulkMenu).toBe('')
  })

  it('defaults opted-in boards to Dashboard and falls back when the profile is disabled', () => {
    const store = useViewStore()
    store.prepareBoard('/v2/')
    store.syncBoardProfile('/v2/', true)
    expect(store.activeView).toBe('dashboard')
    store.prepareBoard('/other/')
    store.prepareBoard('/v2/')
    expect(store.activeView).toBe('dashboard')
    store.syncBoardProfile('/v2/', false)
    expect(store.activeView).toBe('kanban')
  })
})
