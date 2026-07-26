# Task 07 — Planner parity

Depends on: Tasks 01–06. Side-build only; the Vue renderer preserves the
legacy Planner DOM vocabulary and uses snapshot data plus the existing bridge.

## Scope

- Add Planner state for Calendar, This Week, Day, and Agenda cursors, board
  scope, selected boards, search, date filters, labels, and completed-card
  visibility.
- Build snapshot-backed Planner views with card/list/board context, source
  board color treatment, incomplete task/card temporal dates, and the legacy
  IDs/classes/roles.
- Wire workspace dock and Planner shortcuts, Planner date drag persistence,
  and cross-board card opening that activates the source board before the
  normal editor.
- Add focused pure/store tests for date bucketing, filter composition,
  completed-list/task-marker semantics, and cross-board opening.

## Acceptance criteria

- Planner opens from the workspace dock and documented shortcuts; each view
  preserves the legacy Planner structure and keyboard/focus affordances.
- All-open-board, current-board, and selected-board scopes combine correctly
  with search, date, label, and completed-card filters.
- Only card dates and incomplete task dates produce actionable placements;
  completed lists remain hidden unless explicitly shown.
- Planner cards show source board/list context and open the normal editor on the
  correct active board, including cross-board opens.
- Date drops use the existing card/task bridge writes and refresh Planner data.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build-only` — passed.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (11 files,
  26 tests).
- Focused legacy tests — passed: task-list parser, board snapshot, board card
  metadata, card timestamps, timestamp format, archive, card ordering, board
  labels, and due notifications.
- `git diff --check` — passed.
- `npm run test:board-views` — known unrelated baseline failure at
  `scripts/test-board-views.js:638`, the existing add-list shortcut-hint
  assertion in modified `app/lists/listActionsPopover.js`.
- Focused `npm run test:playwright:vue -- tests/playwright/signboard-smoke.spec.js
  -g "opens Planner across currently open boards" --reporter=line` — blocked
  before page interaction because Electron aborts at launch with SIGABRT
  (`electron.launch`, `tests/playwright/signboard-smoke.spec.js:506`). No Vue
  E2E rows are claimed.
