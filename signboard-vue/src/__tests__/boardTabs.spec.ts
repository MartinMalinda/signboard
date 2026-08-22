import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

import BoardTabs from '../components/BoardTabs.vue'
import { useBoardsStore } from '../stores/useBoardsStore'

const boardPaths = Array.from({ length: 8 }, (_, index) => `/boards/board-${index + 1}/`)

beforeEach(() => {
  window.board = {
    ...window.board,
    setActiveBoardRoot: async (boardRoot) => ({ ok: true, boardRoot }),
    syncOpenBoardsState: async () => ({ ok: true }),
    clearActiveBoardRoot: async () => ({ ok: true }),
    readBoardSnapshot: async (boardRoot) => ({ ok: true, boardRoot, boardName: '', boardSettings: { labels: [] }, lists: [], errors: [] }),
  }
  localStorage.clear()
})

describe('BoardTabs', () => {
  it('keeps visible tabs in place while switching between them', async () => {
    const pinia = createPinia()
    const boards = useBoardsStore(pinia)
    boards.openBoardPaths = [...boardPaths]
    boards.activeBoardPath = boardPaths[0] || ''
    const onSwitch = vi.fn(async (path: string) => {
      boards.activeBoardPath = path
      return true
    })
    const wrapper = mount(BoardTabs, {
      global: { plugins: [pinia] },
      props: { onOpen: vi.fn(), onSwitch },
      attachTo: document.body,
    })
    Object.defineProperty(wrapper.find('#boardTabs').element, 'clientWidth', { configurable: true, value: 760 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    const labels = () => wrapper.findAll('.board-tab:not(.board-tab-more):not(.board-tab-add) .board-tab-label').map((tab) => tab.text())
    expect(labels()).toEqual(['board-1', 'board-2', 'board-3', 'board-4'])

    await wrapper.findAll('.board-tab:not(.board-tab-more):not(.board-tab-add) .board-tab-label')[2]?.trigger('click')
    await nextTick()

    expect(onSwitch).toHaveBeenCalledWith(boardPaths[2])
    expect(labels()).toEqual(['board-1', 'board-2', 'board-3', 'board-4'])
    expect(wrapper.find('.board-tab.is-active .board-tab-label').text()).toBe('board-3')
    wrapper.unmount()
  })

  it('moves the stable window only when a hidden board becomes active', async () => {
    const pinia = createPinia()
    const boards = useBoardsStore(pinia)
    boards.openBoardPaths = [...boardPaths]
    boards.activeBoardPath = boardPaths[0] || ''
    const wrapper = mount(BoardTabs, {
      global: { plugins: [pinia] },
      props: { onOpen: vi.fn(), onSwitch: vi.fn(async () => true) },
      attachTo: document.body,
    })
    Object.defineProperty(wrapper.find('#boardTabs').element, 'clientWidth', { configurable: true, value: 760 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    boards.activeBoardPath = boardPaths[6] || ''
    await nextTick()

    const visibleTabs = wrapper.findAll('.board-tab:not(.board-tab-more):not(.board-tab-add) .board-tab-label')
    expect(visibleTabs.map((tab) => tab.text())).toEqual(['board-4', 'board-5', 'board-6', 'board-7'])
    expect(wrapper.find('.board-tab.is-active .board-tab-label').text()).toBe('board-7')

    ;(visibleTabs[2]?.element as HTMLElement | undefined)?.focus()
    await visibleTabs[2]?.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(visibleTabs[3]?.element)
    wrapper.unmount()
  })
})

describe('board tab session order', () => {
  it('prioritizes the last active board once during restore and keeps that order while switching', async () => {
    const pinia = createPinia()
    localStorage.setItem('openBoardPaths', JSON.stringify(boardPaths.slice(0, 3)))
    localStorage.setItem('activeBoardPath', boardPaths[2] || '')
    const boards = useBoardsStore(pinia)

    await boards.restoreSession()
    expect(boards.openBoardPaths).toEqual([boardPaths[2], boardPaths[0], boardPaths[1]])

    await boards.activateBoard(boardPaths[1] || '')
    expect(boards.activeBoardPath).toBe(boardPaths[1])
    expect(boards.openBoardPaths).toEqual([boardPaths[2], boardPaths[0], boardPaths[1]])
  })
})
