# Vue.js Migration Plan

Status: **complete** — the Vue side-build has reached parity and is now the
default renderer. The legacy renderer remains available only through the
explicit `SIGNBOARD_RENDERER=legacy` rollback/testing boundary.

> Scope: the migration promotes `signboard-vue/` to the normal renderer while
> retaining the legacy renderer source and bundle as a compatibility boundary.
> Both renderers continue to use the same main/preload bridge and packaged
> builds include both entry points.
>
> Coding rules: [vue-styleguide.md](./vue-styleguide.md).
> Executable task plans: [tasks/](./tasks/) ·
> [01 scaffold](./tasks/01-vue-scaffold.md) ·
> [02 shell + board data](./tasks/02-shell-and-board-data.md) ·
> [03 card editor core](./tasks/03-card-editor-core.md) ·
> [04 Kanban interactions](./tasks/04-kanban-interactions.md) ·
> [05 search/labels/filters](./tasks/05-search-labels-filters.md) ·
> [delegation guide](./tasks/DELEGATION.md)

## 1. Current State Assessment

### Scale

| Area | Size | Notes |
|---|---|---|
| Renderer source (`app/**`) | ~26,500 lines, 36 modules | Concatenated into `app/signboard.js` |
| Static shell (`index.html`) | 752 lines | Modals, popovers, dock, Planner overlay markup |
| Styles (`static/styles.css`) | 6,402 lines | Reused as-is by the Vue renderer |
| DOM-building call sites | ~700 | `createElement` / `innerHTML` / `appendChild` / `replaceChildren` |
| Direct DOM lookups | 403 | `getElementById` / `querySelector` |
| Playwright suite | 3,660 lines | Becomes the **parity oracle** (runs against both renderers) |
| Node unit suites | several | Load legacy renderer sources via `vm.runInContext` + mock DOM |

### Biggest modules (porting hotspots)

1. `app/modals/toggleEditCardModal.js` — 5.4k lines, 271 DOM calls
2. `app/board/boardLabels.js` — 4.1k lines
3. `app/board/plannerView.js` — 2.1k lines
4. `app/board/boardViews.js` — 1.7k lines
5. `app/board/tableView.js` — 1.5k lines
6. `app/board/archiveBrowser.js` — 1.5k lines

### Legacy architecture (what we're replacing)

- No module system — `buildjs.sh` concatenates; everything is a global;
  487 defensive `typeof fn === 'function'` guards hide the dependency graph.
- State in ~12 `window.__*` singletons + `window.boardRoot` + `localStorage`.
- Full-DOM rebuild per change with manual Sortable teardown, global
  `feather.replace()` scans, and render-request-ID race guards.
- Imperative vendored libs: SortableJS, OverType, FDatepicker, Feather,
  Marked, Turndown.

## 2. Compatibility Findings

- **CSP is compatible** with precompiled SFCs (runtime-only Vue build);
  `script-src 'self'` stays, no `unsafe-eval`.
- **Electron sandbox is compatible.** The preload bridge
  (`window.board` / `window.chooser` / `window.electronAPI`) is exposed to
  whatever HTML the window loads — this is what makes the side-build possible
  with zero main-process API changes.
- **The renderer already renders from plain snapshot data**
  (`readBoardSnapshot`) — exactly the prop/state shape Vue wants.
- **Vendored libs can be reused verbatim** via script tags in the Vue entry
  (same builds, same globals) — no repackaging risk.
- **Shared `localStorage`** across both renderers (`file://` origin): session
  state compatibility is free if the Vue app honors the exact legacy key
  semantics.

## 3. Strategy: Parallel Side-Build

Build a complete, standalone Vue renderer in `signboard-vue/` until it reaches
feature parity, then cut over. **No islands injected into the legacy app, no
bridge hooks, no double ownership of DOM.** Chosen over strangler-fig because
islands would need re-integration work later and would entangle the two
architectures for the whole migration.

### How it worked during the parallel period

- `signboard-vue/` is a self-contained Vite + Vue 3 + Pinia app with its own
  `index.html`, composing the **real** application from day one — no
  throwaway integration code.
- `main.js` selected the Vue entry only for `SIGNBOARD_RENDERER=vue` while the
  default remained legacy.
- Both renderers talk to main **only** through the existing preload bridge.
- The legacy app keeps evolving normally (bug fixes land there); the Vue app
  tracks parity via the checklist in §9. New legacy features during the
  parallel period must be noted in `tasks/PARITY.md` as they ship.
- The 3,660-line Playwright suite runs against **either** renderer
  (`test:playwright` legacy, `test:playwright:vue` Vue) — it is the
  objective parity oracle.

