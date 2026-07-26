import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  buildPlannerBuckets,
  createPlannerEntries,
  getPlannerTemporalDates,
  plannerDateMatchesFilter,
  plannerEntryMatches,
} from '../../lib/planner.js'
import { useBoardsStore } from '../stores/useBoardsStore'
import { usePlannerStore } from '../stores/usePlannerStore'

const boardSnapshot = {
  ok: true,
  boardRoot: '/one/',
  boardName: 'One',
  boardSettings: { labels: [{ id: 'launch', name: 'Launch' }], workflow: { autoDetectCompletedLists: true } },
  lists: [
    { listName: '000-To-do-stock', listPath: '/one/000-To-do-stock/', cards: [{ cardPath: '/one/000-To-do-stock/card.md', cardName: 'card.md', frontmatter: { title: 'Launch plan', due: '2026-07-25', labels: ['launch'] }, body: '- [ ] (due: 2026-07-26) Review copy', taskSummary: { total: 1, completed: 0, remaining: 1 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: ['2026-07-26'], incompleteTaskDueDates: ['2026-07-26'], taskItems: [{ due: '2026-07-26', isCompleted: false, content: 'Review copy', contentWithoutDue: 'Review copy', lineIndex: 0 }] }] },
    { listName: '002-Done-stock', listPath: '/one/002-Done-stock/', cards: [{ cardPath: '/one/002-Done-stock/done.md', cardName: 'done.md', frontmatter: { title: 'Shipped', due: '2026-07-24' }, body: '- [x] (due: 2026-07-24) Finished', taskSummary: { total: 1, completed: 1, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [], taskItems: [{ due: '2026-07-24', isCompleted: true, content: 'Finished', lineIndex: 0 }] }] },
  ],
  errors: [],
}

describe('Planner model and store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    window.board = {
      authorizeBoardSelection: async (token) => ({ ok: true, boardRoot: token }),
      setActiveBoardRoot: async (root) => ({ ok: true, boardRoot: root }),
      syncOpenBoardsState: async () => undefined,
      clearActiveBoardRoot: async () => undefined,
      listDirectories: async () => [],
      readBoardSnapshot: async () => boardSnapshot,
      createList: async () => undefined,
      createCard: async () => undefined,
      moveList: async () => undefined,
      moveCard: async () => undefined,
      getBoardName: (path) => path,
      formatDueDate: async (date) => date,
      readCard: async () => ({ frontmatter: {}, body: '' }),
      writeCard: async () => undefined,
      updateFrontmatter: async () => ({}),
      normalizeFrontmatter: async (frontmatter) => frontmatter,
    }
  })

  it('buckets card and incomplete task dates while excluding completed task markers', () => {
    const entries = createPlannerEntries([{ boardRoot: '/one/', snapshot: boardSnapshot }])
    expect(getPlannerTemporalDates(entries[0])).toEqual(['2026-07-25', '2026-07-26'])
    expect(getPlannerTemporalDates(entries[1])).toEqual(['2026-07-24'])
    expect(plannerDateMatchesFilter('2026-07-25', 'today', '2026-07-25')).toBe(true)
    expect(plannerDateMatchesFilter('2026-07-24', 'overdue', '2026-07-25')).toBe(true)
    expect(plannerDateMatchesFilter('2026-08-01', 'next:7', '2026-07-25')).toBe(true)
    const buckets = buildPlannerBuckets(entries, (date) => date === '2026-07-26', { todayIso: '2026-07-25' })
    expect(buckets.get('2026-07-26')?.[0].temporalReason).toBe('task')
  })

  it('combines planner search, date, labels, and completed visibility rules', () => {
    const entries = createPlannerEntries([{ boardRoot: '/one/', snapshot: boardSnapshot }])
    expect(plannerEntryMatches(entries[0], { searchQuery: 'launch copy', dateFilter: 'next:7', todayIso: '2026-07-25', selectedLabelIds: ['launch'] })).toBe(true)
    expect(plannerEntryMatches(entries[1], { dateFilter: 'overdue', todayIso: '2026-07-25', showCompletedCards: false })).toBe(false)
    expect(plannerEntryMatches(entries[1], { dateFilter: 'overdue', todayIso: '2026-07-25', showCompletedCards: true })).toBe(true)
  })

  it('switches to the source board before opening a cross-board card', async () => {
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/one/', '/two/']
    boards.activeBoardPath = '/one/'
    const planner = usePlannerStore()
    const opened: string[] = []
    await planner.openCard({ boardRoot: '/two/', cardPath: '/two/000-To-do-stock/card.md' }, async (path) => { opened.push(path) })
    expect(boards.activeBoardPath).toBe('/two/')
    expect(opened).toEqual(['/two/000-To-do-stock/card.md'])
  })

  it('keeps all, current, and selected-board scopes distinct', () => {
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/one/', '/two/']
    boards.activeBoardPath = '/one/'
    const planner = usePlannerStore()
    expect(planner.scope).toBe('all')
    planner.setScope('current')
    expect(planner.scope).toBe('current')
    planner.setBoardSelected('/two/', true)
    expect(planner.scope).toBe('all')
    planner.setBoardSelected('/one/', false)
    expect(planner.scope).toBe('custom')
    expect(planner.selectedRoots).toEqual(['/two/'])
  })
})
