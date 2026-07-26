import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  CUSTOM_SMART_CARD_ACTION_LIMIT,
  DEFAULT_SMART_CARD_ACTION_TARGET,
  normalizeAppSettings,
  normalizeNotificationSettings,
  normalizeOllamaUrl,
} from '../../lib/appSettingsSchema.js'
import { isCompletedListByWorkflow, normalizeLabels, normalizeWorkflowSettings } from '../../lib/boardLabels.js'
import { useBoardDataStore } from './useBoardDataStore'
import { useStaticModalStore } from './useStaticModalStore'
import { useBoardsStore, normalizeBoardPath } from './useBoardsStore'
import { useUiStore } from './useUiStore'
import type { AppSettings, BoardLabel, BoardSettings, DirectorySelection, ExternalCalendarStatus, GlobalShortcutStatus, OllamaStatus, SmartCardAction } from '../types'
import { applyBoardThemeToElement, COLOR_SCHEMES } from '../../lib/boardTheme.js'

export { COLOR_SCHEMES } from '../../lib/boardTheme.js'

export const SETTINGS_PANELS = Object.freeze(['app', 'notifications', 'smart-actions', 'general', 'labels', 'colors', 'workflow', 'obsidian', 'import'] as const)
export type SettingsPanel = typeof SETTINGS_PANELS[number]

export const SETTINGS_NAVIGATION = Object.freeze([
  { id: 'app', label: 'General', group: 'App Settings' },
  { id: 'notifications', label: 'Notifications', group: 'App Settings' },
  { id: 'smart-actions', label: 'Smart Actions', group: 'App Settings' },
  { id: 'general', label: 'General', group: 'Current Board' },
  { id: 'labels', label: 'Labels', group: 'Current Board' },
  { id: 'colors', label: 'Appearance', group: 'Current Board' },
  { id: 'workflow', label: 'Workflow', group: 'Current Board' },
  { id: 'obsidian', label: 'Obsidian', group: 'Current Board' },
  { id: 'import', label: 'Import', group: 'Current Board' },
] as const)

const LABEL_COLORS = ['#f59e0b', '#a855f7', '#14b8a6', '#ec4899', '#84cc16', '#f97316']

function panelId(value: string): SettingsPanel {
  return SETTINGS_PANELS.includes(value as SettingsPanel) ? value as SettingsPanel : 'app'
}

function sanitizeBoardDirectoryName(value: string) {
  return String(value || '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').replace(/[ .]+$/g, '')
}

function selectionPath(selection: string | DirectorySelection | null) {
  return normalizeBoardPath(typeof selection === 'string' ? selection : selection?.path)
}

function normalizeBoardSettings(value: unknown): BoardSettings {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    ...source,
    labels: normalizeLabels(source.labels),
    workflow: normalizeWorkflowSettings(source.workflow),
    colorScheme: typeof source.colorScheme === 'string' ? source.colorScheme : 'default',
    externalPublishedCalendar: source.externalPublishedCalendar && typeof source.externalPublishedCalendar === 'object' ? source.externalPublishedCalendar : { include: true },
  }
}

function summaryText(summary: Record<string, unknown> | null) {
  if (!summary) return ''
  const sources = Array.isArray(summary.sources) ? summary.sources.length : 0
  const parts = [`Imported ${sources === 1 ? '1 source' : `${sources} sources`}.`, `${Number(summary.listsCreated || 0)} lists created.`, `${Number(summary.cardsCreated || 0)} cards created.`]
  if (Number(summary.labelsCreated || 0) > 0) parts.push(`${Number(summary.labelsCreated)} labels created.`)
  if (Number(summary.archivedCards || 0) > 0) parts.push(`${Number(summary.archivedCards)} archived.`)
  return parts.join(' ')
}

