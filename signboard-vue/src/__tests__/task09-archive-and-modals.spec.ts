import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { filterArchiveEntries } from '../../lib/archiveBrowser.js'
import { useArchiveStore } from '../stores/useArchiveStore'
import { useBoardSwitcherStore } from '../stores/useBoardSwitcherStore'
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
