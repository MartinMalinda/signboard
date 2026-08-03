import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from '../components/DashboardView.vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'

function projectedCard(index: number, section: string, included = true, shaped = true, scored = true) {
  return {
    score_version: 1,
    normalized: {},
    metadata: { priority_class: 'P2', kind: 'task', present: shaped, valid: shaped },
    scores: { priority_index: scored ? 10 - index : null },
    eligibility: {},
    classes: { autonomy: 'A2' },
    sections: [{ name: section, included, reason_codes: [`SECTION_${section.toUpperCase()}`], tie_break_inputs: { priority_rank: index, score: 10 - index, status_rank: 0 } }],
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

  it('renders profile sections, caps each section at three projected cards, and opens the normal card path', async () => {
    const data = useBoardDataStore()
    data.snapshot = {
      ok: true,
      boardRoot: '/board',
      boardName: 'Board',
      boardSettings: null,
      lists: [],
      errors: [],
      v2: {
        profile: { enabled: true, title: 'Product', dashboard: { sections: ['critical', 'blocked', 'agent_loops'] } },
        cards: [projectedCard(1, 'critical'), projectedCard(2, 'critical'), projectedCard(3, 'critical'), projectedCard(4, 'critical'), projectedCard(5, 'blocked'), projectedCard(6, 'agent_loops', false, false), projectedCard(7, 'agent_loops', false, true, false)],
      },
    }
    const onOpen = vi.fn()
    const onViewAll = vi.fn()
    const wrapper = mount(DashboardView, { props: { onOpen, onViewAll } })

    expect(wrapper.findAll('[data-dashboard-section]')).toHaveLength(3)
    expect(wrapper.find('[data-dashboard-section="critical"]').findAll('.dashboard-card')).toHaveLength(3)
    expect(wrapper.find('[data-dashboard-section="blocked"]').find('.dashboard-card-title').text()).toBe('card-5')
    expect(wrapper.text()).toContain('5 scored · 2 unshaped')
    expect(wrapper.text()).toContain('Legacy or unshaped cards remain available')
    expect(wrapper.text()).toContain('Ready P2 work must pass the autonomous policy gates')
    await wrapper.find('[data-dashboard-section="critical"] .dashboard-card').trigger('click')
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
      v2: { profile: { enabled: true, dashboard: { sections: ['next_best_work'] } }, cards: [] },
    }
    const onViewAll = vi.fn()
    const wrapper = mount(DashboardView, { props: { onViewAll } })

    expect(wrapper.find('.dashboard-empty').text()).toContain('No cards')
    await wrapper.find('.dashboard-view-all').trigger('click')
    expect(onViewAll).toHaveBeenCalledWith('next_best_work')
  })
})
