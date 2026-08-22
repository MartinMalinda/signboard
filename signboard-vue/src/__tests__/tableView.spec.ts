import { describe, expect, it } from 'vitest'
import {
  TABLE_COLUMNS,
  createTableEntries,
  filterTableEntries,
  formatTableScore,
  pruneTableSelection,
  selectTableEntryRange,
  selectVisibleTableEntries,
  sortTableEntries,
} from '../../lib/tableView.js'

function lists() {
  return [
    {
      listName: '000-To-do-stock', listPath: '/board/000-To-do-stock/', cards: [
        { cardPath: '/board/000-To-do-stock/a.md', frontmatter: { title: 'Zeta', due: '2026-07-30', labels: ['work'] }, body: '', taskSummary: { total: 2, completed: 1, remaining: 1 }, incompleteTaskDueDates: [], timestamps: { updatedAt: '2026-07-20T00:00:00Z', createdAt: '2026-07-10T00:00:00Z' } },
        { cardPath: '/board/000-To-do-stock/b.md', frontmatter: { title: 'Alpha', labels: [] }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, incompleteTaskDueDates: ['2026-07-22'], timestamps: { updatedAt: '2026-07-22T00:00:00Z', createdAt: '2026-07-11T00:00:00Z' } },
      ],
    },
    {
      listName: '002-Done-stock', listPath: '/board/002-Done-stock/', cards: [
        { cardPath: '/board/002-Done-stock/c.md', frontmatter: { title: 'Completed', due: '2026-07-21', labels: ['work'] }, body: '', taskSummary: { total: 1, completed: 1, remaining: 0 }, incompleteTaskDueDates: [], timestamps: { updatedAt: '2026-07-23T00:00:00Z', createdAt: '2026-07-12T00:00:00Z' } },
      ],
    },
  ]
}

describe('table view model', () => {
  it('rounds score values for display without changing the stored value', () => {
    expect(formatTableScore(28.266867128868274)).toBe('28')
    expect(formatTableScore(43.8658126423878)).toBe('44')
    expect(formatTableScore(0)).toBe('0')
    expect(formatTableScore(null)).toBe('None')
  })

  it('uses the requested table column order and omits card dates', () => {
    expect(TABLE_COLUMNS.map((column) => column.id)).toEqual([
      'select', 'title', 'list', 'tasks', 'labels', 'links', 'depends_on', 'blocked_by',
      'priority_index', 'risk_reduction_index', 'impact_index',
    ])
    expect(TABLE_COLUMNS.map((column) => column.label)).not.toContain('Start')
    expect(TABLE_COLUMNS.map((column) => column.label)).not.toContain('Due')
  })

  it('projects V2 dependencies and scores into sortable row fields', () => {
    const entries = createTableEntries([{
      listName: '000-To-do-stock',
      listPath: '/board/000-To-do-stock/',
      cards: [{
        cardPath: '/board/000-To-do-stock/v2.md',
        frontmatter: { title: 'V2 card', signboard_v2: { depends_on: ['Alpha'], blocked_by: ['Beta'] } },
        body: '',
        taskSummary: { total: 0, completed: 0, remaining: 0 },
      }],
    }], () => false, [{
      cardPath: '/board/000-To-do-stock/v2.md',
      scores: { priority_index: 4, risk_reduction_index: 8, impact_index: 12 },
      cardName: 'v2.md',
      sections: [{ name: 'priority', tie_break_inputs: { priority_rank: 2, score: 9, status_rank: 1 } }],
    }])
    expect(entries[0]).toMatchObject({ dependsOn: ['Alpha'], blockedBy: ['Beta'], priority_index: 4, risk_reduction_index: 8, impact_index: 12, dashboardPriorityRank: 2, dashboardScore: 9, dashboardStatusRank: 1, dashboardCardName: 'v2.md' })
    expect(sortTableEntries(entries, 'dashboard-priority')[0].title).toBe('V2 card')
  })

  it('sorts the Impact view by positive value and puts missing scores last', () => {
    const entries = createTableEntries([{
      listName: '000-To-do-stock',
      listPath: '/board/000-To-do-stock/',
      cards: [
        { cardPath: '/board/000-To-do-stock/missing.md', frontmatter: { title: 'Missing' }, body: '' },
        { cardPath: '/board/000-To-do-stock/high.md', frontmatter: { title: 'High' }, body: '' },
      ],
    }], () => false, [
      { cardPath: '/board/000-To-do-stock/missing.md', scores: { impact_index: null }, cardName: 'missing.md' },
      { cardPath: '/board/000-To-do-stock/high.md', scores: { impact_index: 20 }, cardName: 'high.md' },
    ])
    expect(sortTableEntries(entries, 'dashboard-impact').map((entry) => entry.title)).toEqual(['High', 'Missing'])
  })

  it('sorts timestamps, due dates, titles, and falls back to board order', () => {
    const entries = createTableEntries(lists(), (name) => name.startsWith('002-'))
    expect(sortTableEntries(entries, 'title-asc').map((entry) => entry.title)).toEqual(['Alpha', 'Completed', 'Zeta'])
    expect(sortTableEntries(entries, 'updated-desc').map((entry) => entry.title)).toEqual(['Completed', 'Alpha', 'Zeta'])
    expect(sortTableEntries(entries, 'due-asc').map((entry) => entry.title)).toEqual(['Completed', 'Alpha', 'Zeta'])
    expect(sortTableEntries(entries, 'board').map((entry) => entry.title)).toEqual(['Zeta', 'Alpha', 'Completed'])
  })

  it('combines filters and keeps completed-list cards out of date filters', () => {
    const entries = createTableEntries(lists(), (name) => name.startsWith('002-'))
    expect(filterTableEntries(entries, { dateFilter: 'overdue', today: '2026-07-25' }).map((entry) => entry.title)).toEqual(['Alpha'])
    expect(filterTableEntries(entries, { selectedLabelIds: ['work'], listFilter: 'completed' }).map((entry) => entry.title)).toEqual(['Completed'])
    expect(filterTableEntries(entries, { listFilter: 'list:/board/000-To-do-stock/' }).map((entry) => entry.title)).toEqual(['Zeta', 'Alpha'])
  })

  it('supports select-all, shift ranges, and pruning hidden selections', () => {
    const entries = createTableEntries(lists())
    const selected = selectVisibleTableEntries(entries, new Set(), true)
    expect(selected.selectedPaths.size).toBe(3)
    const ranged = selectTableEntryRange(entries[1], entries, new Set(), entries[0].cardPath, true, true)
    expect([...ranged.selectedPaths]).toEqual([entries[0].cardPath, entries[1].cardPath])
    const pruned = pruneTableSelection(new Set([entries[0].cardPath, entries[2].cardPath]), entries[2].cardPath, entries.slice(0, 2))
    expect([...pruned.selectedPaths]).toEqual([entries[0].cardPath])
    expect(pruned.lastSelectedPath).toBe('')
  })
})
