# Task 06 — Table view, bulk actions, and view switching

Depends on: Tasks 01–05. Side-build only; the Vue renderer must preserve the
legacy table DOM vocabulary and use the existing transactional bridge APIs.

## Scope

- Add a per-board workspace view store and accessible Kanban and Table dock
  controls. Keep Cmd/Ctrl+1 and Cmd/Ctrl+Option/Alt+1 aligned with the
  documented view shortcuts.
- Render Table rows from `readBoardSnapshot` data, with the legacy columns,
  board-order/timestamp/due/title sorts, existing search/date/label filters,
  list scope filters, timestamps, task/link metadata, and row/list controls.
- Port visible-card selection, shift-range selection, select-all/pruning, and
  bulk Archive, Move, Labels, and Dates actions. Mutations use the existing
  `archiveCard`, `moveCardToTop`, and `updateFrontmatter` bridge methods and
  reconcile the snapshot afterward.
- Add pure tests for table sort/filter/selection behavior, view-store state,
  and dock switching.

## Acceptance criteria

- Table view and dock controls preserve the legacy IDs/classes/roles and are
  reachable by keyboard.
- Table output is snapshot-based and existing board search/labels/date filters
  remain combined with the table list scope.
- Selection and bulk actions are explicit, deterministic, and reconciled after
  every successful mutation; no renderer-side filesystem reorder loop is added.
- The workspace dock exposes only supported Kanban and Table views.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build-only` — passed.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (10 files,
  23 tests).
- Focused legacy tests — passed: task-list parser, board snapshot, board card
  metadata, card timestamps, card ordering, and archive.
- `git diff --check` — passed.
- `npm run test:board-views` — known unrelated baseline failure at
  `scripts/test-board-views.js:638`, the existing add-list shortcut-hint
  assertion in modified `app/lists/listActionsPopover.js`.
- `npm run test:playwright:vue` — not green in this environment because
  Electron aborts with SIGABRT during launch before page interaction; no Vue
  E2E rows are claimed.
