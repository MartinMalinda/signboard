import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBoardDataStore } from './useBoardDataStore'
import type { DirectorySelection } from '../types'

const OPEN_BOARDS_KEY = 'openBoardPaths'
const ACTIVE_BOARD_KEY = 'activeBoardPath'
const LEGACY_BOARD_KEY = 'boardPath'

export function normalizeBoardPath(value: unknown) {
  const normalized = String(value || '').replace(/\\/g, '/').trim()
  if (!normalized) return ''
  return normalized.endsWith('/') ? normalized : `${normalized}/`
}

function directoryPath(selection: string | DirectorySelection | null) {
  return normalizeBoardPath(typeof selection === 'string' ? selection : selection?.path)
}

function sanitizePaths(value: unknown) {
  const paths: string[] = []
  for (const item of Array.isArray(value) ? value : []) {
    const path = normalizeBoardPath(item)
    if (path && !paths.includes(path)) paths.push(path)
  }
  return paths
}

function readStoredPaths() {
  try {
    return sanitizePaths(JSON.parse(localStorage.getItem(OPEN_BOARDS_KEY) || '[]'))
  } catch {
    return []
  }
}

export function getBoardDisplayName(path: string) {
  return normalizeBoardPath(path).replace(/\/+$/, '').split('/').filter(Boolean).pop() || 'Board'
}

