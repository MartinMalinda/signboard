import { onBeforeUnmount, onMounted } from 'vue'
import { isMacPlatform } from '../../lib/shortcutLabels.js'

export type ShortcutView = 'planner' | 'kanban' | 'table'
export type PlannerShortcutView = 'calendar' | 'this-week' | 'day' | 'agenda' | 'toggle'

export interface ShortcutOptions {
  onQuickAdd: () => void | Promise<void>
  onAddList: () => void | Promise<void>
  onFocusSearch?: () => void | Promise<void>
  onSettings?: () => void | Promise<void>
  onBoardSwitcher?: () => void | Promise<void>
  onKeyboardShortcuts?: () => void | Promise<void>
  onArchive?: () => void | Promise<void>
  onView?: (view: ShortcutView) => void | Promise<void>
  onPlanner?: (view: PlannerShortcutView, scope: 'all' | 'current') => void | Promise<void>
  onToggleTheme?: () => void | Promise<void>
  onCycleColorScheme?: () => void | Promise<void>
  onMoveCardLeft?: () => void | Promise<void>
  onMoveCardRight?: () => void | Promise<void>
  onArchiveCard?: () => void | Promise<void>
}

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]'))
}

export function hasPrimaryModifier(event: KeyboardEvent) {
  return isMacPlatform() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
}

function hasPrimaryOnly(event: KeyboardEvent, options: { shift?: boolean; alt?: boolean } = {}) {
  return hasPrimaryModifier(event) && event.shiftKey === Boolean(options.shift) && event.altKey === Boolean(options.alt)
}

function keyIs(event: KeyboardEvent, key: string, code = '') {
  return event.key.toLowerCase() === key.toLowerCase() || event.code === code
}

function isEditorScopedTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('#modalEditCard'))
}

export function createShortcutHandler(options: ShortcutOptions) {
  return function onKeydown(event: KeyboardEvent) {
    const editorTarget = isEditorScopedTarget(event.target)
    const editable = isEditableTarget(event.target)

    if (hasPrimaryOnly(event) && keyIs(event, 'n', 'KeyN')) {
      if (editable) return
      event.preventDefault(); void options.onQuickAdd(); return
    }
    if (hasPrimaryOnly(event, { shift: true }) && keyIs(event, 'n', 'KeyN')) {
      if (editable) return
      event.preventDefault(); void options.onAddList(); return
    }
    if (hasPrimaryOnly(event) && keyIs(event, 'f', 'KeyF')) {
      if (editable) return
      event.preventDefault(); void options.onFocusSearch?.(); return
    }
    if (hasPrimaryOnly(event) && keyIs(event, ',', 'Comma')) {
      if (editable) return
      event.preventDefault(); void options.onSettings?.(); return
    }
    if (hasPrimaryOnly(event) && keyIs(event, 'k', 'KeyK')) {
      if (editable) return
      event.preventDefault(); void options.onBoardSwitcher?.(); return
    }
    if (hasPrimaryOnly(event) && keyIs(event, '/', 'Slash')) {
      if (editable) return
      event.preventDefault(); void options.onKeyboardShortcuts?.(); return
    }
    if (hasPrimaryOnly(event, { shift: true }) && keyIs(event, 'a', 'KeyA')) {
      if (editable) return
      event.preventDefault(); void options.onArchive?.(); return
    }
    if (hasPrimaryOnly(event, { shift: true }) && keyIs(event, 'p', 'KeyP')) {
      if (editable) return
      event.preventDefault(); void options.onPlanner?.('toggle', 'all'); return
    }
    if (hasPrimaryOnly(event, { shift: true }) && keyIs(event, 'd', 'KeyD')) {
      if (editable) return
      event.preventDefault(); void options.onToggleTheme?.(); return
    }

    const colorSchemeShortcut = isMacPlatform()
      ? event.metaKey && event.ctrlKey && event.shiftKey && !event.altKey
      : event.ctrlKey && event.altKey && event.shiftKey && !event.metaKey
    if (colorSchemeShortcut && keyIs(event, 'c', 'KeyC')) {
      if (editable) return
      event.preventDefault(); void options.onCycleColorScheme?.(); return
    }

    if (editorTarget && hasPrimaryOnly(event, { shift: true }) && keyIs(event, '[', 'BracketLeft')) {
      event.preventDefault(); void options.onMoveCardLeft?.(); return
    }
    if (editorTarget && hasPrimaryOnly(event, { shift: true }) && keyIs(event, ']', 'BracketRight')) {
      event.preventDefault(); void options.onMoveCardRight?.(); return
    }
    const archiveShortcut = hasPrimaryModifier(event) && event.altKey && event.shiftKey && keyIs(event, 'Backspace')
    if (editorTarget && archiveShortcut) {
      event.preventDefault(); void options.onArchiveCard?.(); return
    }

    if (editable) return
    if (!hasPrimaryModifier(event) || event.shiftKey && !['1', '2', '3', '4', '5'].includes(event.key)) return

    if (keyIs(event, '1', 'Digit1')) {
      if (event.altKey) { event.preventDefault(); void options.onView?.('table') }
      else if (!event.altKey) { event.preventDefault(); void options.onView?.('kanban') }
      return
    }
    const plannerViews = { '2': 'calendar', '3': 'this-week', '4': 'day', '5': 'agenda' } as const
    const plannerView = plannerViews[event.key as keyof typeof plannerViews]
    if (plannerView && !event.shiftKey) {
      event.preventDefault(); void options.onPlanner?.(plannerView, event.altKey ? 'current' : 'all')
    }
  }
}

export function useShortcuts(options: ShortcutOptions) {
  const onKeydown = createShortcutHandler(options)
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
  return { onKeydown }
}
