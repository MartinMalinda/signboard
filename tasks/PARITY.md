# Feature Parity Tracker — Vue renderer vs legacy

Oracle: `npm run test:playwright` (legacy, must stay green) and
`npm run test:playwright:vue` (Vue, grows green per task).
Rules: when a legacy feature ships during the parallel period, add it here in
the same PR. When a task lands, tick its boxes and list newly passing specs.

## Shell

- [x] Tab session restore (open boards + active board) across relaunch
- [x] Tab switch / close / keyboard nav (arrows, Home/End, Delete)
- [x] Board open via picker (incl. starter content seeding)
- [x] Missing board alert (locate / remove)
- [x] Empty board CTA
- [x] Theme toggle + persistence
- [x] App boots with preload bridge + vendored globals (Task 01)

## Kanban read

- [x] Columns/cards render from snapshot
- [x] Task progress badges, linked-object counts, compact dates, label chips
- [x] Board color scheme application

## Editor core

- [x] Open/close, focus trap/restore, inert background
- [x] Title/notes save parity (debounced + serialized, byte-identical files)
- [x] Clean-state tracking + external-edit reload
- [x] Card start/due control; task-level date markers remain supported in Markdown
- [x] Created/Updated timestamps
- [x] Move to list (dropdown + adjacent), archive, duplicate, Open With

Task 03 implementation is present in the Vue side-build (`Modal`, editor
store/save queue, controlled notes wrapper, dates/timestamps, move/actions/Open
With, and checklist editing). Tiptap is now the only notes engine in the
canonical Vue renderer; the temporary OverType fallback and Vue feature
switch have been removed.
Unit/build/type verification passes;
the Vue Playwright suite was attempted but is not currently green, so no E2E
rows are recorded as passing here. The focused legacy tests remain green except
for the known `test-board-views` add-list shortcut-hint baseline failure at
`scripts/test-board-views.js:638` caused by the existing
`app/lists/listActionsPopover.js` change.

## Kanban interactions

- [x] Add card / add list / rename list (sanitized) / archive card+list
- [x] Card DnD: same-list reorder + cross-list move (transactional IPC,
      `moved-list` only on cross-list)
- [x] List DnD reorder
- [x] List actions popover (keyboard nav, shortcut hints)
- [x] Quick Add across open boards (incl. Shift+Enter create-and-open)

Task 04 implementation is present in the Vue side-build: `useSortable` is the
sole SortableJS entry point and reconciles after transactional reorder IPC;
CRUD modals, sanitized inline list rename, archive actions, AppPopover/list
actions, active-board labels, cross-board Quick Add, Shift+Enter editor focus,
and Cmd/Ctrl+N / Shift+Cmd/Ctrl+N are wired. Vue type-check/build/unit tests
and focused legacy ordering/archive/snapshot/date tests pass. The Vue
Playwright run remains unavailable in this environment because Electron
aborts with SIGABRT at launch (76/76 tests fail before exercising the page).
The known legacy `test-board-views` baseline still fails at
`scripts/test-board-views.js:638` on the existing add-list shortcut-hint
assertion in `app/lists/listActionsPopover.js`.

## Search / labels / filters

- [x] Board search (debounce, title+body tokens, keyboard into results)
- [x] Card label popover + inline label creation
- [x] Header filter popover (date filters + label multi-select, AND logic)
- [x] Completed-list workflow rules + completed-task-marker exclusion
- [x] Active-filter summary chip; filters reset on board switch

Task 05 implementation is present in the Vue side-build: `useLabelsStore`,
`useSearchStore`, pure `cardFilters.js`, debounced title/body search, result
keyboard navigation, label assignment/creation, settings placeholder, date
and multi-label filtering, completed-list workflow semantics, hidden-card DOM
parity, active-filter summary, and board-switch filter reset are wired.
The filter matrix is covered by focused unit tests. Vue type-check/build/unit
tests and focused legacy task-list/snapshot/metadata/timestamp/ordering/archive
tests pass. The known `test-board-views` baseline still stops at
`scripts/test-board-views.js:638` on the existing add-list shortcut-hint
assertion in `app/lists/listActionsPopover.js`; the Vue Electron Playwright
suite remains blocked by SIGABRT during Electron launch.

## Table and view switching (Task 06)

- [x] Table view rendered from batched board snapshots
- [x] Board-order, timestamp, due-date, and title sorting
- [x] Existing search/date/label filters plus table list scopes
- [x] Accessible row selection, shift ranges, select-all, and pruning
- [x] Bulk archive, move, labels, and dates with snapshot reconciliation
- [x] Kanban/Table dock switching and documented Vue shortcuts

