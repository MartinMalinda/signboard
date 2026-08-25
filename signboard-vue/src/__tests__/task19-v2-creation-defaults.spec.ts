import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AddCardModal from '../components/modals/AddCardModal.vue'
import QuickAddCardModal from '../components/modals/QuickAddCardModal.vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import { useBoardsStore } from '../stores/useBoardsStore'

const createCard = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  setActivePinia(createPinia())
  createCard.mockReset().mockResolvedValue(undefined)
  window.board = {
    createCard,
    countCards: vi.fn().mockResolvedValue(0),
    listCards: vi.fn().mockResolvedValue([]),
    listLists: vi.fn().mockResolvedValue(['To-do', 'Doing']),
    readBoardSettings: vi.fn().mockResolvedValue({ v2: { enabled: true, cardDefaults: { kind: 'discovery', priorityClass: 'P1' } } }),
  } as unknown as typeof window.board
})

function setV2Snapshot() {
  const data = useBoardDataStore()
  data.snapshot = {
    ok: true,
    boardRoot: '/board/',
    boardName: 'Board',
    boardSettings: { v2: { enabled: true }, labels: [{ id: 'product', name: 'Product' }] },
    lists: [],
    errors: [],
    v2: { profile: { enabled: true, cardDefaults: { kind: 'discovery', priorityClass: 'P1' } }, cards: [] },
  }
}

describe('V2 creation defaults', () => {
  it('keeps the filename seed separate from the optional title with V2 details', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    setV2Snapshot()
    const wrapper = mount(AddCardModal, { attachTo: document.body, global: { plugins: [pinia] }, props: { isOpen: true, listPath: '/board/To-do', labels: [], onClose: vi.fn(), onCreated: vi.fn() } })
    expect(document.querySelector('#addCardWorkDetails')).toBeNull()
    ;(document.querySelector('#userInputCardName') as HTMLInputElement).value = 'Discover'
    ;(document.querySelector('#userInputCardName') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }))
    ;(document.querySelector('#addCardWorkDetailsToggle') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(document.querySelector('#addCardWorkDetails')).not.toBeNull())
    const selects = Array.from(document.querySelectorAll('#addCardWorkDetails select')) as HTMLSelectElement[]
    expect(selects[1]?.value).toBe('P1')
    const priority = selects[1]
    if (!priority) throw new Error('Priority selector was not rendered.')
    priority.value = 'P2'
    priority.dispatchEvent(new Event('change', { bubbles: true }))
    ;(document.querySelector('#btnAddCard') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(createCard).toHaveBeenCalledWith(expect.stringMatching(/\/board\/To-do\/discover-[A-Za-z0-9]+\.md/), '', { frontmatter: expect.objectContaining({ signboard_v2: expect.objectContaining({ kind: 'discovery', priority_class: 'P2' }) }) }))
    wrapper.unmount()
  })

  it('applies V2 defaults to Quick Add while preserving Shift+Enter create/open', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/board/']
    boards.activeBoardPath = '/board/'
    setV2Snapshot()
    const wrapper = mount(QuickAddCardModal, { attachTo: document.body, global: { plugins: [pinia] }, props: { isOpen: true, onClose: vi.fn(), onCreated: vi.fn() } })
    await vi.waitFor(() => expect(document.querySelector('#userInputCardName')).not.toBeNull())
    await vi.waitFor(() => expect(document.querySelector('#quickAddWorkDetailsToggle')).not.toBeNull())
    expect(document.querySelector('#modalAddCardToList')?.classList.contains('overflow')).toBe(true)
    const input = document.querySelector('#userInputCardName') as HTMLInputElement
    input.value = 'Quick discover'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const label = document.querySelector<HTMLInputElement>('#modalAddCardToList input[type="checkbox"]')
    label!.checked = true
    label!.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }))
    await vi.waitFor(() => expect(createCard).toHaveBeenCalled())
    expect(() => structuredClone(createCard.mock.calls[0]?.[2])).not.toThrow()
    expect(createCard.mock.calls[0]?.[2]?.frontmatter).toEqual(expect.objectContaining({ labels: ['product'], signboard_v2: expect.objectContaining({ kind: 'discovery', priority_class: 'P1' }) }))
    wrapper.unmount()
  })
})
