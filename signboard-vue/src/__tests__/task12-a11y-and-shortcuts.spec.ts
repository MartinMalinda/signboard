import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPopover from '../lib/components/AppPopover.vue'
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
    const actions = { quickAdd: vi.fn(), addList: vi.fn(), table: vi.fn(), moveLeft: vi.fn(), archive: vi.fn() }
    const handler = createShortcutHandler({
      onQuickAdd: actions.quickAdd,
      onAddList: actions.addList,
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
})
