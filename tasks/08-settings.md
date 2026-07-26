# Task 08 — Settings parity

Depends on: Tasks 01–07. Side-build only; the Vue renderer preserves the
legacy Settings DOM vocabulary and uses the existing preload/main-process APIs.

## Scope

- Port the Settings modal and exact nine-panel navigation: app General,
  Notifications, Smart Actions, and current-board General, Labels, Appearance,
  Workflow, Obsidian, and Import.
- Add a typed settings store with schema normalization, serialized app saves,
  board settings persistence, label CRUD/reference cleanup, color schemes,
  completed-list workflow controls, board rename/move/duplicate, Obsidian Base
  actions, and Trello/Obsidian/Tasks.md import entry points.
- Port Ollama URL verification/model loading and reorderable Smart Actions,
  including custom action label/target/prompt editing and built-in
  Quick Smart Action/Question the Card editability rules.
- Wire Board menu, Cmd/Ctrl + , and the card-label settings shortcut into the
  Vue Settings modal while preserving modal focus/inert behavior.

## Acceptance criteria

- `#modalBoardSettings`, navigation tab IDs, panel IDs, classes, roles, and
  focus/keyboard navigation remain compatible with the legacy Settings specs.
- App settings save through `electronAPI.updateAppSettings`; board settings,
  board operations, Obsidian actions, and imports use the existing bridge APIs.
- Schema defaults/normalization and built-in Smart Action prompts remain
  intact; Quick Smart Action and Question the Card remain non-editable,
  reorderable built-ins.
- Labels, workflow lists, color schemes, board operations, and import results
  are visible and persisted without modifying unrelated legacy renderer code.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build-only` — passed. Vite reports the
  existing CommonJS-variable-in-ESM warning from the copied schema module.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (12 files,
  32 tests).
- Focused legacy tests — passed: app settings, board labels, Obsidian
  importer, Tasks.md importer, Trello importer, and Obsidian integration.
- `git diff --check` — passed.
- `npm run test:board-views` — known unrelated baseline failure at
  `scripts/test-board-views.js:638`, the existing add-list shortcut-hint
  assertion in modified `app/lists/listActionsPopover.js`.
- Vue Electron Playwright remains blocked before page interaction because
  Electron aborts during launch with SIGABRT; no Vue E2E rows are claimed.
- `npm --prefix signboard-vue run lint` remains red on pre-existing copied
  module/test lint findings; this task does not broaden that cleanup scope.
