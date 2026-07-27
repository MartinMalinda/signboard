import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import CardItem from '../components/board/CardItem.vue'

const card = {
  cardName: '001-hello.md',
  cardPath: '/board/001-To-do/001-hello.md',
  frontmatter: { title: 'Hello', labels: ['label-1'] },
  body: 'How are you?',
  taskSummary: { total: 0, completed: 0, remaining: 0 },
  taskStartDates: [],
  incompleteTaskStartDates: [],
  taskDueDates: [],
  incompleteTaskDueDates: [],
}

function dispatchPointerEvent(target: EventTarget, type: string, clientX: number, clientY: number, button = 0) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    button: { value: button },
  })
  target.dispatchEvent(event)
}

describe('CardItem click behavior', () => {
  beforeEach(() => {
    window.board = {
      updateFrontmatter: vi.fn().mockResolvedValue(undefined),
    } as unknown as typeof window.board
  })

  it('opens from the card surface while card-level archive and label controls stay hidden', async () => {
    const onOpen = vi.fn()
    const onArchive = vi.fn()
    const wrapper = mount(CardItem, {
      global: { plugins: [createPinia()] },
      props: { card, onOpen, onArchive },
    })

    await wrapper.find('.card-body').trigger('click')
    expect(onOpen).toHaveBeenCalledWith(card.cardPath)

    expect(wrapper.find('.card-archive-button').exists()).toBe(false)
    expect(wrapper.find('.card-label-button').exists()).toBe(false)

    wrapper.unmount()
  })

  it('does not open after a significant drag followed by the browser click', async () => {
    const onOpen = vi.fn()
    const wrapper = mount(CardItem, {
      global: { plugins: [createPinia()] },
      props: { card, labels: [], onOpen },
    })

    dispatchPointerEvent(wrapper.find('.card').element, 'pointerdown', 10, 10)
    dispatchPointerEvent(document, 'pointermove', 13, 14)
    dispatchPointerEvent(document, 'pointerup', 13, 14)
    await wrapper.find('.card').trigger('click')
    expect(onOpen).toHaveBeenCalledWith(card.cardPath)
    onOpen.mockClear()

    dispatchPointerEvent(wrapper.find('.card').element, 'pointerdown', 10, 10)
    dispatchPointerEvent(document, 'pointermove', 80, 10)
    dispatchPointerEvent(document, 'pointerup', 80, 10)
    await wrapper.find('.card').trigger('click')
    expect(onOpen).not.toHaveBeenCalled()

    await wrapper.find('.card-body').trigger('click')
    expect(onOpen).toHaveBeenCalledWith(card.cardPath)

    wrapper.unmount()
  })

  it('opens a card context menu and archives from its action', async () => {
    const onArchive = vi.fn()
    const onDuplicate = vi.fn()
    const wrapper = mount(CardItem, {
      global: { plugins: [createPinia()] },
      props: { card, labels: [], onArchive, onDuplicate },
    })

    await wrapper.find('.card-body').trigger('contextmenu', { clientX: 120, clientY: 180 })
    expect(document.body.querySelector('.card-context-menu')).toBeTruthy()
    expect(document.body.querySelector('.card-context-menu')?.textContent).toContain('Archive card')
    expect(document.body.querySelector('.card-context-menu')?.textContent).toContain('Duplicate card')

    const menuItems = document.body.querySelectorAll<HTMLButtonElement>('.card-context-menu [role="menuitem"]')
    await menuItems[0]?.click()
    expect(onDuplicate).toHaveBeenCalledWith(card.cardPath)
    expect(document.body.querySelector('.card-context-menu')).toBeNull()

    await wrapper.find('.card-body').trigger('contextmenu', { clientX: 120, clientY: 180 })
    const reopenedMenuItems = document.body.querySelectorAll<HTMLButtonElement>('.card-context-menu [role="menuitem"]')

    await reopenedMenuItems[1]?.click()
    expect(onArchive).toHaveBeenCalledWith(card.cardPath)
    expect(document.body.querySelector('.card-context-menu')).toBeNull()

    wrapper.unmount()
  })
})
