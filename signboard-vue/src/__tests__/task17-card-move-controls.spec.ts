import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CardMoveControls from '../components/editor/CardMoveControls.vue'

describe('CardMoveControls', () => {
  it('keeps adjacent-list movement without rendering the list selector', async () => {
    const onMove = vi.fn().mockResolvedValue(true)
    const wrapper = mount(CardMoveControls, {
      props: {
        cardPath: '/board/000-To-do/000-card.md',
        listPaths: ['/board/000-To-do', '/board/001-Doing'],
        onMove,
      },
    })

    expect(wrapper.find('#cardEditorListSelect').exists()).toBe(false)
    await wrapper.find('#cardEditorMoveListLink').trigger('click')
    expect(onMove).toHaveBeenCalledWith('/board/001-Doing')
  })
})
