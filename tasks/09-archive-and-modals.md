# Task 09 — Archive, board switcher, and static modal parity

Depends on: Tasks 01–08. Side-build only; the Vue renderer keeps the legacy
archive, switcher, modal, shortcut, and sponsor DOM vocabulary.

## Scope

- Archive browser with card/list tabs, search, sorting, detail preview, and
  transactional card/list restore through the existing bridge APIs.
- Cmd/Ctrl+K board switcher across all open boards, keyboard navigation,
  close-board controls, overflow-tab entry, and opener-focus restoration.
- About, Sponsor, Keyboard Shortcuts, and Obsidian Vault Required surfaces,
  including sponsor pill dismissal/compact-window behavior and OS-aware labels.
- Shared Vue modal integration for focus trapping, Escape handling, inert
  background state, status-compatible controls, and native menu event entry.

## Acceptance criteria

- `#modalArchiveBrowser`, `#archiveBrowserSearchInput`, archive tabs/results,
  detail pane, restore controls, and archive bridge argument order remain
  compatible with the legacy specs.
- `#modalBoardSwitcher` keeps the combobox/listbox contract, searches all open
  boards, selects with arrows and Enter, closes boards, and restores focus.
- `#modalAboutSignboard`, `#modalCommercialLicense`,
  `#modalKeyboardShortcuts`, and `#modalObsidianVaultRequired` preserve their
  IDs/classes/roles and use the shared Vue modal lifecycle.
- Sponsor entry points from the Board menu, About modal, and fixed pill work;
  dismissal persists and compact windows hide the pill through existing CSS.
- Focused unit/component coverage exercises archive filtering/restore dispatch,
  board-switcher keyboard state, and static modal/shortcut contracts.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build-only` — passed. Vite reports the
  existing CommonJS-variable-in-ESM warning from the copied schema module.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (13 files,
  37 tests).
- Focused legacy checks — passed: `npm run test:archive`, board labels, and
  app settings.
- `git diff --check` — passed.
- `npm run test:board-views` — known unrelated baseline failure at
  `scripts/test-board-views.js:638`, the existing add-list shortcut-hint
  assertion in modified `app/lists/listActionsPopover.js`.
- Vue Electron Playwright was not claimed as passing; the environment’s
  Electron launch remains blocked by SIGABRT before page interaction.
