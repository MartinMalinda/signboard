import { describe, expect, it } from 'vitest'
import {
  compareDashboardCards,
  dashboardCardsForSection,
  dashboardSectionSortValues,
  formatDashboardReasonCodes,
} from '../../lib/dashboardSections'
import { createTableEntries } from '../../lib/tableView.js'

function card(cardName: string, section: string, score: number, included = true, priority = 2) {
  return {
    cardName,
    cardPath: `/board/${cardName}`,
    listName: 'Ready',
    metadata: { kind: 'task', priority_class: `P${priority}`, present: true, valid: true },
    normalized: { status: 'ready' },
    scores: { agent_pick_index: score, priority_index: score, impact_index: score },
    sections: [{ name: section, included, reason_codes: ['AGENT_POLICY_FAILED'], tie_break_inputs: { priority_rank: priority, score, status_rank: 0, id: cardName } }],
  } as any
}

describe('V2 dashboard section adapter', () => {
  it('keeps section results unbounded and orders Agent loops by agent_pick_index', () => {
    const cards = [
      card('lower-score.md', 'agent_loops', 10, true, 1),
      card('higher-score.md', 'agent_loops', 20, true, 3),
      card('excluded.md', 'agent_loops', 99, false, 1),
    ]

    expect(dashboardCardsForSection(cards, 'agent_loops')).toHaveLength(2)
    expect(dashboardCardsForSection(cards, 'agent_loops').sort((left, right) => compareDashboardCards(left, right, 'agent_loops')).map((item) => item.cardName)).toEqual(['higher-score.md', 'lower-score.md'])
    expect(dashboardSectionSortValues(cards[1]!, 'agent_loops').score).toBe(20)
  })

  it('uses the same Agent-loop sort values when projecting Table rows', () => {
    const entries = createTableEntries([{
      listName: 'Ready',
      listPath: '/board/Ready',
      cards: [{ cardName: 'higher-score.md', cardPath: '/board/higher-score.md', frontmatter: { title: 'Higher' }, body: '' }],
    }], () => false, [card('higher-score.md', 'agent_loops', 20)], 'agent_loops')

    expect(entries[0]).toMatchObject({ dashboardSectionScore: 20, dashboardSectionPriorityRank: 2 })
  })

  it('formats evaluator reason codes into shared human-readable copy', () => {
    expect(formatDashboardReasonCodes(['STATUS_BLOCKED', 'AGENT_POLICY_FAILED'])).toBe('The card is blocked. The agent execution policy is not satisfied.')
  })
})