function starterDueDate(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function starterContent() {
  return `👋 Start Here

Welcome to Signboard.

This board lives in a folder on your computer. Lists are folders. Cards are Markdown files. That means your work stays portable, readable, and easy to automate.

## Try these first

- Edit this card title or body.
- Create a real card from the header Card button, a list actions menu, or Cmd/Ctrl + N.
- Drag a card between To do, Doing, and Done.
- Add a label or due date to this card.
- Search from the header, then press Enter to move into matching cards.
- Archive this card when you are done exploring.

## A tiny pretend plan

Here are a few example tasks so you can see how checklists and task due dates work:

- [ ] (due: ${starterDueDate(1)}) Rename this board to something you actually care about
- [ ] (due: ${starterDueDate(2)}) Add one real card you need to finish this week
- [ ] (due: ${starterDueDate(3)}) Open Planner and look for these dated checklist items
- [x] Opened Signboard and kicked the tires

## Things worth trying

- Use the bottom view dock to switch between Planner, Kanban, and Table.
- Open Planner Calendar or This Week to see dated work across open boards.
- Switch the bottom view dock to Table and scan cards across lists.
- Open the filter menu and try the label filters.
- Open Settings and customize labels, completed-list behavior, and board colors.
- Open Archive from the Board menu after archiving a card or list.

## Keyboard shortcuts

On macOS use Cmd. On Windows and Linux use Ctrl.

- Cmd/Ctrl + / opens the keyboard shortcuts helper
- Cmd/Ctrl + F focuses search; Enter or Arrow Down moves into matching cards
- Cmd/Ctrl + K switches between open boards
- Cmd/Ctrl + N opens Quick Add for any open board
- Cmd/Ctrl + Shift + N creates a new list
- Cmd/Ctrl + 1 returns to Kanban
- Cmd/Ctrl + Option/Alt + 1 opens Table
- Cmd/Ctrl + 2 opens Planner Calendar for all open boards
- Cmd/Ctrl + 3 opens Planner This Week for all open boards
- Cmd/Ctrl + Shift + P opens or closes Planner
- Cmd/Ctrl + , opens Settings
- Cmd/Ctrl + Shift + A opens Archive
- Esc closes open modals and popovers

## One last thing

Keep this card as a reference, or archive it and start fresh.`
}

export const useBoardsStore = defineStore('boards', () => {
  const openBoardPaths = ref<string[]>([])
  const activeBoardPath = ref('')
  const restoring = ref(false)

  function persist() {
    const paths = sanitizePaths(openBoardPaths.value)
    openBoardPaths.value = paths
    localStorage.setItem(OPEN_BOARDS_KEY, JSON.stringify(paths))
    localStorage.setItem(ACTIVE_BOARD_KEY, activeBoardPath.value)
    localStorage.setItem(LEGACY_BOARD_KEY, activeBoardPath.value)
    void window.board.syncOpenBoardsState({ openBoardPaths: paths, activeBoardPath: activeBoardPath.value })
  }

  async function authorize(selection: string | DirectorySelection | null) {
    const path = directoryPath(selection)
    if (!path) return ''
    const result = typeof selection === 'object' && selection?.token
      ? await window.board.authorizeBoardSelection(selection.token)
      : await window.board.setActiveBoardRoot(path)
    if (!result || result.ok === false) return ''
    return normalizeBoardPath(result.boardRoot || path)
  }

  async function restoreSession() {
    restoring.value = true
    try {
      const storedPaths = readStoredPaths()
      const storedActive = normalizeBoardPath(localStorage.getItem(ACTIVE_BOARD_KEY) || localStorage.getItem(LEGACY_BOARD_KEY))
      openBoardPaths.value = storedPaths.length ? storedPaths : storedActive ? [storedActive] : []
      activeBoardPath.value = openBoardPaths.value.includes(storedActive) ? storedActive : (openBoardPaths.value[0] || '')
      if (window.board.adoptLegacyBoardRoots && openBoardPaths.value.length) {
        await window.board.adoptLegacyBoardRoots([...openBoardPaths.value])
      }
      if (activeBoardPath.value) await authorize(activeBoardPath.value)
      persist()
      await useBoardDataStore().loadBoard(activeBoardPath.value)
    } finally {
      restoring.value = false
    }
  }

  async function activateBoard(path: string) {
    const normalized = normalizeBoardPath(path)
    if (!normalized) return false
    const authorized = await authorize(normalized)
    if (!authorized) return false
    activeBoardPath.value = authorized
    if (!openBoardPaths.value.includes(authorized)) openBoardPaths.value.push(authorized)
    persist()
    await useBoardDataStore().loadBoard(authorized)
    return true
  }

  async function authorizeSelection(selection: string | DirectorySelection) {
    return authorize(selection)
  }

  async function openBoard(selection: string | DirectorySelection | null) {
    const authorized = await authorize(selection)
    if (!authorized) return false
    const directories = await window.board.listDirectories(authorized)
    if (directories.length === 0) {
      await Promise.all([
        window.board.createList(`${authorized}To-do`),
        window.board.createList(`${authorized}Doing`),
        window.board.createList(`${authorized}Done`),
        window.board.createList(`${authorized}XXX-Archive`),
      ])
      await window.board.createCard(`${authorized}To-do/000-hello-stock.md`, starterContent())
    }
    if (!openBoardPaths.value.includes(authorized)) openBoardPaths.value.push(authorized)
    activeBoardPath.value = authorized
    persist()
    await useBoardDataStore().loadBoard(authorized)
    return true
  }

  async function pickAndOpenBoard(defaultPath = '') {
    const selection = await window.chooser.pickDirectory(defaultPath ? { defaultPath } : {})
    return selection ? openBoard(selection) : false
  }

  async function closeBoard(path: string) {
    const normalized = normalizeBoardPath(path)
    const index = openBoardPaths.value.indexOf(normalized)
    if (index < 0) return
    openBoardPaths.value.splice(index, 1)
    if (!openBoardPaths.value.length) {
      activeBoardPath.value = ''
      await window.board.clearActiveBoardRoot()
      persist()
      useBoardDataStore().clearBoard()
      return
    }
    if (activeBoardPath.value === normalized) {
      activeBoardPath.value = openBoardPaths.value[Math.min(index, openBoardPaths.value.length - 1)] || ''
      await authorize(activeBoardPath.value)
      await useBoardDataStore().loadBoard(activeBoardPath.value)
    }
    persist()
  }

  async function replaceBoardPath(previousPath: string, nextSelection: string | DirectorySelection) {
    const previous = normalizeBoardPath(previousPath)
    const next = await authorize(nextSelection)
    if (!next) return false
    const index = openBoardPaths.value.indexOf(previous)
    if (index < 0) return false
    openBoardPaths.value.splice(index, 1, next)
    if (activeBoardPath.value === previous) activeBoardPath.value = next
    persist()
    await useBoardDataStore().loadBoard(activeBoardPath.value)
    return true
  }

  return {
    openBoardPaths,
    activeBoardPath,
    restoring,
    activeBoardName: computed(() => activeBoardPath.value ? getBoardDisplayName(activeBoardPath.value) : ''),
    persist,
    restoreSession,
    authorizeSelection,
    activateBoard,
    openBoard,
    pickAndOpenBoard,
    closeBoard,
    replaceBoardPath,
  }
})
