import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import {
  DEFAULT_SMART_CARD_ACTIONS,
  normalizeAppSettings,
  normalizeNotificationSettings,
  normalizeOllamaUrl,
  normalizeSmartCardActions,
} from '../../lib/appSettingsSchema.js'
import { SETTINGS_NAVIGATION, useSettingsStore } from '../stores/useSettingsStore'
import SettingsModal from '../components/settings/SettingsModal.vue'

const snapshot = { ok: true, boardRoot: '/board/', boardName: 'Board', boardSettings: { labels: [{ id: 'one', name: 'One' }], workflow: { autoDetectCompletedLists: true, completedListNames: [], ignoredCompletedListNames: [] } }, lists: [], errors: [] }

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  window.board = {
    authorizeBoardSelection: async () => ({ ok: true, boardRoot: '/board/' }),
    setActiveBoardRoot: async () => ({ ok: true, boardRoot: '/board/' }),
    syncOpenBoardsState: async () => undefined,
    clearActiveBoardRoot: async () => undefined,
    listDirectories: async () => [],
    listLists: async () => ['000-To-do-stock', '002-Done-stock'],
    listCards: async () => [],
    readBoardSnapshot: async () => snapshot,
    readBoardSettings: async () => snapshot.boardSettings,
    updateBoardSettings: async (_root, partial) => ({ ...snapshot.boardSettings, ...partial }),
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
  window.electronAPI = {
    readAppSettings: async () => normalizeAppSettings({}),
    updateAppSettings: async (partial) => normalizeAppSettings({ ...normalizeAppSettings({}), ...partial }),
    inspectOllama: async () => ({ ok: true, models: [{ name: 'qwen', model: 'qwen' }] }),
  }
  window.chooser = { pickDirectory: async () => null, pickImportSources: async () => [] }
})

describe('Settings parity model', () => {
  it('normalizes app defaults, times, and Ollama URLs', () => {
    const settings = normalizeAppSettings({ notifications: { enabled: true, time: '25:80' }, ai: { ollama: { url: 'localhost:11434' } } })
    expect(settings.notifications).toEqual({ enabled: true, time: '09:00' })
    expect(settings.ai.ollama.url).toBe('http://localhost:11434')
    expect(normalizeNotificationSettings({ time: '24:15' }).time).toBe('24:15')
    expect(normalizeOllamaUrl('https://ollama.example/api/')).toBe('https://ollama.example/api')
  })

  it('keeps the documented panel order and keyboard navigation target set', () => {
    expect(SETTINGS_NAVIGATION.map((item) => item.id)).toEqual(['app', 'notifications', 'smart-actions', 'general', 'labels', 'colors', 'workflow', 'obsidian', 'import'])
    const settings = useSettingsStore()
    settings.selectPanel('workflow')
    expect(settings.activePanel).toBe('workflow')
    settings.selectPanel('unknown')
    expect(settings.activePanel).toBe('app')
  })

  it('renders the legacy Settings tabs and switches panel visibility', async () => {
    const settings = useSettingsStore()
    settings.isOpen = true
    settings.boardSettings = snapshot.boardSettings
    const wrapper = mount(SettingsModal, { attachTo: document.body })
    const modal = document.querySelector('#modalBoardSettings') as HTMLElement
    expect(modal).not.toBeNull()
    expect(document.querySelector('#boardSettingsNavSmartActions')?.getAttribute('aria-controls')).toBe('boardSettingsPanelSmartActions')
    ;(document.querySelector('#boardSettingsNavLabels') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(document.querySelector('#boardSettingsPanelLabels')?.getAttribute('aria-hidden')).toBe('false'))
    expect(document.querySelector('#boardSettingsPanelApp')?.getAttribute('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('persists completed-list workflow and label settings through board updates', async () => {
    const settings = useSettingsStore()
    settings.boardRoot = '/board/'
    settings.boardSettings = snapshot.boardSettings
    settings.listNames = ['000-To-do-stock', '002-Done-stock']
    expect(settings.isCompletedList('002-Done-stock')).toBe(true)
    await settings.setWorkflowList('002-Done-stock', false)
    expect(settings.workflow.ignoredCompletedListNames).toEqual(['002-Done-stock'])
    const label = await settings.addLabel('Review')
    expect(label.name).toBe('Review')
    expect(settings.labels.some((candidate) => candidate.name === 'Review')).toBe(true)
  })

  it('orders smart actions while preserving non-editable built-ins', async () => {
    const settings = useSettingsStore()
    settings.appSettings = normalizeAppSettings({})
    const original = settings.actions.map((action) => action.id)
    await settings.moveAction('question-card', 'up')
    expect(settings.actions.map((action) => action.id)).toEqual([...original.slice(0, -2), 'question-card', 'quick-smart-action'])
    expect(settings.actions.find((action) => action.id === 'question-card')?.editable).toBe(false)
    expect(normalizeSmartCardActions(DEFAULT_SMART_CARD_ACTIONS).length).toBe(7)
  })
})