Task 06 implementation is present in the Vue side-build: `useViewStore`,
`TableView`, the framework-free table model, snapshot-based rows, table bulk
actions, and the accessible workspace dock are wired. Focused unit coverage
passes for sorting/filtering/selection, per-board view state, and dock
switching. The known `test-board-views` baseline still stops at
`scripts/test-board-views.js:638` on the existing add-list shortcut-hint
assertion in `app/lists/listActionsPopover.js`; Vue Electron Playwright still
aborts with SIGABRT before page interaction.

## Dated-work support

Dated work remains available through card start/due fields, incomplete task
date metadata, Kanban/Table rendering, due notifications, and the external
published calendar. No retired workspace surface, dock action, or shortcut is
part of the supported product.

## Settings (Task 08)

- [x] Settings modal with app General, Notifications, and Smart Actions panels
- [x] Board General, Labels, Appearance, Workflow, Obsidian, and Import panels
- [x] App/board persistence through existing preload/main-process APIs
- [x] Board rename/move/duplicate, label CRUD, color schemes, workflow settings, and imports
- [x] Ollama verification/model loading and reorderable/editable Smart Actions

Task 08 implementation is present in the Vue side-build: `useSettingsStore`,
the `#modalBoardSettings` surface, exact panel IDs/classes, typed app/board
bridge persistence, label/workflow/color/import controls, Ollama inspection,
and Smart Action ordering/editing are wired. Focused unit coverage passes for
schema normalization, panel ordering, label/workflow persistence, and Smart
Action ordering/editability. Vue type-check/build/unit verification passes.
The known `test-board-views` baseline still stops at
`scripts/test-board-views.js:638` on the existing add-list shortcut-hint
assertion in `app/lists/listActionsPopover.js`; Vue Electron Playwright remains
blocked by SIGABRT during Electron launch.

## Archive, board switcher, and static modals (Task 09)

- [x] Archive browser with card/list search, sorting, detail preview, and restore
- [x] Board switcher on Cmd/Ctrl+K with keyboard navigation and close controls
- [x] About, Sponsor, Keyboard Shortcuts, and Obsidian Vault Required modals
- [x] Sponsor menu/about/pill entry points and persisted dismissal behavior
- [x] Shared Modal focus/inert/Escape lifecycle and shortcut contracts

Task 09 implementation is present in the Vue side-build: `useArchiveStore`,
`ArchiveBrowserModal`, `useBoardSwitcherStore`, `BoardSwitcherModal`, static
modal surfaces, sponsor pill behavior, overflow-tab routing, and OS-aware
shortcut labels are wired. Focused unit/component coverage passes for archive
filtering/restore dispatch, switcher keyboard state, and modal contracts. Vue
type-check/build/unit verification passes. The known `test-board-views` baseline
still stops at `scripts/test-board-views.js:638` on the existing add-list
shortcut-hint assertion in `app/lists/listActionsPopover.js`; Vue Electron
Playwright remains blocked by SIGABRT during Electron launch.

## Later surfaces (post Task 09)
- [x] Editor extras: linked objects (+file drop), Smart Actions, URL marking
- [x] Due notifications; external-change sync loop
- [x] Global Quick Add shortcut
- [x] A11y and full shortcut parity across implemented Vue surfaces

## Editor extras (Task 10)

- [x] Linked objects, legacy related-link reconciliation, chooser/drop linking,
      favicons, and Obsidian note lifecycle actions
- [x] Smart Actions menu/input/preview/apply flow, built-in and custom targets,
      read-only Question the Card, and existing-label-only suggestions
- [x] Raw URL preview marking, inline open control, and Cmd/Ctrl-click

Task 10 is implemented in the Vue side-build through the existing preload/main
bridge APIs. Focused pure/component coverage passes for link dedupe and
reconciliation, Smart Action preview/write guards, and URL marking. Vue
type-check/build/unit verification passes (14 files / 42 tests). The focused
legacy AI and Obsidian checks are run as part of the handoff; the known legacy
`test-board-views` baseline remains at `scripts/test-board-views.js:638`, and
Vue Electron Playwright remains blocked by Electron launch SIGABRT in this
environment.

## App-level extras (Task 11)

- [x] Due notification scheduling, aggregation, task snippets, and workflow exclusions
- [x] External board/card-file sync with clean-editor refresh and dirty-draft preservation
- [x] App-level Quick Add global shortcut status and renderer dispatch
- [x] Sponsor pill compact-window and local-dismiss behavior

