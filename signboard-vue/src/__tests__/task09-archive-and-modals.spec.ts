import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { filterArchiveEntries } from '../../lib/archiveBrowser.js'
import { useArchiveStore } from '../stores/useArchiveStore'
import { useBoardSwitcherStore } from '../stores/useBoardSwitcherStore'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import { useBoardsStore } from '../stores/useBoardsStore'
import { useStaticModalStore } from '../stores/useStaticModalStore'
import BoardSwitcherModal from '../components/modals/BoardSwitcherModal.vue'
import StaticModals from '../components/modals/StaticModals.vue'
import AddCardModal from '../components/modals/AddCardModal.vue'
import Modal from '../lib/components/Modal.vue'

const archiveCard = { kind: 'card' as const, entryPath: '/board/XXX-Archive/000-plan.md', title: 'Plan release', archivedAt: '2026-07-25T10:00:00Z', originalListDirectoryName: '000-To-do-stock', originalListDisplayName: 'To do' }
const boardSnapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { labels: [], workflow: {} }, lists: [], errors: [] }

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  window.board = {
    authorizeBoardSelection: async () => ({ ok: true, boardRoot: '/board/' }),
    setActiveBoardRoot: async () => ({ ok: true, boardRoot: '/board/' }),
    syncOpenBoardsState: async () => undefined,
    clearActiveBoardRoot: async () => undefined,
    listDirectories: async () => [],
    listLists: async () => ['000-To-do-stock', '001-Doing-stock'],
    listCards: async () => [],
    readBoardSnapshot: async () => boardSnapshot,
    readBoardSettings: async () => boardSnapshot.boardSettings,
    readCard: async () => ({ frontmatter: {}, body: '' }),
    writeCard: async () => undefined,
    updateFrontmatter: async () => ({}),
    normalizeFrontmatter: async (frontmatter) => frontmatter,
    getBoardName: (path) => path,
    formatDueDate: async (date) => date,
    listArchiveEntries: async () => ({ cards: [archiveCard], lists: [] }),
    readArchiveEntry: async () => ({ entry: { ...archiveCard, card: { frontmatter: {}, body: 'Notes' } } }),
    restoreArchivedCard: vi.fn(async () => undefined),
    restoreArchivedList: vi.fn(async () => undefined),
    createList: async () => undefined,
    createCard: async () => undefined,
    moveList: async () => undefined,
    moveCard: async () => undefined,
  }
  window.electronAPI = { getAppInfo: async () => ({ appVersion: '1.2.3' }), openExternal: async () => undefined }
  window.chooser = { pickDirectory: async () => null, pickImportSources: async () => [] }
})

