import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPopover from '../lib/components/AppPopover.vue'
import CardEditorActions from '../components/editor/CardEditorActions.vue'
import { getOpenAccessibleModals, setBackgroundInert } from '../../lib/accessibility.js'
import { createShortcutHandler } from '../composables/useShortcuts'
import { isKeyboardNavigationKey } from '../composables/useAccessibility'

describe('Task 12 accessibility and shortcut parity', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'Linux x86_64' })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps modal background inert state and topmost modal discovery reversible', () => {
    document.body.innerHTML = '<main id="background"><button>Board</button></main><div id="modal" role="dialog" aria-hidden="false" style="display:flex"><button>Close</button></div>'
    const modal = document.getElementById('modal') as HTMLElement
    const background = document.getElementById('background') as HTMLElement

    setBackgroundInert(modal)
    expect(background.inert).toBe(true)
    expect(getOpenAccessibleModals()).toEqual([modal])

    modal.setAttribute('aria-hidden', 'true')
    modal.hidden = true
    setBackgroundInert(null)
    expect(background.inert).toBe(false)
    expect(getOpenAccessibleModals()).toEqual([])
  })

  it('marks keyboard modality only for navigation keys', () => {
    expect(isKeyboardNavigationKey('Tab')).toBe(true)
    expect(isKeyboardNavigationKey('ArrowRight')).toBe(true)
    expect(isKeyboardNavigationKey('a')).toBe(false)
  })

  it('matches OS-aware workspace shortcuts and preserves editor-scoped actions', () => {
    const actions = { quickAdd: vi.fn(), addList: vi.fn(), table: vi.fn(), switcher: vi.fn(), moveLeft: vi.fn(), archive: vi.fn() }
    const handler = createShortcutHandler({
      onQuickAdd: actions.quickAdd,
      onAddList: actions.addList,
      onBoardSwitcher: actions.switcher,
      onView: (view) => { if (view === 'table') actions.table() },
      onMoveCardLeft: actions.moveLeft,
      onArchiveCard: actions.archive,
    })

    handler(new KeyboardEvent('keydown', { key: 'n', code: 'KeyN', ctrlKey: true }))
    handler(new KeyboardEvent('keydown', { key: 'n', code: 'KeyN', metaKey: true }))
    handler(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', ctrlKey: true, altKey: true }))
    expect(actions.quickAdd).toHaveBeenCalledTimes(1)
    expect(actions.table).toHaveBeenCalledTimes(1)

    const editor = document.createElement('div')
    editor.id = 'modalEditCard'
    const notes = document.createElement('textarea')
    editor.append(notes)
    document.body.append(editor)
    const moveEvent = new KeyboardEvent('keydown', { key: '[', code: 'BracketLeft', ctrlKey: true, shiftKey: true, bubbles: true })
    Object.defineProperty(moveEvent, 'target', { configurable: true, value: notes })
    handler(moveEvent)
    expect(actions.moveLeft).toHaveBeenCalledTimes(1)

    const switcherEvent = new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true })
    Object.defineProperty(switcherEvent, 'target', { configurable: true, value: notes })
    handler(switcherEvent)
    expect(actions.switcher).toHaveBeenCalledTimes(1)
  })

  it('supports popover arrow/Home/End navigation and opener restoration', async () => {
    const opener = document.createElement('button')
    opener.id = 'opener'
    document.body.append(opener)
    opener.focus()
    const onClose = vi.fn()
    const wrapper = mount(AppPopover, {
      attachTo: document.body,
      props: { isOpen: true, opener, onClose, id: 'testPopover' },
      slots: { default: '<button>One</button><button>Two</button><button>Three</button>' },
    })
    await wrapper.vm.$nextTick()
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('#testPopover button')]
    buttons[0]?.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(buttons[1])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(document.activeElement).toBe(buttons[2])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onClose).toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.activeElement).toBe(opener)
    wrapper.unmount()
  })

  it('keeps card archive and copy actions behind the editor overflow menu', async () => {
    const onArchive = vi.fn()
    const onCopy = vi.fn()
    const wrapper = mount(CardEditorActions, {
      attachTo: document.body,
      props: { onArchive, onCopy },
    })

    expect(wrapper.find('#cardEditorActionsMenuButton').exists()).toBe(true)
    expect(document.querySelector('#cardEditorActionsPopover')?.hasAttribute('hidden')).toBe(true)
    await wrapper.find('#cardEditorActionsMenuButton').trigger('click')
    await wrapper.vm.$nextTick()

    const menu = document.querySelector('#cardEditorActionsPopover')
    expect(menu).not.toBeNull()
    expect(menu?.textContent).toContain('Copy')
    expect(menu?.textContent).toContain('Archive')
    expect(document.querySelector('#cardEditorDupeLink')).toBeNull()
    ;(document.querySelector('#cardEditorCopyMarkdown') as HTMLButtonElement).click()
    expect(onCopy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('repositions an open teleported popover after captured scroll and resize', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    let rect = { right: 220, bottom: 120 }
    vi.spyOn(opener, 'getBoundingClientRect').mockImplementation(() => ({
      ...rect,
      left: rect.right - 40,
      top: rect.bottom - 24,
      width: 40,
      height: 24,
    }) as DOMRect)

    const wrapper = mount(AppPopover, {
      attachTo: document.body,
      props: { isOpen: true, opener, onClose: vi.fn(), id: 'geometryPopover' },
      slots: { default: '<div>Popover content</div>' },
    })
    await wrapper.vm.$nextTick()

    const popover = document.querySelector('#geometryPopover') as HTMLElement
    Object.defineProperties(popover, {
      offsetWidth: { configurable: true, value: 200 },
      offsetHeight: { configurable: true, value: 100 },
    })
    const scrollSource = document.createElement('div')
    document.body.append(scrollSource)

    scrollSource.dispatchEvent(new Event('scroll'))
    expect(popover.style.left).toBe('20px')
    expect(popover.style.top).toBe('126px')

    rect = { right: 420, bottom: 220 }
    window.dispatchEvent(new Event('resize'))
    expect(popover.style.left).toBe('220px')
    expect(popover.style.top).toBe('226px')

    wrapper.unmount()
  })

  it('waits for a usable opener rectangle instead of showing at the viewport origin', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    let ready = false
    vi.spyOn(opener, 'getBoundingClientRect').mockImplementation(() => ready
      ? ({ left: 180, top: 100, right: 220, bottom: 120, width: 40, height: 20 } as DOMRect)
      : ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect))

    const wrapper = mount(AppPopover, {
      attachTo: document.body,
      props: { isOpen: true, opener, onClose: vi.fn(), id: 'delayedGeometryPopover' },
      slots: { default: '<div>Popover content</div>' },
    })
    await wrapper.vm.$nextTick()

    const popover = document.querySelector('#delayedGeometryPopover') as HTMLElement
    Object.defineProperties(popover, {
      offsetWidth: { configurable: true, value: 200 },
      offsetHeight: { configurable: true, value: 100 },
    })
    expect(popover.style.visibility).toBe('hidden')
    ready = true
    await new Promise((resolve) => setTimeout(resolve, 40))

    expect(popover.style.left).toBe('20px')
    expect(popover.style.top).toBe('126px')
    expect(popover.style.visibility).toBe('visible')
    wrapper.unmount()
  })

  it('removes viewport positioning listeners when the popover unmounts', async () => {
    const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
    const removeWindowListener = vi.spyOn(window, 'removeEventListener')
    const opener = document.createElement('button')
    document.body.append(opener)
    const wrapper = mount(AppPopover, {
      attachTo: document.body,
      props: { isOpen: true, opener, onClose: vi.fn() },
    })

    await wrapper.vm.$nextTick()
    wrapper.unmount()

    expect(removeDocumentListener.mock.calls.some(([type, , capture]) => type === 'scroll' && capture === true)).toBe(true)
    expect(removeWindowListener.mock.calls.some(([type]) => type === 'resize')).toBe(true)
    removeDocumentListener.mockRestore()
    removeWindowListener.mockRestore()
  })
})
