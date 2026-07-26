const SHORTCUTS = {
  keyboardShortcuts: { mac: '⌘ /', other: 'Ctrl /', aria: 'Meta+/' },
  addCard: { mac: '⌘ N', other: 'Ctrl N', aria: 'Meta+N' },
  addList: { mac: '⌘ ⇧ N', other: 'Shift+Ctrl+N', aria: 'Shift+Meta+N' },
  kanbanView: { mac: '⌘ 1', other: 'Ctrl 1', aria: 'Meta+1' },
  tableView: { mac: '⌘ ⌥ 1', other: 'Alt+Ctrl+1', aria: 'Alt+Meta+1' },
  calendarView: { mac: '⌘ 2', other: 'Ctrl 2', aria: 'Meta+2' },
  thisWeekView: { mac: '⌘ 3', other: 'Ctrl 3', aria: 'Meta+3' },
  plannerDayView: { mac: '⌘ 4', other: 'Ctrl 4', aria: 'Meta+4' },
  plannerAgendaView: { mac: '⌘ 5', other: 'Ctrl 5', aria: 'Meta+5' },
  calendarCurrentBoardView: { mac: '⌘ ⌥ 2', other: 'Alt+Ctrl+2', aria: 'Alt+Meta+2' },
  thisWeekCurrentBoardView: { mac: '⌘ ⌥ 3', other: 'Alt+Ctrl+3', aria: 'Alt+Meta+3' },
  plannerDayCurrentBoardView: { mac: '⌘ ⌥ 4', other: 'Alt+Ctrl+4', aria: 'Alt+Meta+4' },
  plannerAgendaCurrentBoardView: { mac: '⌘ ⌥ 5', other: 'Alt+Ctrl+5', aria: 'Alt+Meta+5' },
  plannerToggle: { mac: '⌘ ⇧ P', other: 'Shift+Ctrl+P', aria: 'Shift+Meta+P' },
  focusSearch: { mac: '⌘ F', other: 'Ctrl F', aria: 'Meta+F' },
  switchBoard: { mac: '⌘ K', other: 'Ctrl K', aria: 'Meta+K' },
  boardSettings: { mac: '⌘ ,', other: 'Ctrl ,', aria: 'Meta+,' },
  toggleTheme: { mac: '⌘ ⇧ D', other: 'Shift+Ctrl+D', aria: 'Shift+Meta+D' },
  cycleColorScheme: { mac: '⌘ ⌃ ⇧ C', other: 'Alt+Shift+Ctrl+C', aria: 'Control+Shift+Meta+C' },
  moveCardLeft: { mac: '⌘ ⇧ [', other: 'Shift+Ctrl+[', aria: 'Shift+Meta+[' },
  moveCardRight: { mac: '⌘ ⇧ ]', other: 'Shift+Ctrl+]', aria: 'Shift+Meta+]' },
  archiveCard: { mac: '⌘ ⌥ ⇧ Backspace', other: 'Alt+Shift+Ctrl+Backspace', aria: 'Alt+Shift+Meta+Backspace' },
  archiveBrowser: { mac: '⌘ ⇧ A', other: 'Shift+Ctrl+A', aria: 'Shift+Meta+A' },
  closeModals: { mac: 'Escape', other: 'Escape', aria: 'Escape' },
};

function isMacPlatform(platform = typeof navigator === 'undefined' ? '' : navigator.platform) {
  return /Mac|iPhone|iPad|iPod/i.test(String(platform));
}

function getShortcutHintText(id, platform) {
  const shortcut = SHORTCUTS[id];
  if (!shortcut) return '';
  return isMacPlatform(platform) ? shortcut.mac : shortcut.other;
}

function getShortcutAriaKeyshortcuts(id) {
  return SHORTCUTS[id]?.aria || '';
}

function getShortcutKeycapText(id, platform) {
  const shortcut = SHORTCUTS[id];
  if (!shortcut) return '';
  return getShortcutHintText(id, platform).split(/\s*\+\s*|\s+/).filter(Boolean).join(' + ');
}

export { SHORTCUTS, isMacPlatform, getShortcutHintText, getShortcutKeycapText, getShortcutAriaKeyshortcuts };