export const useSettingsStore = defineStore('settings', () => {
    const boards = useBoardsStore()
    const data = useBoardDataStore()
    const ui = useUiStore()
    const isOpen = ref(false)
    const activePanel = ref<SettingsPanel>('app')
    const appSettings = ref<AppSettings>(normalizeAppSettings({}) as AppSettings)
    const boardSettings = ref<BoardSettings | null>(null)
    const boardRoot = ref('')
    const listNames = ref<string[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref('')
    const boardStatus = ref('')
    const duplicateStatus = ref('')
    const obsidianStatus = ref('')
    const importInProgress = ref('')
    const importSummary = ref<Record<string, unknown> | null>(null)
    const importWarnings = ref<string[]>([])
    const expandedActionIds = ref<string[]>([])
    const ollamaStatus = ref<OllamaStatus>({ checked: false, checking: false, ok: false, url: '', models: [], message: 'Not checked' })
    const externalCalendarStatus = ref<ExternalCalendarStatus>({ enabled: false, running: false, port: 48273, url: '', message: 'Disabled' })
    const globalShortcutStatus = ref<GlobalShortcutStatus>({ accelerator: '', registered: false, message: '' })
    let saveQueue = Promise.resolve()

    const hasBoard = computed(() => Boolean(boards.activeBoardPath && boardSettings.value))
    const labels = computed(() => normalizeLabels(boardSettings.value?.labels))
    const workflow = computed(() => normalizeWorkflowSettings(boardSettings.value?.workflow))
    const boardName = computed(() => data.boardName || boards.activeBoardName)
    const boardPath = computed(() => boardRoot.value.replace(/\/+$/, ''))
    const actions = computed(() => appSettings.value.ai.smartCardActions)

    function enqueue(task: () => Promise<void>) {
      saveQueue = saveQueue.then(task).catch((nextError) => { console.error('Settings save failed.', nextError); error.value = String(nextError instanceof Error ? nextError.message : nextError) })
      return saveQueue
    }

    async function saveApp(partial: Record<string, unknown>) {
      const next = normalizeAppSettings({ ...appSettings.value, ...partial }) as AppSettings
      appSettings.value = next
      if (!window.electronAPI.updateAppSettings) return
      await enqueue(async () => {
        const saved = await window.electronAPI.updateAppSettings?.(partial)
        if (saved) {
          const runtime = saved as AppSettings & { globalShortcutStatus?: GlobalShortcutStatus; externalPublishedCalendarStatus?: ExternalCalendarStatus }
          appSettings.value = normalizeAppSettings(saved) as AppSettings
          if (runtime.globalShortcutStatus) globalShortcutStatus.value = runtime.globalShortcutStatus
          if (runtime.externalPublishedCalendarStatus) externalCalendarStatus.value = runtime.externalPublishedCalendarStatus
        }
      })
    }

    async function saveBoard(partial: Record<string, unknown>) {
      if (!boardRoot.value || !window.board.updateBoardSettings) return
      saving.value = true
      try {
        const saved = await window.board.updateBoardSettings(boardRoot.value, partial)
        boardSettings.value = normalizeBoardSettings(saved)
        await data.reconcileAfterMutation(boardRoot.value)
      } finally {
        saving.value = false
      }
    }

    function applyTheme(settings = boardSettings.value) {
      applyBoardThemeToElement(document.getElementById('board'), settings, ui.themeMode)
    }

    async function load() {
      const root = normalizeBoardPath(boards.activeBoardPath)
      boardRoot.value = root
      loading.value = true
      error.value = ''
      try {
        const [app, board, names, shortcut] = await Promise.all([
          window.electronAPI.readAppSettings ? window.electronAPI.readAppSettings() : Promise.resolve(normalizeAppSettings({}) as AppSettings),
          root && window.board.readBoardSettings ? window.board.readBoardSettings(root) : Promise.resolve(null),
          root && window.board.listLists ? window.board.listLists(root) : Promise.resolve([]),
          window.electronAPI.getGlobalShortcutStatus ? window.electronAPI.getGlobalShortcutStatus() : Promise.resolve({ accelerator: '', registered: false, message: '' }),
        ])
        appSettings.value = normalizeAppSettings(app) as AppSettings
        boardSettings.value = board ? normalizeBoardSettings(board) : null
        listNames.value = Array.isArray(names) ? names : []
        globalShortcutStatus.value = shortcut || globalShortcutStatus.value
        const runtime = app as AppSettings & { externalPublishedCalendarStatus?: ExternalCalendarStatus }
        externalCalendarStatus.value = runtime.externalPublishedCalendarStatus || externalCalendarStatus.value
        if (appSettings.value.ai.enabled) void refreshOllamaModels()
        applyTheme(boardSettings.value)
      } catch (nextError) {
        error.value = String(nextError instanceof Error ? nextError.message : nextError)
      } finally {
        loading.value = false
      }
    }

    async function open(panel: string = 'app') {
      activePanel.value = panelId(panel)
      isOpen.value = true
      await load()
    }

    async function close() { await saveQueue; isOpen.value = false; error.value = '' }
    function selectPanel(panel: string) { activePanel.value = panelId(panel) }

    async function setTooltipsEnabled(enabled: boolean) { await saveApp({ tooltipsEnabled: enabled }) }
    async function setNotifications(partial: Partial<AppSettings['notifications']>) { await saveApp({ notifications: normalizeNotificationSettings({ ...appSettings.value.notifications, ...partial }) }) }
    async function setQuickAddShortcut(value: string) { await saveApp({ quickAdd: { ...appSettings.value.quickAdd, globalShortcut: value } }) }
    async function setExternalCalendar(partial: Partial<AppSettings['externalPublishedCalendar']>) { await saveApp({ externalPublishedCalendar: { ...appSettings.value.externalPublishedCalendar, ...partial } }) }
    async function setAi(partial: Partial<AppSettings['ai']>) { await saveApp({ ai: { ...appSettings.value.ai, ...partial, ollama: { ...appSettings.value.ai.ollama, ...partial.ollama }, smartCardActions: partial.smartCardActions || appSettings.value.ai.smartCardActions } }) }
    async function setOllamaUrl(url: string) { await setAi({ ollama: { ...appSettings.value.ai.ollama, url: normalizeOllamaUrl(url) } }) }
    async function setOllamaModel(model: string) { await setAi({ ollama: { ...appSettings.value.ai.ollama, model } }) }

    async function refreshOllamaModels() {
      const settings = appSettings.value.ai
      if (!settings.enabled || !window.electronAPI.inspectOllama) { ollamaStatus.value = { checked: false, checking: false, ok: false, url: settings.ollama.url, models: [], message: settings.enabled ? 'Ollama inspection is unavailable.' : 'Disabled' }; return }
      ollamaStatus.value = { ...ollamaStatus.value, checking: true, url: settings.ollama.url, message: 'Checking...' }
      try {
        const result = await window.electronAPI.inspectOllama({ url: settings.ollama.url })
        const models = Array.isArray(result?.models) ? result.models : []
        ollamaStatus.value = { checked: true, checking: false, ok: result?.ok === true, url: settings.ollama.url, models, message: result?.message || (result?.ok ? `${models.length} model${models.length === 1 ? '' : 's'} found.` : 'Unable to reach Ollama.') }
      } catch (nextError) {
        ollamaStatus.value = { checked: true, checking: false, ok: false, url: settings.ollama.url, models: [], message: String(nextError instanceof Error ? nextError.message : nextError) }
      }
    }

    function toggleActionExpanded(id: string) { expandedActionIds.value = expandedActionIds.value.includes(id) ? expandedActionIds.value.filter((value) => value !== id) : [...expandedActionIds.value, id] }
    async function updateAction(id: string, partial: Partial<SmartCardAction>) { await setAi({ smartCardActions: actions.value.map((action) => action.id === id ? { ...action, ...partial } : action) }) }
    async function moveAction(id: string, direction: 'up' | 'down') {
      const next = [...actions.value]; const index = next.findIndex((action) => action.id === id); const target = index + (direction === 'up' ? -1 : 1)
      if (index < 0 || target < 0 || target >= next.length) return
      const [action] = next.splice(index, 1); if (!action) return; next.splice(target, 0, action); await setAi({ smartCardActions: next }); expandedActionIds.value = [...new Set([...expandedActionIds.value, id])]
    }
    async function addAction() {
      if (actions.value.filter((action) => !action.builtIn).length >= CUSTOM_SMART_CARD_ACTION_LIMIT) return
      const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      const action: SmartCardAction = { id, type: 'custom', target: DEFAULT_SMART_CARD_ACTION_TARGET, label: `Custom action ${actions.value.filter((candidate) => !candidate.builtIn).length + 1}`, prompt: 'Use the card context to create useful Markdown to append to this card.', builtIn: false }
      await setAi({ smartCardActions: [action, ...actions.value] }); expandedActionIds.value = [id, ...expandedActionIds.value]
    }
    async function resetAction(id: string) {
      const current = actions.value.find((action) => action.id === id)
      if (!current) return
      const defaults = (normalizeAppSettings({}).ai.smartCardActions as SmartCardAction[]).find((action) => action.id === id)
      if (defaults) await updateAction(id, { prompt: defaults.prompt, label: defaults.label, target: defaults.target })
    }
    async function removeAction(id: string) { await setAi({ smartCardActions: actions.value.filter((action) => action.id !== id || action.builtIn) }); expandedActionIds.value = expandedActionIds.value.filter((value) => value !== id) }
    async function reorderActions(ids: string[]) {
      const byId = new Map(actions.value.map((action) => [action.id, action])); const next = ids.map((id) => byId.get(id)).filter((action): action is SmartCardAction => Boolean(action)); byId.forEach((action) => next.push(action)); await setAi({ smartCardActions: next })
    }

    async function addLabel(name = '') {
      const nextIndex = labels.value.length + 1; const color = LABEL_COLORS[(nextIndex - 1) % LABEL_COLORS.length]
      const label: BoardLabel = { id: `label-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, name: String(name || '').trim() || `Label ${nextIndex}`, colorLight: color, colorDark: color }
      await saveBoard({ labels: [...labels.value, label] }); return label
    }
    async function updateLabel(id: string, partial: Partial<BoardLabel>) { await saveBoard({ labels: labels.value.map((label) => label.id === id ? { ...label, ...partial } : label) }) }
    async function deleteLabel(id: string) {
      const label = labels.value.find((candidate) => candidate.id === id); if (!label) return
      if (typeof window.confirm === 'function' && !window.confirm(`Delete "${label.name}"?\n\nDeleting this label will remove it from every card in this board.`)) return
      if (window.board.listLists && window.board.listCards) {
        for (const listName of await window.board.listLists(boardRoot.value)) for (const cardName of await window.board.listCards(`${boardRoot.value}${listName}/`)) {
          const cardPath = `${boardRoot.value}${listName}/${cardName}`; const card = await window.board.readCard(cardPath); const current = Array.isArray(card.frontmatter.labels) ? card.frontmatter.labels.map(String) : []
          if (current.includes(id)) await window.board.updateFrontmatter(cardPath, { labels: current.filter((candidate) => candidate !== id) })
        }
      }
      await saveBoard({ labels: labels.value.filter((candidate) => candidate.id !== id) })
    }

    async function setColorScheme(colorScheme: string) { await saveBoard({ colorScheme, themeOverrides: { light: {}, dark: {} } }); applyTheme(boardSettings.value) }
    async function cycleColorScheme() {
      if (!boardRoot.value) await load()
      const current = boardSettings.value?.colorScheme || 'default'
      const index = COLOR_SCHEMES.findIndex((scheme) => scheme.id === current)
      await setColorScheme(COLOR_SCHEMES[(index + 1) % COLOR_SCHEMES.length]!.id)
    }
    async function applyColorToOpenBoards() { for (const root of boards.openBoardPaths) await window.board.updateBoardSettings?.(root, { colorScheme: boardSettings.value?.colorScheme || 'default', themeOverrides: boardSettings.value?.themeOverrides || { light: {}, dark: {} } }); ui.announceStatus('Applied board colors to open boards.') }
    async function setWorkflow(partial: Record<string, unknown>) { await saveBoard({ workflow: { ...workflow.value, ...partial } }) }
    const boardCalendarIncluded = computed(() => (boardSettings.value?.externalPublishedCalendar as { include?: boolean } | undefined)?.include !== false)
    async function setExternalCalendarInclude(include: boolean) { await saveBoard({ externalPublishedCalendar: { ...(boardSettings.value?.externalPublishedCalendar as Record<string, unknown> || { include: true }), include } }) }
    async function setWorkflowList(listName: string, checked: boolean) {
      const current = workflow.value; const identity = (value: string) => String(value || '').toLowerCase().replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, '')
      const remove = (values: string[]) => values.filter((value) => identity(value) !== identity(listName)); let completed = remove(current.completedListNames); let ignored = remove(current.ignoredCompletedListNames)
      if (checked) completed = [...completed, listName]; else if (current.autoDetectCompletedLists && isCompletedListByWorkflow(listName, current)) ignored = [...ignored, listName]
      await setWorkflow({ completedListNames: completed, ignoredCompletedListNames: ignored })
    }
    function isCompletedList(listName: string) { return isCompletedListByWorkflow(listName, workflow.value) }

    async function renameBoard(name: string) { const source = boardRoot.value; const safe = sanitizeBoardDirectoryName(name); if (!source || !safe) return false; const current = source.replace(/\/+$/, ''); const parent = `${current.slice(0, current.lastIndexOf('/') + 1)}`; const target = normalizeBoardPath(`${parent}${safe}`); if (target === source) return false; await window.board.moveList(source, target); await boards.replaceBoardPath(source, target); boardRoot.value = target; await load(); return true }
    async function moveBoard(selection: string | DirectorySelection | null) { const parent = selectionPath(selection); if (!parent || !boardRoot.value) return false; const current = boardRoot.value.replace(/\/+$/, ''); const name = current.split('/').pop() || ''; const target = normalizeBoardPath(`${parent}${name}`); if (target === boardRoot.value) return false; await window.board.moveList(boardRoot.value, target); await boards.replaceBoardPath(boardRoot.value, target); boardRoot.value = target; await load(); return true }
    async function duplicateBoard(name: string, selection: DirectorySelection | null) { const safe = sanitizeBoardDirectoryName(name); if (!safe || !selection?.token || !window.board.duplicateBoard) return false; duplicateStatus.value = 'Duplicating'; const result = await window.board.duplicateBoard(boardRoot.value, { boardName: safe, destinationParentToken: selection.token }); if (!result?.boardRoot) { duplicateStatus.value = 'Unable to duplicate'; return false } await boards.openBoard(result.boardRoot); duplicateStatus.value = `Duplicated ${safe}.`; return true }
    async function generateBase() { if (!window.board.generateObsidianBase) return; const result = await window.board.generateObsidianBase(boardRoot.value); if (result?.reason === 'NOT_IN_OBSIDIAN_VAULT' || result?.inVault === false) useStaticModalStore().showObsidianVaultRequired('Generating an Obsidian Base only works when the current board folder is stored inside an Obsidian vault.'); obsidianStatus.value = result?.ok ? (result.reason === 'UPDATED' ? 'Updated Signboard Board.base.' : 'Generated Signboard Board.base.') : 'Unable to generate Obsidian Base.' }
    async function openBase() { if (!window.board.openObsidianBase) return; const result = await window.board.openObsidianBase(boardRoot.value); if (result?.error === 'NOT_IN_OBSIDIAN_VAULT' || result?.inVault === false) useStaticModalStore().showObsidianVaultRequired('Opening an Obsidian Base only works when the current board folder is stored inside an Obsidian vault.'); obsidianStatus.value = result?.ok ? 'Opened Signboard Board.base.' : 'Move this board into an Obsidian vault before opening the Base.' }
    async function importBoard(importer: 'trello' | 'obsidian' | 'tasksmd') {
      if (!window.chooser.pickImportSources || !boardRoot.value || importInProgress.value) return
      importInProgress.value = importer
      try {
        const selections = await window.chooser.pickImportSources({ importer, defaultPath: boardRoot.value.replace(/\/+$/, '').split('/').slice(0, -1).join('/') })
        if (!selections?.length) return
        const tokens = selections.map((selection) => selection.token || selection.path)
        const summary = importer === 'trello' ? await window.board.importTrello?.(boardRoot.value, tokens[0] || '') : importer === 'obsidian' ? await window.board.importObsidian?.(boardRoot.value, tokens) : await window.board.importTasksMd?.(boardRoot.value, tokens)
        importSummary.value = summary || null; importWarnings.value = Array.isArray(summary?.warnings) ? summary.warnings.map(String) : []; await data.reconcileAfterMutation(boardRoot.value)
      } catch (nextError) { error.value = String(nextError instanceof Error ? nextError.message : nextError) } finally { importInProgress.value = '' }
    }

    return { isOpen, activePanel, appSettings, boardSettings, boardRoot, boardPath, boardName, listNames, labels, workflow, actions, loading, saving, error, boardStatus, duplicateStatus, obsidianStatus, importInProgress, importSummary, importWarnings, ollamaStatus, externalCalendarStatus, globalShortcutStatus, expandedActionIds, boardCalendarIncluded, hasBoard, summaryText, open, load, close, selectPanel, setTooltipsEnabled, setNotifications, setQuickAddShortcut, setExternalCalendar, setAi, setOllamaUrl, setOllamaModel, refreshOllamaModels, toggleActionExpanded, updateAction, moveAction, addAction, resetAction, removeAction, reorderActions, addLabel, updateLabel, deleteLabel, setColorScheme, cycleColorScheme, applyColorToOpenBoards, setWorkflow, setExternalCalendarInclude, setWorkflowList, isCompletedList, renameBoard, moveBoard, duplicateBoard, generateBase, openBase, importBoard, applyTheme }
})