### Cutover (completed in Task 13)

1. Vue is the default for normal launches; `SIGNBOARD_RENDERER=vue` remains an
   accepted explicit value.
2. `SIGNBOARD_RENDERER=legacy` selects the old `index.html` renderer for
   rollback and diagnostics.
3. Packaging includes `signboard-vue/dist/**`, shared `static/**` assets and
   vendored libraries, plus the legacy files required by rollback. The
   `test:vue-packaging` check verifies this contract.
4. Meaningful pure behavior from the former VM suites is covered by the
   `signboard-vue/lib` and Vue unit suites. The VM suites remain as legacy
   compatibility regressions while the rollback boundary is supported; they
   are not silently removed.
5. Agent and release-facing documentation describes the default and rollback
   paths. See `tasks/13-cutover.md` for the final verification record.

### Trade-offs accepted

- No incremental user-facing value until cutover (all-or-nothing ship).
- Feature drift risk during the parallel period — mitigated by the parity
  checklist + dual-renderer Playwright runs.
- Pure-logic modules are duplicated during the parallel period
  (`signboard-vue/lib/*` copies); fixes must land in both until cutover.

## 4. Hard Parts / Risks

1. **`toggleEditCardModal.js` port** — editor, OverType integration, debounced
   serialized saves, clean-state/external-edit reconciliation, measured
   textarea-coordinate task controls. ~30–40% of total effort (Task 03 +
   a later "editor extras" task for linked objects/Smart Actions).
2. **Hidden behavior in the implicit call graph** — the 487 `typeof` guards
   and concatenation order hide ordering dependencies; porting requires
   reading legacy flows carefully. The Vue app replaces this with explicit
   imports/stores — a strict improvement, but discovery takes time.
3. **A11y parity** — focus traps, inert backgrounds, live regions, keyboard
   navigation models must be re-created faithfully (`Modal`/`AppPopover`),
   not approximated.
4. **`vm`-based Node suites** die with the legacy bundle at cutover — their
   encoded expectations must be mined into new unit/component tests first.
5. **DOM contract discipline** — the Playwright oracle only works if the Vue
   renderer preserves legacy IDs/classes/roles per surface; intentional
   markup changes must update specs in the same PR.
6. **Feature drift during parallel period** — see §3; the checklist is the
   control.

## 5. Proposed Component Architecture

Vue 3 + SFCs + Pinia, built with Vite. Components compose the standalone app
in `signboard-vue/src/`; the right column shows the legacy module each replaces.

### 5.1 App shell

| Component | Replaces / source |
|---|---|
| `App.vue` | Root; header, board, dock, overlays, modal layer |
| `AppHeader.vue` | `<header>` in `index.html`; parts of `app/init.js` |
| `BoardName.vue` | `#boardName` updates in `renderBoard.js` |
| `BoardSearchInput.vue` | `app/board/boardSearch.js` |
| `BoardMenu.vue` | `#boardMenuPopover` + wiring in `app/init.js`, `app/ui/theme.js` |
| `BoardTabs.vue` + `BoardTab.vue` | `app/board/boardTabs.js` (incl. `N more` overflow) |
| `WorkspaceViewDock.vue` | `#workspaceViewDock` + dock state in `boardViews.js` |
| `SponsorPill.vue` | `#sponsorSignboardPill` markup + wiring |
| `QuickAddButton.vue` | `#quickAddHeaderButton` |

### 5.2 Board views

| Component | Replaces / source |
|---|---|
| `BoardView.vue` | `app/board/renderBoard.js` (dispatch, missing-board) |
| `KanbanBoard.vue` | Kanban branch of `renderBoard.js` |
| `ListColumn.vue` / `ListColumnHeader.vue` | `app/lists/createListElement.js` |
| `CardItem.vue` | `app/cards/createCardElement.js` (shared Kanban/Table/Planner) |
| `CardBadges.vue` | `app/utilities/taskList.js` + `linkedObjects.js` badges |
| `CardDatesControl.vue` | Compact start/due control in `createCardElement.js` |
| `LabelChips.vue` | Label chip rendering |
| `AddListPhantom.vue` / `EmptyBoardCta.vue` / `MissingBoardAlert.vue` | `renderBoard.js` |
| `TableView.vue` / `TableRow.vue` / `TableBulkActions.vue` / `TableSortControls.vue` | `app/board/tableView.js` |

### 5.3 Planner

