import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CardMoveControls from '../components/editor/CardMoveControls.vue'

describe('CardMoveControls', () => {
  it('offers every stage in an explicit selector, including stages behind the current one', async () => {
    const onMove = vi.fn().mockResolvedValue(true)
    const wrapper = mount(CardMoveControls, {
      props: {
        cardPath: '/board/001-Doing/000-card.md',
        listPaths: ['/board/000-To-do', '/board/001-Doing', '/board/002-Done'],
        onMove,
      },
    })

    const select = wrapper.find<HTMLSelectElement>('#cardEditorV2StageSelect')
    expect(select.exists()).toBe(true)
    expect(wrapper.find('.card-editor-stage-select .v2-editor-field-label').exists()).toBe(false)
    expect(select.element.value).toBe('/board/001-Doing')
    expect(select.findAll('option')).toHaveLength(3)
    await select.setValue('/board/000-To-do')
    expect(onMove).toHaveBeenCalledWith('/board/000-To-do')
  })
})
