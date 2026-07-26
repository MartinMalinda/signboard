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
})
