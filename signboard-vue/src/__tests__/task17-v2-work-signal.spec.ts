import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CardItem from '../components/board/CardItem.vue'
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

  it('renders compact signals and edits namespaced metadata from the popover', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true }, cards: [] } }
    const onOpen = vi.fn()
    const wrapper = mount(CardItem, { global: { plugins: [pinia] }, props: { card: shapedCard, onOpen } })

    expect(wrapper.find('.card-v2-signal-kind').text()).toBe('Task')
    expect(wrapper.find('.card-v2-signal-priority').text()).toBe('P2')
    expect(wrapper.find('.card-v2-signal-derived').text()).toBe('Quick win')

    await wrapper.find('.card-v2-work-details-button').trigger('click')
    const popover = document.body.querySelector<HTMLElement>('#cardV2WorkDetailsPopover')
    expect(popover?.getAttribute('aria-hidden')).toBe('false')
    expect(popover?.textContent).toContain('Work details')

    const selects = Array.from(popover?.querySelectorAll('select') || []) as HTMLSelectElement[]
    const prioritySelect = selects[2]
    expect(prioritySelect).toBeDefined()
    if (!prioritySelect) throw new Error('Priority selector was not rendered.')
    prioritySelect.value = 'P1'
    prioritySelect.dispatchEvent(new Event('change', { bubbles: true }))
    await vi.waitFor(() => expect(updateFrontmatter).toHaveBeenCalledWith(shapedCard.cardPath, {
      signboard_v2: expect.objectContaining({ priority_class: 'P1', contract_version: 1 }),
    }))

    const editorLink = Array.from(popover?.querySelectorAll('button') || []).find((button) => button.textContent?.includes('More in editor'))
    editorLink?.click()
    expect(onOpen).toHaveBeenCalledWith(shapedCard.cardPath)
    wrapper.unmount()
  })
})
