import { beforeEach, describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

import App from '../App.vue'
import AppHeader from '../components/AppHeader.vue'
import BoardSwitcherModal from '../components/modals/BoardSwitcherModal.vue'
import { useBoardSwitcherStore } from '../stores/useBoardSwitcherStore'
import { useBoardsStore } from '../stores/useBoardsStore'

const snapshot = {
  ok: true,
  boardRoot: '',
  boardName: '',
  boardSettings: { labels: [] },
  lists: [],
  errors: [],
}

beforeEach(() => {
  window.board = {
    authorizeBoardSelection: async (token) => ({ ok: true, boardRoot: token }),
    setActiveBoardRoot: async (boardRoot) => ({ ok: true, boardRoot }),
    syncOpenBoardsState: async () => ({ ok: true }),
    clearActiveBoardRoot: async () => ({ ok: true }),
    listDirectories: async () => [],
    listLists: async () => [],
    listCards: async () => [],
    readBoardSnapshot: async () => snapshot,
    createList: async () => undefined,
    createCard: async () => undefined,
    moveList: async () => undefined,
    moveCard: async () => undefined,
    getBoardName: (path) => path,
    formatDueDate: async (date) => date,
    readCard: async () => ({ frontmatter: {}, body: '' }),
    writeCard: async () => undefined,
    updateFrontmatter: async () => ({}),
    normalizeFrontmatter: async (frontmatter) => frontmatter,
  }
  window.chooser = { pickDirectory: async () => null }
  window.electronAPI = {}
  localStorage.clear()
})

describe('App', () => {
  it('mounts the app shell', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    expect(wrapper.find('#boardName').exists()).toBe(false)
    expect(wrapper.find('#board').exists()).toBe(true)
  })

  it('keeps the active board toolbar on the right beside the tabs', async () => {
    const pinia = createPinia()
    const boards = useBoardsStore(pinia)
    boards.openBoardPaths = ['/board/']
    boards.activeBoardPath = '/board/'
    const wrapper = mount(AppHeader, { global: { plugins: [pinia] } })
    await nextTick()

    expect(wrapper.find('header').classes()).toContain('has-active-board')
    expect(wrapper.find('#boardName').exists()).toBe(false)
    expect(wrapper.find('#boardSearchInput').exists()).toBe(true)
    expect(wrapper.find('#labelFilterButton').exists()).toBe(true)
    expect(wrapper.find('#boardMenuButton').exists()).toBe(true)
  })

  it('opens the quick switcher and transfers focus from the board search field', async () => {
    const pinia = createPinia()
    const boards = useBoardsStore(pinia)
    const switcher = useBoardSwitcherStore(pinia)
    boards.openBoardPaths = ['/board/']
    boards.activeBoardPath = '/board/'
    const openSwitcher = vi.fn(() => switcher.open())
    const header = mount(AppHeader, { global: { plugins: [pinia] }, props: { onOpenBoardSwitcher: openSwitcher } })
    const modal = mount(BoardSwitcherModal, { global: { plugins: [pinia] }, attachTo: document.body })

    await header.find('#boardSearchInput').trigger('focus')
    await nextTick()
    await nextTick()

    expect(openSwitcher).toHaveBeenCalledTimes(1)
    expect(document.querySelector('#modalBoardSwitcher')).not.toBeNull()
    expect(document.activeElement).toBe(document.querySelector('#boardSwitcherInput'))

    switcher.close()
    await nextTick()
    modal.unmount()
    header.unmount()
  })
})
