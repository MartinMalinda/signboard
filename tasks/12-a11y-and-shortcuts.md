# Task 12 — Accessibility and full shortcut parity

Depends on: Tasks 01–11. Side-build only; no unrelated legacy renderer files
were changed.

## Scope

The Vue side-build now hardens the implemented surfaces against the legacy
accessibility and shortcut contracts:

- `Modal` tracks the topmost open dialog, traps focus only in that dialog,
  restores opener focus, keeps `hidden`/`aria-hidden` synchronized, and restores
  inert state correctly when nested dialogs close.
- `AppPopover` supports controlled-close focus restoration, Escape, horizontal
  and vertical arrow navigation, and Home/End navigation while retaining
  `data-sb-modal-layer` and legacy IDs/classes.
- `useAccessibility` ports keyboard-only focus modality and keeps the existing
  reduced-motion/forced-colors CSS behavior applicable to Vue-rendered DOM.
  Status announcements continue through the shared `#signboardStatusRegion`.
- `useShortcuts` now uses strict OS-aware primary modifiers, handles native
  theme/view events, supported workspace view shortcuts, Quick Add/settings/
  archive/help, color-scheme cycling, and editor-scoped move/archive actions.
  `#modalKeyboardShortcuts` keeps the same action IDs and adds labelled section
  relationships for assistive technology.

## Shortcut parity matrix

| Action | macOS | Windows/Linux | Vue surface |
| --- | --- | --- | --- |
| Quick Add card | Cmd+N | Ctrl+N | Header, Quick Add modal, global shortcut bridge |
| Add list | Cmd+Shift+N | Ctrl+Shift+N | Add List modal |
| Focus search | Cmd+F | Ctrl+F | Board header search |
| Keyboard shortcuts | Cmd+/ | Ctrl+/ | `#modalKeyboardShortcuts` |
| Switch board | Cmd+K | Ctrl+K | Board switcher modal |
| Settings | Cmd+, | Ctrl+, | Settings modal |
| Kanban | Cmd+1 | Ctrl+1 | Workspace dock |
| Table | Cmd+Option+1 | Ctrl+Alt+1 | Workspace dock |
| Toggle theme | Cmd+Shift+D | Ctrl+Shift+D | Board menu/native View menu |
| Cycle color scheme | Cmd+Ctrl+Shift+C | Ctrl+Alt+Shift+C | Board settings/theme state |
| Move card left/right | Cmd+Shift+[/] | Ctrl+Shift+[/] | Open card editor |
| Archive active card | Cmd+Option+Shift+Backspace | Ctrl+Alt+Shift+Backspace | Open card editor |
| Open archive | Cmd+Shift+A | Ctrl+Shift+A | Archive browser |
| Close modal/popover | Escape | Escape | Shared modal/popover lifecycle |

## Verification

- `npm --prefix signboard-vue run test:unit -- --run src/__tests__/task12-a11y-and-shortcuts.spec.ts` — passed, 4 tests.
- `npm --prefix signboard-vue run test:unit -- --run` — passed, 16 files / 52 tests.
- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build` — passed; retains the existing Vite
  CommonJS `module` warning from `lib/appSettingsSchema.js`.
- Targeted `npm run test:playwright:vue -- --grep "shortcut|keyboard|modal" --reporter=line` — attempted 21 tests; all failed before interaction because Electron launch exited with `SIGABRT` at `tests/playwright/signboard-smoke.spec.js:506`.
- Focused legacy parity suites remain green from the prior task run; the known
  unrelated `npm run test:board-views` failure remains at
  `scripts/test-board-views.js:638` on the existing add-list shortcut-hint
  assertion in `app/lists/listActionsPopover.js`.
- `git diff --check` — passed.