describe('Task 09 archive and static modal parity', () => {
  it('filters archived cards by title, labels, and original list while sorting newest first', () => {
    const entries = [archiveCard, { ...archiveCard, entryPath: '/board/XXX-Archive/001-other.md', title: 'Old note', labelNames: ['research'], archivedAt: '2026-07-20T10:00:00Z' }]
    expect(filterArchiveEntries(entries, 'research')[0]?.title).toBe('Old note')
    expect(filterArchiveEntries(entries, 'to do')[0]?.title).toBe('Plan release')
    expect(filterArchiveEntries(entries)[0]?.title).toBe('Plan release')
  })

  it('dispatches exact archived-card restore semantics and reconciles the board', async () => {
    const boards = useBoardsStore()
    boards.activeBoardPath = '/board/'
    const archive = useArchiveStore()
    await archive.openRestoreCard(archiveCard)
    archive.restoreSelectedListPath = '/board/001-Doing-stock'
    await expect(archive.confirmRestoreCard()).resolves.toBe(true)
    expect(window.board.restoreArchivedCard).toHaveBeenCalledWith(archiveCard.entryPath, '/board/001-Doing-stock')
  })

  it('keeps the board switcher keyboard model deterministic', () => {
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/one/', '/two/', '/three/']
    boards.activeBoardPath = '/one/'
    const switcher = useBoardSwitcherStore()
    switcher.open()
    expect(switcher.selectedOption()?.path).toBe('/two/')
    switcher.setQuery('three')
    expect(switcher.selectedOption()?.path).toBe('/three/')
    switcher.move(-1)
    expect(switcher.selectedOption()?.path).toBe('/three/')
  })

  it('adds matching cards from the current board and opens the selected card', async () => {
    const boards = useBoardsStore()
    const data = useBoardDataStore()
    boards.openBoardPaths = ['/one/']
    boards.activeBoardPath = '/one/'
    data.snapshot = {
      ...boardSnapshot,
      boardRoot: '/one/',
      lists: [{
        listName: '000-To-do-stock',
        listPath: '/one/000-To-do-stock',
        cards: [{ cardName: 'plan.md', cardPath: '/one/000-To-do-stock/plan.md', frontmatter: { title: 'Plan release' }, body: 'Ship the release', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] }],
      }],
    }
    const opened: string[] = []
    const switcher = useBoardSwitcherStore()
    switcher.open()
    switcher.setQuery('release')
    expect(switcher.filteredOptions).toHaveLength(1)
    expect(switcher.selectedOption()?.kind).toBe('card')
    await switcher.select(switcher.selectedOption()!, undefined, async (path) => { opened.push(path) })
    expect(opened).toEqual(['/one/000-To-do-stock/plan.md'])
  })

  it('ranks title matches ahead of body-only matches and highlights card excerpts', async () => {
    const boards = useBoardsStore()
    const data = useBoardDataStore()
    boards.openBoardPaths = ['/one/']
    boards.activeBoardPath = '/one/'
    data.snapshot = {
      ...boardSnapshot,
      boardRoot: '/one/',
      lists: [{
        listName: '000-To-do-stock',
        listPath: '/one/000-To-do-stock',
        cards: [
          { cardName: 'body-match.md', cardPath: '/one/000-To-do-stock/body-match.md', frontmatter: { title: 'Airtable embedded interface' }, body: 'Authorization audit notes', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] },
          { cardName: 'title-match.md', cardPath: '/one/000-To-do-stock/title-match.md', frontmatter: { title: 'Destination authorization audit plan' }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] },
        ],
      }],
    }
    const switcher = useBoardSwitcherStore()
    switcher.open()
    switcher.setQuery('authorization audit')
    expect(switcher.filteredOptions.map((option) => option.kind === 'card' ? option.label : option.label)).toEqual([
      'Destination authorization audit plan',
      'Airtable embedded interface',
    ])
    const wrapper = mount(BoardSwitcherModal, { attachTo: document.body })
    await wrapper.vm.$nextTick()
    expect(Array.from(document.querySelectorAll<HTMLElement>('.board-switcher-option-excerpt mark')).map((mark) => mark.textContent)).toContain('Authorization')
    expect(Array.from(document.querySelectorAll<HTMLElement>('.board-switcher-option-excerpt')).some((excerpt) => excerpt.textContent?.includes('audit'))).toBe(true)
    wrapper.unmount()
  })

  it('opens a matching card when Enter is pressed in the switcher', async () => {
    const boards = useBoardsStore()
    const data = useBoardDataStore()
    boards.openBoardPaths = ['/one/']
    boards.activeBoardPath = '/one/'
    data.snapshot = {
      ...boardSnapshot,
      boardRoot: '/one/',
      lists: [{ listName: '000-To-do-stock', listPath: '/one/000-To-do-stock', cards: [{ cardName: 'plan.md', cardPath: '/one/000-To-do-stock/plan.md', frontmatter: { title: 'Plan release' }, body: '', taskSummary: { total: 0, completed: 0, remaining: 0 }, taskStartDates: [], incompleteTaskStartDates: [], taskDueDates: [], incompleteTaskDueDates: [] }] }],
    }
    const opened: string[] = []
    const switcher = useBoardSwitcherStore()
    switcher.open()
    const wrapper = mount(BoardSwitcherModal, { attachTo: document.body, props: { onOpenCard: async (path) => { opened.push(path) } } })
    await wrapper.vm.$nextTick()
    const input = document.querySelector<HTMLInputElement>('#boardSwitcherInput')
    expect(input).not.toBeNull()
    input!.value = 'release'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await wrapper.vm.$nextTick()
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(opened).toEqual(['/one/000-To-do-stock/plan.md'])
    wrapper.unmount()
  })

  it('scrolls the highlighted option into view when arrow navigation moves it', async () => {
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/one/', '/two/', '/three/', '/four/']
    boards.activeBoardPath = '/one/'
    const switcher = useBoardSwitcherStore()
    switcher.open()
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    const wrapper = mount(BoardSwitcherModal, { attachTo: document.body })
    await wrapper.vm.$nextTick()
    scrollIntoView.mockClear()

    const input = document.querySelector<HTMLInputElement>('#boardSwitcherInput')!
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(switcher.selectedOption()?.path).toBe('/three/')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(scrollIntoView.mock.instances[0]).toBe(document.querySelector('#boardSwitcherOption-2'))
    wrapper.unmount()
  })

  it('renders the switcher and static modal contracts with OS-aware shortcut labels', async () => {
    const boards = useBoardsStore()
    boards.openBoardPaths = ['/one/']
    boards.activeBoardPath = '/one/'
    const switcher = useBoardSwitcherStore()
    switcher.open()
    const wrapper = mount(BoardSwitcherModal, { attachTo: document.body })
    expect(document.querySelector('#modalBoardSwitcher')).not.toBeNull()
    expect(document.querySelector('#boardSwitcherInput')?.getAttribute('aria-controls')).toBe('boardSwitcherResults')
    const modals = useStaticModalStore()
    modals.openKeyboardShortcuts()
    const staticWrapper = mount(StaticModals, { attachTo: document.body })
    await staticWrapper.vm.$nextTick()
    expect(document.querySelector('#modalKeyboardShortcuts')).not.toBeNull()
    expect(document.querySelector('[data-shortcut-action="switchBoard"]')?.textContent).toMatch(/K/)
    staticWrapper.unmount()
    wrapper.unmount()
  })

  it('does not render closed modal roots or backdrops', async () => {
    const wrapper = mount(Modal, {
      attachTo: document.body,
      props: { isOpen: false, onClose: vi.fn() },
      slots: { default: '<p>Modal content</p>' },
    })
    await wrapper.vm.$nextTick()
    const root = document.querySelector('#modalEditCard')
    expect(root).toBeNull()
    expect(document.querySelectorAll('#modals .modal-wrap')).toHaveLength(0)
    wrapper.unmount()
  })

  it('closes stacked modals from the topmost layer first', async () => {
    const outerClose = vi.fn()
    const innerClose = vi.fn()
    const outer = mount(Modal, {
      attachTo: document.body,
      props: { id: 'modalOuter', isOpen: true, onClose: outerClose },
      slots: { default: '<button>Outer</button>' },
    })
    const inner = mount(Modal, {
      attachTo: document.body,
      props: { id: 'modalInner', isOpen: true, onClose: innerClose },
      slots: { default: '<button>Inner</button>' },
    })
    await flushPromises()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(innerClose).toHaveBeenCalledOnce()
    expect(outerClose).not.toHaveBeenCalled()

    await inner.setProps({ isOpen: false })
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(outerClose).toHaveBeenCalledOnce()

    inner.unmount()
    outer.unmount()
  })

  it('uses the Kanban display name in the Add Card heading', async () => {
    const modals = document.createElement('div')
    modals.id = 'modals'
    document.body.appendChild(modals)
    const wrapper = mount(AddCardModal, {
      attachTo: document.body,
      props: { isOpen: true, listPath: '/board/002-Doing-stock/', labels: [], onClose: vi.fn(), onCreated: vi.fn() },
    })
    await wrapper.vm.$nextTick()
    expect(document.querySelector('#addCardHeading')?.textContent).toBe('Add card to Doing')
    wrapper.unmount()
    modals.remove()
  })

  it('uses the shared label option layout in the Add Card modal', async () => {
    const modals = document.createElement('div')
    modals.id = 'modals'
    document.body.appendChild(modals)
    const wrapper = mount(AddCardModal, {
      attachTo: document.body,
      props: {
        isOpen: true,
        listPath: '/board/002-Doing-stock/',
        labels: [{ id: 'strategy', name: 'Strategy' }, { id: 'impact', name: 'Impact: high' }],
        onClose: vi.fn(),
        onCreated: vi.fn(),
      },
    })
    await wrapper.vm.$nextTick()
    expect(document.querySelector('#modalAddCard .quick-add-labels')).toBeTruthy()
    expect(document.querySelectorAll('#modalAddCard .quick-add-label-option')).toHaveLength(2)
    expect(document.querySelector('#modalAddCard .quick-add-label-option')?.textContent).toContain('Strategy')
    expect(document.querySelector('#modalAddCard')?.classList.contains('overflow')).toBe(true)
    wrapper.unmount()
    modals.remove()
  })

  it('restores the opener after a static modal Escape/close lifecycle', async () => {
    const opener = document.createElement('button')
    opener.id = 'modal-opener'
    document.body.appendChild(opener)
    opener.focus()
    const modals = useStaticModalStore()
    const wrapper = mount(StaticModals, { attachTo: document.body })
    modals.openAbout()
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('aboutSignboardClose'))
    modals.closeAll()
    await vi.waitFor(() => expect(document.activeElement).toBe(opener))
    wrapper.unmount()
    opener.remove()
  })
})
