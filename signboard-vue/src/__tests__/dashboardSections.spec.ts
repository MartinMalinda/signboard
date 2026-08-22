import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_SECTION_IDS,
  dashboardCardsForSection,
  formatDashboardReasonCodes,
} from '../../lib/dashboardSections'

function card(cardName: string, section: string, score: number, included = true, priority = 2) {
  return {
    cardName,
    cardPath: `/board/${cardName}`,
    listName: 'Ready',
    metadata: { kind: 'task', priority_class: `P${priority}`, present: true, valid: true },
    normalized: { status: 'ready' },
    scores: { priority_index: score, impact_index: score },
    sections: [{ name: section, included, reason_codes: [], tie_break_inputs: { priority_rank: priority, score, status_rank: 0, id: cardName } }],
  } as any
}

describe('V2 dashboard section adapter', () => {
  it('does not expose the removed agent-loops section', () => {
    expect(DASHBOARD_SECTION_IDS).not.toContain('agent_loops')
    expect(formatDashboardReasonCodes(['STATUS_BLOCKED'])).toBe('The card is blocked.')
  })

  it('keeps Review cards out of Impact', () => {
    const reviewCard = {
      ...card('review.md', 'impact', 50),
      normalized: { status: 'review' },
      stageSemantics: { stage: 'review', mapped: true, ambiguous: false, terminal: false },
    }
    const shapingCard = {
      ...card('shaping.md', 'impact', 40),
      normalized: { status: 'shaping' },
      stageSemantics: { stage: 'shaping', mapped: true, ambiguous: false, terminal: false },
    }

    expect(dashboardCardsForSection([reviewCard, shapingCard], 'impact').map((item) => item.cardName)).toEqual(['shaping.md'])
  })

})
