# Delegation Guide — who executes what

Two execution tiers:

- **Kimi K3 (large)** — architecture, parity-critical ports, subtle
  interaction/a11y behavior, anything where a silent behavioral drift ships.
- **Smaller model** — mechanical, presentational, well-specified work that the
  task files pin down precisely (exact files, exact acceptance criteria).

General rules for smaller-model runs:

1. Hand the subagent the task file + `vue-styleguide.md` + the specific legacy
   source files named in the task. Nothing else; keep context narrow.
2. The task file's acceptance criteria are the contract — the subagent must run
   them and paste results.
3. Large model reviews diffs for the parity-sensitive areas listed below before
   merging. Presentational-only diffs get a light review.
4. Subagents never edit legacy `app/**` (side-build strategy) except the single
   `main.js` loader branch in Task 01.

## Per-task assignment

### Task 01 — Vue scaffold → **smaller model** (with large-model review)
- Mechanical: deps, Vite config, scripts, `.gitignore`, `app-vue/index.html`.
- Review points (large): the `main.js` loader branch (only legacy-side edit),
  CSP meta copied verbatim, runtime-only Vue alias, Playwright env passthrough.
- Escalate if `file://` asset loading or preload availability misbehaves —
  that's debugging, not assembly.

### Task 02 — Shell + read-only Kanban → **split**
- Smaller model: pure-lib ESM copies (`app-vue/lib/*`), `FeatherIcon`,
  `EmptyBoardCta`, `AddListPhantom`, `AppHeader` static layout,
  `WorkspaceViewDock` static.
- Large model: `useBoardsStore`/`useBoardDataStore` (session semantics are
  byte-compat-critical), board-open/starter-content port (diff folders),
  missing-board flow, `BoardTabs` keyboard behavior.
- Why split: components are verifiable by screenshot; stores can drift
  silently and corrupt shared `localStorage` state for the legacy app.

### Task 03 — Card editor core → **large model**
- Hardest task in the migration: OverType wrapper lifecycle, debounced +
  serialized saves, clean-state/external-edit reconciliation, `AppModal`
  focus-trap port, task-line date controls from measured textarea coordinates.
- Smaller model may take: `CardTimestamps`, `OpenWithMenu`, footer action
  buttons — self-contained leaf pieces once the shell exists.

### Task 04 — Kanban interactions → **split**
- Large model: `useSortable` composable + drag tilt/ghost parity + the
  transactional reorder IPC wiring (`reorderCardsInList`/`reorderLists`,
  `moved-list` lifecycle semantics). DnD regressions are user-visible data
  bugs, not visual ones.
- Smaller model: Add/Quick-Add/Add-List modals, list rename, archive buttons,
  `ListActionsPopover` on `AppPopover` (keyboard spec is enumerated in the
  task file — mechanical to follow).

### Task 05 — Search/labels/filters → **split**
- Large model: `useLabelsStore` + filter evaluation logic (date filters,
  AND-combination, completed-list workflow rules — edge-case-dense, mirrors
  `boardLabels.js` semantics that tests assert on).
- Smaller model: `LabelChips`, popover layouts, active-filter summary chip,
  debounced search input wiring given the store API.

## Cheap-to-delegate anytime

- `tasks/PARITY.md` upkeep after each run (tick boxes, list newly passing
  Playwright specs).
- Playwright runs (both renderers) + result summaries.
- Screenshot spot-checks (Vue vs legacy, same board) with diffs reported.
- Fixture boards for manual testing.
