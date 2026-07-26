import { beforeEach, describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

import App from '../App.vue'
import AppHeader from '../components/AppHeader.vue'
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
})
