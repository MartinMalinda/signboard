import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import V2WorkDetails from '../components/editor/V2WorkDetails.vue'
import V2WorkControls from '../components/editor/V2WorkControls.vue'
import V2ScoreSummary from '../components/editor/V2ScoreSummary.vue'
import Tooltip from '../lib/components/Tooltip.vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import { useEditorStore } from '../stores/useEditorStore'

const writeCard = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  setActivePinia(createPinia())
  writeCard.mockReset().mockResolvedValue(undefined)
  window.board = {
    normalizeFrontmatter: async (frontmatter: Record<string, unknown>) => frontmatter,
    writeCard,
    moveCardToTop: vi.fn().mockResolvedValue({ cardPath: '/board/Doing/card.md' }),
  } as unknown as typeof window.board
})

describe('V2 editor Work details', () => {
  it('renders the detailed fields without the duplicate summary block', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const editor = useEditorStore()
    editor.cardPath = '/board/To-do/card.md'
    editor.frontmatter = { title: 'Shape this', signboard_v2: { contract_version: 1, kind: 'task', priority_class: 'P2' } }
    editor.isOpen = true
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true, cardDefaults: { kind: 'task', priorityClass: 'P2' } }, cards: [] } }

    const wrapper = mount(V2WorkDetails, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do', '/board/Doing'], onMove: vi.fn(async () => true) } })
    expect(wrapper.find('#cardEditorWorkDetailsSummary').exists()).toBe(false)
    expect(wrapper.find('#cardEditorWorkDetailsPanel').exists()).toBe(true)
    wrapper.unmount()
  })

  it('keeps numeric work details separate from the score summary', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const editor = useEditorStore()
    editor.cardPath = '/board/To-do/card.md'
    editor.frontmatter = { title: 'Shape this', signboard_v2: { contract_version: 1, kind: 'task', priority_class: 'P2', estimate: { effort_points: 3 }, modifiers: { maintenance_delta: 1 } } }
    editor.isOpen = true
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [{ listName: 'To-do', listPath: '/board/To-do', cards: [{ cardName: 'card.md', cardPath: editor.cardPath, frontmatter: { title: 'Shape this' }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] }, { cardName: 'related.md', cardPath: '/board/To-do/related.md', frontmatter: { title: 'Related task' }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] }] }], errors: [], v2: { profile: { enabled: true, cardDefaults: { kind: 'task', priorityClass: 'P2' } }, cards: [{ cardPath: editor.cardPath, cardName: 'card.md', listName: 'To-do', ...({ sections: [{ name: 'low_hanging_fruit', included: true }] } as any) }] } }
    const projection = data.snapshot.v2?.cards[0]
    if (projection) {
      projection.scores = { priority_index: 42.4, impact_index: 36.7, risk_reduction_index: 0, risk_reduction: 0 }
      projection.score_ranges = { priority_index: { min: 0, max: 200.1 }, impact_index: { min: 0, max: 120 }, risk_reduction_index: { min: 0, max: 145 } }
    }
    data.snapshot.v2?.cards.push(
      ...[
        { priority_index: 10, impact_index: 10, risk_reduction_index: 5 },
        { priority_index: 20, impact_index: 20, risk_reduction_index: 10 },
        { priority_index: 30, impact_index: 30, risk_reduction_index: 20 },
        { priority_index: 40, impact_index: 40, risk_reduction_index: 30 },
      ].map((scores, index) => ({ cardPath: `/board/To-do/peer-${index}.md`, cardName: `peer-${index}.md`, listName: 'To-do', scores } as any)),
    )
    const wrapper = mount(V2WorkDetails, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do', '/board/Doing'], onMove: vi.fn(async () => true) } })

    expect(wrapper.find('#cardEditorWorkDetailsPanel').exists()).toBe(true)
    expect(wrapper.find('.card-editor-dates-control').exists()).toBe(false)
    expect(wrapper.findAll('.v2-editor-relationship-grid > *')).toHaveLength(4)
    expect(wrapper.findAll('.v2-editor-estimate-field .v2-editor-score-option').map((option) => option.text())).toEqual(['1', '2', '3', '4', '5'])
    expect(wrapper.find('.v2-editor-estimate-field .v2-editor-score-option.is-selected').text()).toBe('3')
    await wrapper.find('.v2-editor-estimate-field .v2-editor-score-option:nth-child(4)').trigger('click')
    expect((editor.frontmatter.signboard_v2 as Record<string, any>).estimate.effort_points).toBe(4)
    await wrapper.find('.v2-editor-estimate-field .v2-editor-score-option:nth-child(4)').trigger('click')
    expect((editor.frontmatter.signboard_v2 as Record<string, any>).estimate).toBeUndefined()
    editor.frontmatter = { ...editor.frontmatter, signboard_v2: { ...(editor.frontmatter.signboard_v2 as Record<string, unknown>), estimate: { effort_points: 3 } } }
    expect(wrapper.find('.v2-editor-stage-row').exists()).toBe(false)
    expect(wrapper.findAll('.v2-related-task-select')).toHaveLength(2)
    expect(wrapper.find('#cardEditorBlockedOnDecision').exists()).toBe(true)
    await wrapper.find('#cardEditorBlockedOnDecision').setValue(true)
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).blocked_on_decision).toBe(true)
    await wrapper.find('#cardEditorBlockedOnDecision').setValue(false)
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).blocked_on_decision).toBe(false)
    await wrapper.find('.v2-related-task-input').setValue('Related')
    await wrapper.find('.v2-related-task-option').trigger('click')
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).depends_on).toEqual(['Related task'])
    expect(wrapper.findAll('.v2-editor-ranking-score')).toHaveLength(0)
    expect(wrapper.find('.v2-editor-advanced-grid > fieldset.v2-editor-computed').exists()).toBe(false)
    const onOpenDetails = vi.fn()
    const scoreSummary = mount(V2ScoreSummary, { global: { plugins: [pinia] }, props: { onOpenDetails } })
    expect(scoreSummary.findAll('.v2-editor-ranking-score').map((score) => score.text())).toEqual([
      'Priority100%',
      'Impact75%',
      'Risk reduction0.0%',
      'Effort3 pts',
    ])
    await scoreSummary.find('.v2-editor-score-summary').trigger('click')
    expect(onOpenDetails).toHaveBeenCalledOnce()
    expect(scoreSummary.find('.v2-editor-ranking-score').attributes('title')).toContain('100th percentile among 5 scored cards on this board')
    expect(scoreSummary.find('.v2-editor-ranking-score').attributes('title')).toContain('Raw index 42.4 on a 0.0–200.1 range (21.2% of the theoretical range)')
    expect(scoreSummary.findAll('.v2-editor-ranking-score')[2]?.attributes('title')).toContain('0.0% on its absolute 0–100 scale')
    expect(scoreSummary.findAll('.v2-editor-ranking-score.is-positive')).toHaveLength(2)
    expect(scoreSummary.findAll('.v2-editor-ranking-score.is-neutral')).toHaveLength(2)
    expect(scoreSummary.findAll('.v2-editor-ranking-score.is-negative')).toHaveLength(0)
    expect(wrapper.findAll('.v2-editor-secondary-score')).toHaveLength(0)
    expect(wrapper.find('.v2-editor-advanced-grid').exists()).toBe(true)
    expect(wrapper.findAll('[data-v2-field-info]')).toHaveLength(0)
    expect(wrapper.findAllComponents(Tooltip).every((tooltip) => tooltip.props('popperClass') === 'v2-editor-tooltip')).toBe(true)
    expect(wrapper.find('[data-v2-score-field="reach"]').findAll('.v2-editor-score-option').map((option) => option.text())).toEqual(['1', '2', '3', '4', '5'])
    expect(wrapper.find('[data-v2-score-field="maintenance_delta"]').findAll('.v2-editor-score-option').map((option) => option.text())).toEqual(['-2', '-1', '0', '+1', '+2'])
    await wrapper.find('[data-v2-score-field="reach"] .v2-editor-score-option:nth-child(4)').trigger('click')
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).opportunity).toEqual({ reach: 4 })
    await wrapper.find('[data-v2-score-field="reach"] .v2-editor-score-option:nth-child(4)').trigger('click')
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).opportunity).toEqual({})
    expect(wrapper.find('[data-v2-score-field="reach"] .v2-editor-field-name').attributes('tabindex')).toBe('0')
    expect(wrapper.find('[data-v2-score-field="reach"]').findComponent(Tooltip).props('content')).toContain('target population')
    expect(wrapper.find('[data-v2-score-field="maintenance_delta"]').findComponent(Tooltip).props('content')).toContain('−2 adds substantial maintenance')
    expect(wrapper.find('[data-v2-score-field="maintenance_delta"] .v2-editor-score-option.is-selected').classes()).toContain('score-option-tone-success-soft')

    const controls = mount(V2WorkControls, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do', '/board/Doing'], onMove: vi.fn(async () => true) } })
    await controls.find('.v2-editor-toolbar-select').setValue('discovery')
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).kind).toBe('discovery')
    expect(controls.find('#cardEditorV2StageSelect').exists()).toBe(true)
    expect(controls.findAll('.v2-editor-toolbar-select')).toHaveLength(2)
    expect(wrapper.findAll('.v2-editor-score-group')).toHaveLength(4)
    expect(wrapper.findAll('.v2-editor-score-group legend').map((legend) => legend.text())).toEqual(['Opportunity', 'Risk addressed', 'Change risk', 'Modifiers'])
    expect(wrapper.find('[data-v2-score-field="mitigation_effectiveness"]').exists()).toBe(false)
    expect(wrapper.find('[data-v2-score-field="uncertainty_reduction"]').exists()).toBe(false)
    expect(wrapper.find('[data-v2-score-field="decision_importance"]').exists()).toBe(false)
    expect(wrapper.find('[data-v2-score-field="cost_of_wrong_choice"]').exists()).toBe(false)
    expect(wrapper.find('#cardEditorExecutionCeiling').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Agent')
    await editor.flush()
    expect(writeCard).toHaveBeenCalled()
    controls.unmount()
    scoreSummary.unmount()
    wrapper.unmount()
  })

})
