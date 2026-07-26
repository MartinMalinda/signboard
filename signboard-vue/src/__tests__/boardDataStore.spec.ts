import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBoardDataStore } from '../stores/useBoardDataStore'

const initialSnapshot = {
  ok: true,
  boardRoot: '/board',
  boardName: 'Board',
  boardSettings: { labels: [] },
  lists: [{ listName: '001-Doing-stock', listPath: '/board/001-Doing-stock', cards: [] }],
  errors: [],
}

const refreshedSnapshot = {
  ...initialSnapshot,
  lists: [
    { listName: '002-Done-stock', listPath: '/board/002-Done-stock', cards: [] },
    initialSnapshot.lists[0],
  ],
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useBoardDataStore', () => {
  it('keeps the current board visible while reconciling a mutation', async () => {
    let resolveRefresh: ((snapshot: typeof refreshedSnapshot) => void) | undefined
    window.board = {
      readBoardSnapshot: vi.fn()
        .mockResolvedValueOnce(initialSnapshot)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve })),
    } as unknown as typeof window.board

    const data = useBoardDataStore()
    await data.loadBoard('/board/')

    const reconciliation = data.reconcileAfterMutation('/board/')
    expect(data.snapshot?.lists).toEqual(initialSnapshot.lists)

    resolveRefresh?.(refreshedSnapshot)
    await reconciliation

    expect(data.snapshot?.lists).toEqual(refreshedSnapshot.lists)
  })

  it('leaves the board empty until its initial snapshot arrives', async () => {
    let resolveLoad: ((snapshot: typeof initialSnapshot) => void) | undefined
    window.board = {
      readBoardSnapshot: vi.fn(() => new Promise((resolve) => { resolveLoad = resolve })),
    } as unknown as typeof window.board

    const data = useBoardDataStore()
    const load = data.loadBoard('/board/')
    expect(data.snapshot).toBeNull()

    resolveLoad?.(initialSnapshot)
    await load
    expect(data.snapshot).toEqual(initialSnapshot)
  })
})
