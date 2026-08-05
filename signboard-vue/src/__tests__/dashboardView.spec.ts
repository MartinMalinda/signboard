import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vTooltip } from 'floating-vue'
import DashboardView from '../components/DashboardView.vue'
import ImpactScorePopover from '../components/board/ImpactScorePopover.vue'
import Tooltip from '../lib/components/Tooltip.vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'

function projectedCard(index: number, section: string, included = true, shaped = true, scored = true, status = 'ready', risk_prevented: Record<string, unknown> = {}, score = 10 - index) {
  return {
    score_version: 1,
    normalized: { status, risk_prevented, credible_tail: risk_prevented.credible_tail === true },
    metadata: { priority_class: 'P2', kind: 'task', present: shaped, valid: shaped },
    scores: { priority_index: scored ? 10 - index : null, impact_index: scored ? score : null },
    explanations: { impact_index: null },
    eligibility: {},
    classes: { autonomy: 'A2' },
    sections: [{ name: section, included, reason_codes: [`SECTION_${section.toUpperCase()}`], tie_break_inputs: { priority_rank: index, score, status_rank: 0 } }],
    missing_fields: scored ? [] : ['estimate.effort_points'],
    defaults_applied: {},
    warnings: [],
    listName: '001-Ready',
    cardName: `card-${index}.md`,
    cardPath: `/board/001-Ready/card-${index}.md`,
  }
}