| Component | Replaces / source |
|---|---|
| `PlannerOverlay.vue` / `PlannerHeader.vue` | `#plannerOverlay` + `app/board/plannerView.js` |
| `PlannerCalendar.vue` / `PlannerWeek.vue` / `PlannerDay.vue` / `PlannerAgenda.vue` | `plannerView.js` + `boardViews.js` helpers |
| `PlannerFilterPopover.vue` | `#plannerFilterPopover` |
| `TemporalCard.vue` | Temporal cards in `boardViews.js` |

### 5.4 Card editor (decomposition of `toggleEditCardModal.js`)

`EditCardModal.vue` (lifecycle, save orchestration) · `CardTitleField.vue` ·
`CardNotesEditor.vue` (OverType wrapper) · `CardDatesPopover.vue` ·
`TaskLineDateControls.vue` (measured coordinates) · `CardLabelsPicker.vue` ·
`LinkedObjectsPanel.vue` + `LinkedObjectChip.vue` ·
`SmartActionsButton.vue` + `SmartActionsPopover.vue` + `SmartActionPreview.vue` ·
`CardMoveControls.vue` · `OpenWithMenu.vue` · `CardTimestamps.vue` ·
`CardEditorActions.vue`.

### 5.5 Other modals

`Modal.vue` (base: positioning, focus trap, inert, Esc — wraps
`app/utilities/accessibility.js`) · `QuickAddCardModal.vue` ·
`AddListModal.vue` · `AddCardToListModal.vue` · `SettingsModal.vue` +
`SettingsAppGeneral.vue` / `SettingsNotifications.vue` /
`SettingsSmartActions.vue` / `SettingsBoardGeneral.vue` /
`SettingsBoardLabels.vue` / `SettingsBoardAppearance.vue` /
`SettingsBoardWorkflow.vue` / `SettingsBoardObsidian.vue` /
`SettingsBoardImport.vue` · `KeyboardShortcutsModal.vue` ·
`AboutModal.vue` / `SponsorModal.vue` · `ObsidianVaultRequiredModal.vue` ·
`ArchiveBrowserModal.vue` + `ArchiveResultList.vue` + `ArchiveDetailPane.vue` ·
`BoardSwitcherModal.vue`.

### 5.6 Popovers & primitives

`AppPopover.vue` (anchored; Esc/arrows/`Home`/`End`; opener-focus restore) ·
`LabelFilterPopover.vue` · `ListActionsPopover.vue` · `DateField.vue`
(FDatepicker wrapper) · `FeatherIcon.vue` (all `feather.replace()` sites) ·
tooltip: keep the legacy delegation engine initially (works for Vue DOM);
revisit as a directive later.

### 5.7 Stores & composables

| Store / composable | Absorbs |
|---|---|
| `useBoardsStore` | Open/active boards, `window.boardRoot`, localStorage session, `open-boards.json` sync |
| `useBoardDataStore` | Snapshot loading, render races, external-change refresh |
| `useLabelsStore` | `__boardLabelState`, filter state, workflow settings |
| `useSearchStore` | `__boardSearchState` |
| `useViewStore` | `__boardViewState`, dock state |
| `usePlannerStore` | `__plannerViewState` |
| `useTableStore` | `__boardTableState` |
| `useAppSettingsStore` | `__signboardAppSettingsState` |
| `useEditorStore` | Open-card editor state, dirty/clean tracking |
| `useArchiveStore` | `__archiveBrowserState` |
| `useUiStore` | Theme, modal stack, active popover, live announcements |
| `useSortable()` / `useDatepicker()` / `useNativeMenuSettle()` / `useShortcuts()` | SortableJS, FDatepicker, macOS settle defer, shortcut registry |

Pure logic (`taskList`, `dueNotifications`, `cardTimestamps`,
`linkedObjects`, `santizeFileName`, `appSettingsSchema`) → ESM copies under
`signboard-vue/lib/`, framework-free and unit-testable; they become canonical at
cutover.

## 6. Phased Plan (side-build)

Executed tasks: **[tasks/01–05](./tasks/)** cover the spine:

1. **01** — Scaffold: standalone Vue renderer behind `SIGNBOARD_RENDERER=vue`,
   Playwright dual-renderer harness, `tasks/PARITY.md` created.
2. **02** — App shell + session restore + board open + **read-only Kanban**.
3. **03** — **Card editor core** (Modal, OverType wrapper, save queue,
   dates, moves, archive/duplicate, Open With, task-line date controls).
4. **04** — Kanban interactions: card/list CRUD, drag/drop via transactional
   IPC, list actions popover, Quick Add across open boards.
5. **05** — Board search, labels, header date/label filters.

