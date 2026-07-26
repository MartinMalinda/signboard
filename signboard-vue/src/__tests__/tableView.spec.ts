import { describe, expect, it } from 'vitest'
import {
  createTableEntries,
  filterTableEntries,
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
    expect(filterTableEntries(entries, { query: 'alpha', listFilter: 'list:/board/000-To-do-stock/' }).map((entry) => entry.title)).toEqual(['Alpha'])
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