describe('DashboardView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders profile sections, caps each section at eight projected cards, and opens the normal card path', async () => {
    const data = useBoardDataStore()
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
      v2: {
        profile: { enabled: true, title: 'Product', dashboard: { sections: ['priority', 'blocked', 'agent_loops'] } },
        cards: [
          ...Array.from({ length: 9 }, (_, index) => projectedCard(index + 1, 'priority')),
          projectedCard(10, 'blocked'),
          projectedCard(11, 'agent_loops', false, false),
          projectedCard(12, 'agent_loops', false, true, false),
        ],
      },
    }
    const onOpen = vi.fn()
    const onViewAll = vi.fn()
    const wrapper = mount(DashboardView, { props: { onOpen, onViewAll }, global: { directives: { tooltip: vTooltip } } })

    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.findAll('[data-dashboard-section]')).toHaveLength(3)
    expect(wrapper.find('[data-dashboard-section="priority"]').findAll('.dashboard-card')).toHaveLength(8)
    expect(wrapper.find('[data-dashboard-section="blocked"]').find('.dashboard-card-title').text()).toBe('card-10')
    const whySignal = wrapper.find('[data-dashboard-section="priority"]').find('.dashboard-card-signal-why')
    expect(whySignal.attributes('title')).toBeUndefined()
    expect(whySignal.attributes('aria-label')).toContain('Ranked #1 in Priority')
    expect(wrapper.find('[data-dashboard-section="priority"]').find('.dashboard-card-signal-rank').text()).toBe('9')
    expect(wrapper.find('[data-dashboard-section="priority"] .dashboard-card').findAll('.dashboard-card-signal-priority')).toHaveLength(1)
    expect(wrapper.find('[data-dashboard-section="priority"] .dashboard-card').findAll('.dashboard-card-signal-kind')).toHaveLength(0)
    expect(wrapper.findComponent(Tooltip).props('popperClass')).toBe('dashboard-card-tooltip')
    expect(wrapper.find('.dashboard-summary-row .dashboard-summary').exists()).toBe(true)
    expect(wrapper.find('.dashboard-summary-row .dashboard-unshaped').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('V2 workspace')
    expect(wrapper.text()).not.toContain('Legacy or unshaped cards remain available')
    expect(wrapper.text()).not.toContain('Ready P2 work must pass the autonomous policy gates')
    await wrapper.find('[data-dashboard-section="priority"] .dashboard-card').trigger('click')
    expect(onOpen).toHaveBeenCalledWith('/board/001-Ready/card-1.md')
    await wrapper.find('.dashboard-unshaped-link').trigger('click')
    expect(onViewAll).toHaveBeenCalledWith('unshaped')
  })

  it('renders empty sections and keeps View all available for filtered Table navigation', async () => {
    const data = useBoardDataStore()
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
        v2: { profile: { enabled: true, dashboard: { sections: ['priority'] } }, cards: [] },
    }
    const onViewAll = vi.fn()
    const wrapper = mount(DashboardView, { props: { onViewAll } })

    expect(wrapper.find('.dashboard-empty').text()).toBe('No cards match.')
    await wrapper.find('.dashboard-view-all').trigger('click')
    expect(onViewAll).toHaveBeenCalledWith('priority')
  })

  it('shows risk markers in Priority, while Impact remains a broad value-sorted view', () => {
    const data = useBoardDataStore()
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
      v2: {
        profile: { enabled: true, dashboard: { sections: ['priority', 'impact'] } },
        cards: [
          projectedCard(1, 'priority', true, true, true, 'ready', { likelihood: 5, harm: 5, blast_radius: 4, credible_tail: true }),
          projectedCard(2, 'impact', false, true, true, 'blocked', { likelihood: 5, harm: 5, blast_radius: 5, credible_tail: true }),
        ],
      },
    }
    const wrapper = mount(DashboardView)
    const priorityCard = wrapper.find('[data-dashboard-section="priority"] .dashboard-card')
    const impactCard = wrapper.find('[data-dashboard-section="impact"] .dashboard-card')

    expect(priorityCard.text()).toContain('High Risk')
    expect(priorityCard.text()).toContain('High Damage')
    expect(priorityCard.text()).toContain('Wide Impact')
    expect(priorityCard.text()).toContain('Tail Risk')
    expect(impactCard.exists()).toBe(true)
    expect(impactCard.find('.dashboard-card-signal-why').exists()).toBe(false)
    expect(impactCard.find('.dashboard-card-signal-rank').text()).toBe('9.0')
    expect(impactCard.text()).not.toContain('High Risk')
    expect(impactCard.text()).not.toContain('High Damage')
  })

  it('opens the Impact score breakdown popover', async () => {
    const data = useBoardDataStore()
    const card = projectedCard(1, 'impact', true, true, true, 'ready', {}, 36.7) as any
    card.metadata.priority_class = 'P0'
    card.normalized = {
      ...card.normalized,
      modifiers: { confidence: 4, strategic_fit: 4 },
      estimate: { effort_points: 5 },
    }
    card.scores = { ...card.scores, positive_impact: 51.2, impact_index: 51.2 * 0.9 / Math.pow(5, 0.20) }
    card.explanations = {
      impact_index: {
        positive_impact: 51.2,
        confidence_multiplier: 0.9,
        strategic_multiplier: 1,
        effort_points: 5,
        effort_factor: Math.pow(5, 0.20),
        result: 51.2 * 0.9 / Math.pow(5, 0.20),
      },
    }
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
      v2: {
        profile: { enabled: true, dashboard: { sections: ['impact'] } },
        cards: [card],
      },
    }

    const wrapper = mount(DashboardView, { attachTo: document.body })
    const breakdown = wrapper.findComponent(ImpactScorePopover)
    expect(breakdown.exists()).toBe(true)
    expect(breakdown.find('.dashboard-card-signal-rank').text()).toBe('33.4')
    expect(breakdown.find('.impact-score-trigger').attributes('aria-label')).toBe('Impact score 33.4, show score breakdown')
    await breakdown.find('.impact-score-trigger').trigger('click')

    const popovers = document.querySelectorAll('.impact-score-popover')
    const popover = popovers[popovers.length - 1]
    expect(popover?.querySelector('.impact-score-breakdown-header strong')?.textContent).toBe('33.4')
    expect(popover?.textContent).toContain('Positive value')
    expect(popover?.textContent).toContain('Opportunity0.0')
    expect(popover?.textContent).toContain('Engineering health0.0')
    expect(popover?.textContent).toContain('51.2')
    expect(popover?.textContent).toContain('Confidence×0.90')
    expect(popover?.textContent).toContain('Strategic fit×1.00')
    expect(popover?.textContent).toContain('Effort factor÷1.38')
    wrapper.unmount()
  })

  it('keeps Priority populated with non-terminal work when strict eligibility has no matches', () => {
    const data = useBoardDataStore()
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
      v2: {
        profile: { enabled: true, dashboard: { sections: ['priority'] } },
        cards: [
          projectedCard(1, 'priority', false, true, true, 'inbox'),
          projectedCard(4, 'priority', false, true, true, 'shaping'),
          projectedCard(2, 'priority', false, true, true, 'blocked'),
          projectedCard(3, 'priority', false, true, true, 'done'),
        ],
      },
    }
    const wrapper = mount(DashboardView)

    expect(wrapper.find('[data-dashboard-section="priority"]').findAll('.dashboard-card')).toHaveLength(2)
    expect(wrapper.find('.dashboard-card-title').text()).toBe('card-1')
  })

  it('uses stage colors without an icon for Priority stage signals', () => {
    const data = useBoardDataStore()
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
      v2: {
        profile: { enabled: true, dashboard: { sections: ['priority'] } },
        cards: [
          projectedCard(1, 'priority', true, true, true, 'active'),
          projectedCard(2, 'priority', true, true, true, 'review'),
        ],
      },
    }
    const wrapper = mount(DashboardView)
    const signals = wrapper.findAll('[data-dashboard-section="priority"] .dashboard-card-signal-why')

    expect(signals).toHaveLength(2)
    expect(signals[0]!.classes()).toContain('dashboard-card-signal-stage-active')
    expect(signals[0]!.text()).toContain('Active')
    expect(signals[0]!.find('.feather-icon').exists()).toBe(false)
    expect(signals[1]!.classes()).toContain('dashboard-card-signal-stage-review')
    expect(signals[1]!.text()).toContain('Review')
    expect(signals[1]!.find('.feather-icon').exists()).toBe(false)
  })
})
