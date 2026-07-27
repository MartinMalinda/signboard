import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ListColumnHeader from '../components/board/ListColumnHeader.vue'
import type { BoardListSnapshot } from '../types'

const list = {
  listName: '000-To-do-stock',
  listPath: '/board/000-To-do-stock/',
  cards: [],
} as BoardListSnapshot

describe('ListColumnHeader', () => {
  it('opens the list-scoped add-card flow from the plus shortcut', async () => {
    const onAddCard = vi.fn()
    const wrapper = mount(ListColumnHeader, {
      props: { id: 'list-name-to-do', list, displayName: 'To-do', onAddCard },
      global: { plugins: [createPinia()] },
    })

    const button = wrapper.get('.list-add-card-button')
    expect(wrapper.find('.list-header-title .list-card-count').exists()).toBe(true)
    expect(wrapper.find('.list-header-actions .list-card-count').exists()).toBe(false)
    expect(wrapper.findAll('.list-header-actions > button').map((item) => item.classes())).toEqual([
      ['list-actions-button'],
      ['list-add-card-button'],
    ])
    expect(button.attributes('aria-label')).toBe('Add card to To-do')
    expect(button.attributes('title')).toBe('Add card to To-do')

    await button.trigger('click')
    expect(onAddCard).toHaveBeenCalledWith('/board/000-To-do-stock/')
  })

  it('preserves a title draft while the board snapshot updates', async () => {
    const wrapper = mount(ListColumnHeader, {
      props: { id: 'list-name-to-do', list, displayName: 'To-do' },
      global: { plugins: [createPinia()] },
    })

    const input = wrapper.get('input.list-name')
    await input.trigger('focus')
    await input.setValue('Renamed')
    await wrapper.setProps({ displayName: 'To-do' })

    expect((input.element as HTMLInputElement).value).toBe('Renamed')
  })
})
