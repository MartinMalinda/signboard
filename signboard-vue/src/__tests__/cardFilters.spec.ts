import { describe, expect, it } from 'vitest'
import { DATE_FILTERS, cardMatchesFilters, matchesDateFilter } from '../../lib/cardFilters.js'

const today = '2026-07-25'
function card(overrides: Record<string, unknown> = {}) {
  return { frontmatter: { title: 'Launch planning', start: '', due: '', labels: ['work'] }, body: 'Prepare launch notes', incompleteTaskStartDates: [], incompleteTaskDueDates: [], taskItems: [], ...overrides }
}

describe('cardFilters', () => {
  it('uses only incomplete task markers for date filters', () => {
    const completedOnly = card({ taskItems: [{ isCompleted: true, due: today }], taskDueDates: [today] })
    const mixed = card({ taskItems: [{ isCompleted: true, due: today }, { isCompleted: false, due: today }], incompleteTaskDueDates: [today] })
    expect(matchesDateFilter(completedOnly, DATE_FILTERS.today, { today })).toBe(false)
    expect(matchesDateFilter(mixed, DATE_FILTERS.today, { today })).toBe(true)
  })

  it('excludes completed workflow lists only when a date filter is active', () => {
    const dated = card({ frontmatter: { title: 'Done work', due: today, labels: ['work'] } })
    expect(cardMatchesFilters(dated, { dateFilter: DATE_FILTERS.today, isCompletedList: true, today })).toBe(false)
    expect(cardMatchesFilters(dated, { selectedLabelIds: ['work'], isCompletedList: true, today })).toBe(true)
    expect(cardMatchesFilters(dated, { dateFilter: DATE_FILTERS.today, listName: '002-Done-stock', workflowSettings: { autoDetectCompletedLists: true }, today })).toBe(false)
  })

  it('combines label OR with date predicates without global text search', () => {
    const matching = card({ frontmatter: { title: 'Launch planning', due: today, labels: ['work', 'urgent'] } })
    const wrongLabel = card({ frontmatter: { title: 'Launch planning', due: today, labels: ['home'] } })
    const options = { selectedLabelIds: ['urgent', 'work'], dateFilter: DATE_FILTERS.today, today }
    expect(cardMatchesFilters(matching, options)).toBe(true)
    expect(cardMatchesFilters(wrongLabel, options)).toBe(false)
    expect(cardMatchesFilters(card({ frontmatter: { title: 'Budget', due: today, labels: ['work'] }, body: 'Unrelated content' }), { ...options, query: 'launch notes' })).toBe(true)
  })

  it('matches card start dates and next-day windows', () => {
    const startsTomorrow = card({ frontmatter: { title: 'Tomorrow', start: '2026-07-26' } })
    expect(cardMatchesFilters(startsTomorrow, { dateFilter: DATE_FILTERS.next7, today })).toBe(true)
    expect(cardMatchesFilters(startsTomorrow, { dateFilter: DATE_FILTERS.overdue, today })).toBe(false)
  })
})
