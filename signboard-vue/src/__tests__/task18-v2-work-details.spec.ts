import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import V2WorkDetails from '../components/editor/V2WorkDetails.vue'
import V2WorkControls from '../components/editor/V2WorkControls.vue'
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
  it('keeps the summary visible and details collapsed by default', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const editor = useEditorStore()
    editor.cardPath = '/board/To-do/card.md'
    editor.frontmatter = { title: 'Shape this', signboard_v2: { contract_version: 1, kind: 'task', work_type: 'product', priority_class: 'P2' } }
    editor.isOpen = true
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true, cardDefaults: { kind: 'task', workType: 'product', priorityClass: 'P2' } }, cards: [] } }

    const wrapper = mount(V2WorkDetails, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do', '/board/Doing'], onMove: vi.fn(async () => true) } })
    expect(wrapper.find('#cardEditorWorkDetailsSummary').exists()).toBe(true)
    expect(wrapper.find('#cardEditorWorkDetailsPanel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('keeps numeric work details visible and links to the computed section', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const editor = useEditorStore()
    editor.cardPath = '/board/To-do/card.md'
    editor.frontmatter = { title: 'Shape this', signboard_v2: { contract_version: 1, kind: 'task', work_type: 'product', priority_class: 'P2', estimate: { effort_points: 3 } } }
    editor.isOpen = true
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [{ listName: 'To-do', listPath: '/board/To-do', cards: [{ cardName: 'card.md', cardPath: editor.cardPath, frontmatter: { title: 'Shape this' }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] }, { cardName: 'related.md', cardPath: '/board/To-do/related.md', frontmatter: { title: 'Related task' }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] }] }], errors: [], v2: { profile: { enabled: true, cardDefaults: { kind: 'task', workType: 'product', priorityClass: 'P2' } }, cards: [{ cardPath: editor.cardPath, cardName: 'card.md', listName: 'To-do', ...({ sections: [{ name: 'low_hanging_fruit', included: true }], eligibility: { reason_codes: ['SECTION_LOW_HANGING_FRUIT'] } } as any) }] } }
    const onOpenDashboard = vi.fn()
    const wrapper = mount(V2WorkDetails, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do', '/board/Doing'], onMove: vi.fn(async () => true), onOpenDashboard } })

    await wrapper.find('#cardEditorWorkDetailsSummary').trigger('click')
    expect(wrapper.find('#cardEditorWorkDetailsPanel').exists()).toBe(true)
    expect(wrapper.find('.card-editor-dates-control').exists()).toBe(false)
    expect((wrapper.find('.v2-editor-estimate-field input').element as HTMLInputElement).value).toBe('3')
    expect(wrapper.find('.v2-editor-stage-row').exists()).toBe(false)
    expect(wrapper.findAll('.v2-related-task-select')).toHaveLength(2)
    await wrapper.find('.v2-related-task-input').setValue('Related')
    await wrapper.find('.v2-related-task-option').trigger('click')
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).depends_on).toEqual(['Related task'])
    expect(wrapper.find('.v2-editor-computed').text()).toContain('Quick win')
    expect(wrapper.find('.v2-editor-advanced-grid').exists()).toBe(true)

    const controls = mount(V2WorkControls, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do', '/board/Doing'], onMove: vi.fn(async () => true) } })
    await controls.find('.v2-editor-toolbar-select').setValue('discovery')
    expect((editor.frontmatter.signboard_v2 as Record<string, unknown>).kind).toBe('discovery')
    expect(controls.find('#cardEditorV2StageSelect').exists()).toBe(true)
    expect(controls.findAll('.v2-editor-toolbar-select')).toHaveLength(3)
    expect(wrapper.findAll('.v2-editor-score-group')).toHaveLength(5)
    expect(wrapper.findAll('.v2-editor-score-group legend').map((legend) => legend.text())).toEqual(['Opportunity', 'Risk prevented', 'Delivery', 'Modifiers', 'Execution'])
    await wrapper.find('.v2-editor-dashboard-link').trigger('click')
    expect(onOpenDashboard).toHaveBeenCalledWith('low_hanging_fruit')
    await editor.flush()
    expect(writeCard).toHaveBeenCalled()
    controls.unmount()
    wrapper.unmount()
  })

  it('keeps malformed execution policy values visible until explicitly replaced', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const editor = useEditorStore()
    editor.cardPath = '/board/To-do/card.md'
    editor.frontmatter = { title: 'Malformed policy', signboard_v2: { contract_version: 1, kind: 'task', work_type: 'product', priority_class: 'P2', execution: { ceiling: 'not-a-ceiling', background_selection: 'false' } } }
    editor.isOpen = true
    const data = useBoardDataStore()
    data.snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { v2: { enabled: true } }, lists: [], errors: [], v2: { profile: { enabled: true, cardDefaults: { kind: 'task', workType: 'product', priorityClass: 'P2' } }, cards: [] } }

    const wrapper = mount(V2WorkDetails, { global: { plugins: [pinia] }, props: { listPaths: ['/board/To-do'], onMove: vi.fn(async () => true) } })
    await wrapper.find('#cardEditorWorkDetailsSummary').trigger('click')
    const ceiling = wrapper.find('#cardEditorExecutionCeiling').element as HTMLSelectElement
    expect(ceiling.value).toBe('not-a-ceiling')
    expect(wrapper.find('#cardEditorExecutionCeiling option').text()).toContain('Invalid value (preserved)')
    wrapper.unmount()
  })
})