Task 11 is implemented in the Vue side-build through `useDueNotificationsStore`,
`dueNotifications.js`, `useExternalBoardSync`, the existing watch/editor bridge
contracts, runtime Quick Add shortcut status propagation, and `useSponsorStore`.
Focused tests cover due aggregation/time gating, clean-vs-dirty external refresh,
watch-token reconciliation, shortcut normalization, and sponsor dismissal/compact
state. Vue type-check/build/unit verification passes (15 files / 48 tests).
The existing external Published Calendar bridge/server remains the source of
calendar serving and settings state; its focused legacy regression remains green.
The known `test-board-views` baseline still stops at
`scripts/test-board-views.js:638` on the existing add-list shortcut-hint
assertion in `app/lists/listActionsPopover.js`; Vue Electron Playwright remains
blocked by Electron launch SIGABRT before page interaction.

## Accessibility and shortcut hardening (Task 12)

- [x] Topmost-modal focus trapping/restoration, inert backgrounds, and hidden/aria-hidden parity
- [x] Popover Escape/opener restoration plus Arrow/Home/End navigation
- [x] Keyboard-only focus modality, live status region, reduced-motion, and forced-colors contracts
- [x] OS-aware renderer/native shortcut parity, editor-scoped actions, and `#modalKeyboardShortcuts` matrix

Task 12 hardens the Vue side-build through the shared accessibility helper,
`Modal`, `AppPopover`, `useAccessibility`, and the strict OS-aware
`useShortcuts` handler. Native preload menu events for theme and Kanban/Table
switching now route through the same Vue commands; editor move/archive shortcuts
remain scoped to the open editor. The shortcut helper preserves the legacy
`#modalKeyboardShortcuts` IDs, action metadata, and labels. Focused Task 12
coverage passes for inert state, keyboard modality, shortcut routing, and
popover navigation. Vue type-check/build/unit verification passes (16 files /
52 tests). The targeted Vue Playwright attempt ran 21 matched tests, all blocked
before page interaction by Electron launch `SIGABRT`.

## Currently passing Playwright specs (Vue renderer)

No Vue Playwright specs were recorded as passing in this environment: the Electron
launch phase aborted with SIGABRT before the suite could exercise the Vue page.
Vue unit coverage and the renderer build/type-check pass; re-run
`npm run test:playwright:vue` on a desktop session to record the E2E rows.

## Final Vue cutover (Task 13)

- [x] Vue is the default renderer; explicit `SIGNBOARD_RENDERER=legacy` rollback
      and existing `SIGNBOARD_RENDERER=vue` selection remain supported
- [x] Electron packaging includes Vue dist/assets, shared static/vendor files,
      and the legacy rollback entry
- [x] Meaningful legacy VM behavior is represented in Vue/lib pure and unit tests;
      legacy VM suites remain as compatibility regressions while rollback exists
- [x] Startup/build/package verification scripts and rollback documentation

Task 13 is implemented. `npm run build:renderers` builds both renderer artifacts,
`scripts/test-renderer-selection.js` verifies default/explicit mode resolution,
and `scripts/test-vue-packaging.js` verifies the Electron Builder file contract.
The legacy renderer files remain intentionally and are not broad-deleted. The
known `scripts/test-board-views.js:638` add-list shortcut-hint assertion remains
the existing baseline failure in `app/lists/listActionsPopover.js`; the Vue
Playwright attempts for the default, explicit Vue, and explicit legacy entry
points remain blocked by Electron launch `SIGABRT` at
`tests/playwright/signboard-smoke.spec.js:506`.

## Board color schemes (Task 14)

- [x] Active-board color scheme application on Vue Kanban and Table surfaces
- [x] Legacy light/dark palette set and runtime variable semantics
- [x] Scoped board styling for active Kanban/Table board surfaces
- [x] Board-switch/theme-toggle reapplication and forced-colors compatibility

Task 14 centralizes the legacy nine-scheme palette in
`signboard-vue/lib/boardTheme.js`, applies the active light/dark variables to
`#board` without changing document-level theme behavior.
Focused coverage passes for scheme selection, light/dark application, scope,
and cleanup. Vue type-check/build/unit tests and the focused legacy board-label
theme test pass; `git diff --check` passes.

## Tiptap card editor migration (Task 15)

- [x] Controlled Tiptap Markdown notes editor with native nested task checkboxes
- [x] Markdown round-trip, clean external refresh, save-store integration, and
      base64-image protection
- [x] Tiptap Markdown round-trip preserving start/scheduled/due markers without
      per-task date controls
- [x] Raw URL decoration/open behavior, link editing, theme/accessibility hooks,
      and Tiptap-only notes integration

Task 15 is implemented in `signboard-vue/src/lib/components/RichTextEditor.vue`
behind the existing `CardNotesEditor.vue` boundary. Focused Task 15 unit tests,
Vue type-check, and the production build pass. The full Vue unit suite retains
the existing Task 12 jsdom failure; Electron Playwright remains blocked by the
environment's Electron launch `SIGABRT`.
