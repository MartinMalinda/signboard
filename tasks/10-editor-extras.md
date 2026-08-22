# Task 10 — Editor extras parity

## Scope

The Vue side-build now includes the card editor’s linked-object, Smart Action,
raw URL, and Obsidian-aware extras while keeping Task 03’s serialized editor
save queue and Task 09’s modal/accessibility primitives intact.

- `LinkedObjectsPanel` / `LinkedObjectChip` reconcile structured
  `linked_objects` with legacy `related` wikilinks and URLs, support file and
  folder pickers, web/app/Signboard URLs, cached favicons, Obsidian note
  create/open/recreate/relink/remove, and preload-backed file drops.
- `SmartActionsButton`, `SmartActionsPopover`, and `SmartActionPreview` call
  the existing `runSmartCardAction` bridge and only mutate the editor after an
  explicit Apply action. Question the Card stays read-only; custom content is
  appended; suggested labels are restricted to existing board labels.
- OverType preview decoration marks raw `http(s)`/`www` URLs and adds an inline
  open control plus Cmd/Ctrl-click handling without changing Markdown source.
- Existing Open With and settings Obsidian/Base entry points surface the vault
  required modal for native `NOT_IN_OBSIDIAN_VAULT` results.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build` — passed; retains the existing
  CommonJS `module` warning from `lib/appSettingsSchema.js`.
- `npm --prefix signboard-vue run test:unit -- --run` — passed, 14 files / 42
  tests, including five focused Task 10 tests.
- `npm run test:ai-task-suggestions`, `npm run test:obsidian-integration`, and
  the canonical Vue unit suite — passed.
- Renderer smoke coverage remains blocked by the environment's Electron launch failure.
  `scripts/test-board-views.js:638` on the existing add-list shortcut-hint
  assertion in `app/lists/listActionsPopover.js`.
- Vue Electron Playwright remains limited by the environment’s Electron
  launch `SIGABRT` before page interaction; no E2E pass is claimed here.
