# Task 05 — Board search, labels, header filters

Depends on: Tasks 02–04.
Owner: **split** (see [DELEGATION.md](./DELEGATION.md)) — large model owns
store + filter evaluation; smaller model owns presentational popovers/chips.
Rules: [vue-styleguide.md](../vue-styleguide.md).

## Goal

Board search, label assignment/filtering, and the header date+label filter
popover reach parity with legacy `app/board/boardLabels.js` +
`app/board/boardSearch.js` semantics.

## In scope

### Large-model track (logic)

- `useLabelsStore` — board label definitions load/save via preload
  (`board-settings.md` semantics in `lib/boardLabels.js`), completed-list
  workflow settings read path (auto-detect names + manual overrides +
  ignored lists), filter state (temporary only — reset on board open/switch).
- Filter evaluation as a **pure module** `signboard-vue/lib/cardFilters.js`
  (unit-tested first):
  - date filters `Today` / `Overdue` / `Next 7/14/30 days` from card
    start/due + **incomplete** task markers only; completed task markers and
    completed-list cards never keep a card visible (card-level due dates on
    actionable lists still count),
  - multi-select label OR logic, AND-combined with date filter and search
    tokens,
  - search tokens match title + body.
- `useSearchStore` — query/tokens, debounced apply (match legacy debounce),
  keyboard navigation model (from search field into visible results, arrows,
  `Esc` back / clear).

### Smaller-model track (given the store APIs)

- `LabelFilterPopover.vue` — header filter UI on `AppPopover`: mutually
  exclusive date filter rows, multi-select label rows, icon-only toolbar
  button with accent-tinted active state, clearable active-filter summary
  chip beside search; arrow/`Home`/`End` nav + opener-focus restore.
- `CardLabelPopover.vue` — per-card label assignment, **inline label
  creation**, gear shortcut → board Labels settings (settings panel itself is
  a later task; gear opens a placeholder modal noting that).
- `LabelChips.vue` upgrades on `CardItem` (click opens `CardLabelPopover`).
- Search input in `AppHeader` replaces Task 02 inert state.

## Out of scope

- Labels settings panel editing (Settings task), Table-view filtering (Table
  task — design `cardFilters.js` so it serves all board views).
- Workflow settings editing (read-only use here).

## Steps

1. Port filter evaluation to `cardFilters.js` with unit tests covering the
   completed-marker/completed-list matrix — legacy tests
   (`scripts/test-board-views.js`, `test-board-card-metadata.js`) encode the
   expectations; mine them for cases even though the harness differs.
2. Stores + debounce; wire search → visible-cards getter.
3. Presentational components per specs above.
4. Keyboard-only pass: search → results → back; popover traversal; focus
   restoration.
5. Cross-check against legacy with one fixed board + fixed query set; visible
   card sets must be identical for every filter combination.
6. Update `tasks/PARITY.md`.

## Acceptance criteria

- Identical visible-card sets vs legacy across the filter/search matrix
  (document the matrix in the PR).
- Filter state resets on board switch/open; summary chip + button active
  state match legacy.
- `cardFilters.js` unit tests green; legacy Playwright suite untouched/green.

## Risks / notes

- The completed-task-marker rule is the most regressed behavior historically
  (per CODEX notes) — test it explicitly.
- Label writes go through the same preload API legacy uses; `board-settings.md`
  shape must stay byte-compatible (labels, workflow sections).

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build-only` — passed.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (7 files, 17 tests).
- Focused legacy tests — passed: task-list parser, board snapshot, board card
  metadata, card timestamps, card ordering, and archive.
- `git diff --check` — passed.
- Renderer smoke coverage — blocked by the environment's Electron launch failure.
  `scripts/test-board-views.js:638`, the existing add-list shortcut-hint
  assertion in modified `app/lists/listActionsPopover.js`.
- Vue Electron Playwright remains unavailable: Electron aborts with SIGABRT
  during launch before page interaction; no E2E rows are claimed.

The tested filter matrix covers: card start/due dates; incomplete task start/
due markers; completed-only and mixed completed/incomplete task markers;
completed-list exclusion only when a date filter is active; Today, Overdue,
Next 7/14/30; label OR; and AND-combination with title/body token search.
