import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '../stores/useSearchStore'

describe('useSearchStore', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.useFakeTimers() })
  it('throttles search updates with an immediate first result and a trailing latest value', () => {
    const store = useSearchStore(); store.setQuery('  Launch '); expect(store.query).toBe('launch'); store.setQuery('Launch Notes'); expect(store.query).toBe('launch'); vi.advanceTimersByTime(9); expect(store.query).toBe('launch'); vi.advanceTimersByTime(1); expect(store.query).toBe('launch notes'); store.setQuery('other'); store.flush(); expect(store.query).toBe('other'); vi.useRealTimers()
  })
  it('wraps keyboard result navigation and resets its index on new search', () => {
    const store = useSearchStore(); expect(store.moveResult(1, 3)).toBe(0); expect(store.moveResult(1, 3)).toBe(1); expect(store.moveResult(-1, 3)).toBe(0); store.setQuery('next'); store.flush(); expect(store.resultIndex).toBe(-1); vi.useRealTimers()
  })
})