Follow-on tasks (files to be created when 01–05 land):

6. Table view (+ bulk actions) and board view switching.
7. Planner overlay: Calendar/This Week/Day/Agenda, scopes, Planner filters.
8. Settings: app panels (General/Notifications/Smart Actions) + board panels
   (General/Labels/Appearance/Workflow/Obsidian/Import).
9. Archive browser + board switcher + About/Sponsor/shortcuts/vault modals.
10. Editor extras: linked objects (incl. file-drop), Smart Card Actions (AI),
    raw-URL marking; Obsidian surfaces.
11. App-level extras: due notifications, external-change sync loop, global
    Quick Add shortcut handling, sponsorship pill.
12. **Cutover** per §3.

## 7. Feature Parity Checklist

Tracked live in [tasks/PARITY.md](./tasks/PARITY.md) (created by Task 01).
Summary groups:

- [ ] Shell: tabs restore/switch/close, board open/missing, theme toggle
- [ ] Kanban read: columns, cards, badges, dates, label chips, empty states
- [ ] Editor core: title/notes/dates save parity, timestamps, moves, archive,
  duplicate, Open With, task-line date controls
- [ ] Kanban interactions: card/list CRUD, DnD persistence, list popover,
  Quick Add
- [ ] Search/labels/filters parity (visible-card matrix)
- [ ] Table view + bulk actions
- [ ] Planner (4 views, scopes, filters, card opening)
- [ ] Settings (all 9 panels) + imports UI
- [ ] Archive browser, board switcher, static modals
- [ ] Editor extras: linked objects, Smart Actions, URL marking
- [ ] App extras: notifications, sync loop, global shortcut, sponsor pill
- [ ] A11y: focus traps, live regions, keyboard nav, reduced motion,
  forced colors
- [ ] Shortcuts: full parity with `#modalKeyboardShortcuts` + docs

## 8. Test Strategy

- **Playwright dual-renderer** (primary oracle): `test:playwright` (legacy)
  must stay green throughout; `test:playwright:vue` grows green per task and
  is fully green before cutover. Preserve the DOM contract surface-by-surface.
- **Unit tests** for pure modules (`signboard-vue/lib/*`): task parsing, card
  filters, save queue, date math — write before porting the consumers
  (styleguide §9).
- **Component tests** (Vitest + `@vue/test-utils`) only where logic justifies
  (stores, composables); E2E covers the rest.
- **Untouched**: all main-process Node suites (`test:cli`, `test:mcp`,
  `test:archive`, importers, …) — they test `lib/**` and must pass unmodified
  throughout.
- **`vm`-based renderer suites** (`test-board-views`,
  `test-board-card-metadata`): retain them as explicit legacy-boundary
  regressions. Their pure behavior cases are also represented in Vue/lib unit
  tests; `test-board-views` currently has the documented pre-existing line 638
  assertion failure.

## 9. Effort Estimate

- **Total:** ~4–8 weeks single-developer equivalent to full parity + cutover.
- **Distribution:** scaffold ~5%, shell/board data ~10%, editor core ~20%,
  Kanban interactions ~10%, search/labels/filters ~10%, Table/Planner ~15%,
  Settings ~8%, editor extras ~10%, remaining surfaces + cutover ~12%.
- **Biggest risks:** editor fidelity (Task 03 + extras) and behavior hidden
  in legacy implicit wiring.

## 10. Trade-offs vs Strangler-Fig (for the record)

| | Side-build (chosen) | Island injection (rejected) |
|---|---|---|
| Integration work | None — real app composition from day one | Islands need re-integration at the end |
| Legacy coupling | Zero (preload bridge only) | Bridge hooks + double DOM ownership throughout |
| Ship value incrementally | No | Yes |
| Regression surface | One cutover, oracle-verified | Continuous, both systems live in one DOM |
| Drift risk | Legacy features need dual tracking | None (same app) |

## 11. Open Questions

1. Keep SortableJS via `useSortable` or adopt `vuedraggable`?
   (Recommendation: keep SortableJS — ghost/tilt styling is heavily
   customized in `static/styles.css` + `cardDragTilt.js`.)
2. `signboard-vue/` remains the canonical renderer directory after cutover;
   renaming it would add risk without changing runtime behavior.
3. ~~TypeScript?~~ Resolved: yes — the `signboard-vue/` scaffold is
   TypeScript (vue-tsc enforced via `npm run build`); styleguide §4 applies.
4. Tooltip engine: the Vue renderer keeps the existing delegated behavior and
   shared runtime styling; the legacy implementation remains inside the
   rollback bundle.
