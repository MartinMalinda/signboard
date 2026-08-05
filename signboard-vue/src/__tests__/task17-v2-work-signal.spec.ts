import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardItem from '../components/board/CardItem.vue'
import V2SignalChip from '../components/board/V2SignalChip.vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'

const updateFrontmatter = vi.fn()

const baseCard = {
  cardName: '001-work.md',
  cardPath: '/board/001-To-do/001-work.md',
  frontmatter: { title: 'Work item' },
  body: 'Body',
  taskSummary: { total: 0, completed: 0, remaining: 0 },
  taskStartDates: [],
  incompleteTaskStartDates: [],
  taskDueDates: [],
  incompleteTaskDueDates: [],
}

const shapedCard = {
  ...baseCard,
  frontmatter: {
    ...baseCard.frontmatter,
    signboard_v2: {
      contract_version: 1,
      kind: 'task',
      work_type: 'product',
      priority_class: 'P2',
      estimate: { effort_points: 3 },
    },
  },
  v2: {
    score_version: 1,
    metadata: { present: true, valid: true, kind: 'task', work_type: 'product', priority_class: 'P2' },
    normalized: {},
    scores: { priority_index: 20 },
    eligibility: {},
    classes: { autonomy: 'A2', qa: null },
    sections: [{ name: 'low_hanging_fruit', included: true }],
    missing_fields: [],
    defaults_applied: {},
    warnings: [],
  },
}

describe('V2 Kanban work signals', () => {
  beforeEach(() => {
    updateFrontmatter.mockReset().mockImplementation(async (_path: string, partial: Record<string, unknown>) => ({
      ...shapedCard.frontmatter,
      ...partial,
    }))
    window.board = { updateFrontmatter } as unknown as typeof window.board
  })

  it('does not render empty V2 signals for legacy cards', () => {
    const wrapper = mount(CardItem, { global: { plugins: [createPinia()] }, props: { card: baseCard } })
    expect(wrapper.find('.card-v2-signals').exists()).toBe(false)
    wrapper.unmount()
  })

  it('keeps shaped-card signals hidden when the board profile is disabled', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: false } }, lists: [], errors: [], v2: { profile: { enabled: false }, cards: [] } }
    const wrapper = mount(CardItem, { global: { plugins: [pinia] }, props: { card: shapedCard } })
    expect(wrapper.find('.card-v2-signals').exists()).toBe(false)
    wrapper.unmount()
  })

  it('omits the default Task kind while rendering the other compact signals', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true }, cards: [] } }
    const wrapper = mount(CardItem, { global: { plugins: [pinia] }, props: { card: shapedCard } })

    expect(wrapper.find('.card-v2-signal-kind').exists()).toBe(false)
    expect(wrapper.find('.card-v2-signal-priority').text()).toBe('P2')
    expect(wrapper.find('.card-v2-signal-derived').text()).toBe('Quick win')

    expect(wrapper.find('.card-v2-work-details-button').exists()).toBe(false)
    expect(document.body.querySelector('#cardV2WorkDetailsPopover')).toBeNull()
    wrapper.unmount()
  })

  it('renders non-default kinds such as Epic', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true }, cards: [] } }
    const epicCard = {
      ...shapedCard,
      frontmatter: { ...shapedCard.frontmatter, signboard_v2: { ...shapedCard.frontmatter.signboard_v2, kind: 'epic' } },
      v2: { ...shapedCard.v2, metadata: { ...shapedCard.v2.metadata, kind: 'epic' } },
    }
    const wrapper = mount(CardItem, { global: { plugins: [pinia] }, props: { card: epicCard } })

    expect(wrapper.find('.card-v2-signal-kind').text()).toBe('Epic')
    wrapper.unmount()
  })

  it('does not turn the broad Impact dashboard section into a card badge', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true }, cards: [] } }
    const impactCard = {
      ...shapedCard,
      v2: { ...shapedCard.v2, sections: [{ name: 'impact', included: true }] },
    }
    const wrapper = mount(CardItem, { global: { plugins: [pinia] }, props: { card: impactCard } })
    expect(wrapper.findAllComponents(V2SignalChip).some((chip) => chip.props('label') === 'Impact')).toBe(false)
    expect(wrapper.find('.card-v2-signal-derived').exists()).toBe(false)
    wrapper.unmount()
  })
})
