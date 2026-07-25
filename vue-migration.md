# Vue.js Migration Plan

Status: **proposal** — no decision made yet. This document captures the current-state
assessment, the proposed component architecture, and a phased migration path for moving
the Signboard renderer from vanilla JS DOM manipulation to Vue 3.

> Scope: this migration touches **only the renderer** (`index.html`, `app/**`,
> `static/**`). The main process (`main.js`, `lib/**`, `preload.js`, CLI, MCP,
> Obsidian integration) is unaffected.
>
> Coding rules for the migration live in [vue-styleguide.md](./vue-styleguide.md).

## 1. Current State Assessment

### Scale

| Area | Size | Notes |
|---|---|---|
| Renderer source (`app/**`) | ~26,500 lines, 36 modules | Concatenated into `app/signboard.js` |
| Static shell (`index.html`) | 752 lines | Modals, popovers, dock, Planner overlay markup |
| Styles (`static/styles.css`) | 6,402 lines | Unaffected by migration |
| DOM-building call sites | ~700 | `createElement` / `innerHTML` / `appendChild` / `replaceChildren` |
| Direct DOM lookups | 403 | `getElementById` / `querySelector` against the static shell |
| Playwright suite | 3,660 lines | Coupled to DOM IDs/classes — the migration safety net |
| Node unit suites | several | Load renderer sources via `vm.runInContext` + mock DOM |

### Biggest modules (migration hotspots)

1. `app/modals/toggleEditCardModal.js` — 5.4k lines, 271 DOM calls (the card editor)
2. `app/board/boardLabels.js` — 4.1k lines (labels, filters, settings panels, imports UI)
3. `app/board/plannerView.js` — 2.1k lines
4. `app/board/boardViews.js` — 1.7k lines
5. `app/board/tableView.js` — 1.5k lines
6. `app/board/archiveBrowser.js` — 1.5k lines

### Architectural patterns that shape the migration

- **No module system.** `buildjs.sh` concatenates files in strict order; everything is
  a global. Cross-module calls use **487 defensive `typeof fn === 'function'` guards**,
  which hide the real dependency graph (including near-cycles, e.g. `renderBoard` ↔
  popovers/tabs).
- **State lives in ~12 `window.__*` singletons** (`__boardRenderState`,
  `__plannerViewState`, `__boardLabelState`, `__boardSearchState`, `__boardViewState`,
  `__boardTableState`, `__archiveBrowserState`, `__signboardAppSettingsState`,
  `__sbAccessibilityState`, `__sbTooltipState`, `__listActionsPopoverState`, …) plus
  `window.boardRoot` and `localStorage`.
- **Full-DOM rebuild rendering.** Every change re-renders via `replaceChildren`, with
  manual Sortable destroy/recreate, global `feather.replace()` icon scans (15 call
  sites), and a render-request-ID race guard (`isCurrentBoardRenderRequest`).
- **Imperative third-party libs:** SortableJS (7 init sites), OverType (markdown
  editor), FDatepicker, Feather icons, Marked, Turndown — all vendored in
  `static/vendor/`.
- **Hand-rolled accessibility:** focus traps, background inert state, live status
  region (`app/utilities/accessibility.js`), MutationObserver-based tooltips
  (`app/ui/tooltips.js`).

## 2. Compatibility Findings (Good News)

- **CSP is compatible.** `index.html` sets `script-src 'self'` (no `unsafe-eval`),
  which rules out Vue's runtime template compiler. Precompiled SFCs (Vue runtime-only
  build via Vite) work fine — **no CSP relaxation needed**.
- **Electron sandbox is compatible.** `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false` are unaffected. The `window.board` / `window.chooser` /
  `window.electronAPI` preload bridge stays exactly as-is.
- **Data layer is already separated.** All filesystem work is behind IPC; the renderer
  already renders from plain snapshot data (`readBoardSnapshot`) — exactly the
  prop/state shape Vue wants.
- **Full-rebuild rendering** means few incremental-DOM subtleties to preserve; moving
  from "rebuild everything from data" to "react to data changes" is conceptually
  clean.
- **Imperative libs coexist with Vue.** SortableJS, OverType, FDatepicker each get
  wrapped once (component or composable) and keep working. Marked/Turndown are pure
  functions, unaffected.

## 3. Hard Parts / Risks

1. **`toggleEditCardModal.js` is a monolith** — editor, dates popover, labels picker,
   linked objects, Smart Actions AI previews, file drag/drop, task-line date controls
   positioned from *measured textarea coordinates*. Estimated 30–40% of total effort.
2. **Untangling the implicit call graph.** Concatenation order currently resolves
   dependencies; ES modules will surface circular imports that must be broken via
   stores or events.
3. **The `vm`-based Node test harness** (`test-board-views`, `test-board-card-metadata`)
   evaluates raw source against mock globals. Vue SFCs can't be consumed that way —
   those suites must be re-targeted at extracted pure composables or the built bundle.
4. **A11y machinery must be re-hooked** into Vue lifecycles
   (`onMounted`/`onBeforeUnmount`/watchers) instead of post-render calls. Behavior
   (focus restoration, inert backgrounds, live announcements) must stay identical.
5. **Full-rebuild assumptions** — popover closing, Sortable teardown, request-ID
   guards — each needs a keep/delete/replace-with-reactivity decision.
6. **DOM contract preservation.** The Playwright suite asserts on IDs/classes/roles.
   Components must reproduce the same selectors (e.g. `#board`, `.list`, `.card`,
   `#modalEditCard`, `data-path`) or tests must be updated in lockstep.

## 4. Proposed Component Architecture

Vue 3 + SFCs + Pinia, built with Vite. Component tree below; the right column shows the
current module(s) each component replaces.

### 4.1 App shell

| Component | Replaces / source |
|---|---|
| `App.vue` | Root; mounts header, board, dock, overlays, modal layer |
| `AppHeader.vue` | `<header>` in `index.html`; parts of `app/init.js` |
| `BoardName.vue` | `#boardName` updates in `renderBoard.js` |
| `BoardSearchInput.vue` | `app/board/boardSearch.js` |
| `BoardMenu.vue` | `#boardMenuPopover` markup + wiring in `app/init.js`, `app/ui/theme.js` |
| `BoardTabs.vue` + `BoardTab.vue` | `app/board/boardTabs.js` (incl. `N more` overflow) |
| `WorkspaceViewDock.vue` | `#workspaceViewDock` + dock state in `app/board/boardViews.js` |
| `SponsorPill.vue` | `#sponsorSignboardPill` markup + wiring |
| `QuickAddButton.vue` | `#quickAddHeaderButton` |

### 4.2 Board views

| Component | Replaces / source |
|---|---|
| `BoardView.vue` | `app/board/renderBoard.js` (view dispatch, missing-board handling) |
| `KanbanBoard.vue` | Kanban branch of `renderBoard.js`, list-level Sortable |
| `ListColumn.vue` | `app/lists/createListElement.js` |
| `ListColumnHeader.vue` | List title/rename/count parts of `createListElement.js` |
| `CardItem.vue` | `app/cards/createCardElement.js` (shared by Kanban/Table rows/Planner) |
| `CardBadges.vue` | Task progress + linked-object badges (`app/utilities/taskList.js`, `app/utilities/linkedObjects.js`) |
| `CardDatesControl.vue` | Compact start/due control in `createCardElement.js` |
| `LabelChips.vue` | Label chip rendering in `createCardElement.js` |
| `AddListPhantom.vue` | `createAddListPhantomCard` in `renderBoard.js` |
| `EmptyBoardCta.vue` | `createEmptyBoardCallToAction` in `renderBoard.js` |
| `MissingBoardAlert.vue` | `renderMissingBoardAlert` in `renderBoard.js` |
| `TableView.vue` | `app/board/tableView.js` |
| `TableRow.vue` | Row rendering in `tableView.js` |
| `TableBulkActions.vue` | Bulk selection/action bar in `tableView.js` |
| `TableSortControls.vue` | Sort/list-filter controls in `tableView.js` |

### 4.3 Planner

| Component | Replaces / source |
|---|---|
| `PlannerOverlay.vue` | `#plannerOverlay` + `app/board/plannerView.js` |
| `PlannerHeader.vue` | View tabs, scope toggle, search, filter button |
| `PlannerCalendar.vue` | Calendar view in `plannerView.js` + `boardViews.js` helpers |
| `PlannerWeek.vue` | This Week view |
| `PlannerDay.vue` | Day view |
| `PlannerAgenda.vue` | Agenda view |
| `PlannerFilterPopover.vue` | `#plannerFilterPopover` |
| `TemporalCard.vue` | Temporal card rendering in `boardViews.js` (source pills, badges) |

### 4.4 Card editor (decomposition of `toggleEditCardModal.js`)

| Component | Responsibility |
|---|---|
| `EditCardModal.vue` | Shell, open/close lifecycle, save orchestration (debounced + serialized), clean-state tracking |
| `CardTitleField.vue` | Title input + native context-menu behavior |
| `CardNotesEditor.vue` | OverType wrapper component (theme sync, URL marking, Cmd/Ctrl-click open) |
| `CardDatesPopover.vue` | Shared two-field start/due calendar popover |
| `TaskLineDateControls.vue` | Per-task calendar controls from measured textarea coordinates |
| `CardLabelsPicker.vue` | Label assignment popover + inline label creation |
| `LinkedObjectsPanel.vue` | Paperclip menu, chips, add/relink/recreate/remove, file drop |
| `LinkedObjectChip.vue` | Single chip (note/file/folder/URL/app/Signboard link) |
| `SmartActionsButton.vue` + `SmartActionsPopover.vue` | Anchored popover across menu/result/back states |
| `SmartActionPreview.vue` | Preview/apply UI for generated title/summary/tasks/labels/dates/attachments/answers |
| `CardMoveControls.vue` | List dropdown + directional move actions |
| `OpenWithMenu.vue` | Default-app/reveal/copy-link/Obsidian actions |
| `CardTimestamps.vue` | Quiet Created/Updated display |
| `CardEditorActions.vue` | Duplicate, archive, delete footer actions |

### 4.5 Other modals

| Component | Replaces / source |
|---|---|
| `AppModal.vue` | Base modal: focus trap, inert background, Esc, restore-focus (wraps `app/utilities/accessibility.js`) |
| `QuickAddCardModal.vue` | `app/modals/toggleAddCardModal.js` + Quick Add wiring in `app/listeners/window.js` |
| `AddListModal.vue` | `app/modals/toggleAddListModal.js` |
| `AddCardToListModal.vue` | `app/modals/toggleAddCardToListModal.js` |
| `SettingsModal.vue` | Settings shell + section nav (`app/board/boardLabels.js`, `app/appSettings.js`) |
| `SettingsAppGeneral.vue` | App-wide General panel |
| `SettingsNotifications.vue` | Notifications panel |
| `SettingsSmartActions.vue` | AI/Ollama + drag-reorderable accordion action rows |
| `SettingsBoardGeneral.vue` | Board rename/move/duplicate |
| `SettingsBoardLabels.vue` | Label definitions editor |
| `SettingsBoardAppearance.vue` | Color scheme panel |
| `SettingsBoardWorkflow.vue` | Completed-list rules |
| `SettingsBoardObsidian.vue` | Obsidian/Base controls |
| `SettingsBoardImport.vue` | Trello/Obsidian/Tasks.md import panel + summaries |
| `KeyboardShortcutsModal.vue` | `#modalKeyboardShortcuts` |
| `AboutModal.vue` / `SponsorModal.vue` | About/sponsorship markup in `index.html` |
| `ObsidianVaultRequiredModal.vue` | `#modalObsidianVaultRequired` |
| `ArchiveBrowserModal.vue` | `app/board/archiveBrowser.js` |
| `ArchiveResultList.vue` + `ArchiveDetailPane.vue` | Search-first results + lazy detail pane |
| `BoardSwitcherModal.vue` | `app/board/boardSwitcher.js` (`Cmd/Ctrl + K`) |

### 4.6 Popovers & primitives

| Component | Replaces / source |
|---|---|
| `AppPopover.vue` | Base anchored popover (open/close, Esc, arrow-key nav, opener-focus restore) |
| `LabelFilterPopover.vue` | Header date/label filter (`app/board/boardLabels.js`) |
| `ListActionsPopover.vue` | `app/lists/listActionsPopover.js` |
| `DateField.vue` | FDatepicker wrapper |
| `FeatherIcon.vue` | All `feather.replace()` call sites |
| `AppTooltip.vue` (or `v-tooltip` directive) | `app/ui/tooltips.js` engine, re-triggered from Vue lifecycle |

### 4.7 Stores & composables (replacing `window.__*` state)

| Store / composable | Absorbs |
|---|---|
| `useBoardsStore` | Open board tabs, active board, `window.boardRoot`, localStorage persistence, `open-boards.json` sync |
| `useBoardDataStore` | Snapshot loading, lists/cards, render race conditions, external-change refresh |
| `useLabelsStore` | `__boardLabelState`, filter state, workflow/completed-list settings |
| `useSearchStore` | `__boardSearchState` |
| `useViewStore` | `__boardViewState`, Kanban/Table/Planner dock state |
| `usePlannerStore` | `__plannerViewState` (view, scope, filters) |
| `useTableStore` | `__boardTableState` (selection, sort, bulk actions) |
| `useAppSettingsStore` | `__signboardAppSettingsState` |
| `useEditorStore` | Open-card editor state, dirty/clean tracking |
| `useArchiveStore` | `__archiveBrowserState` |
| `useUiStore` | Modal stack, active popover, live status announcements |
| `useSortable()` | SortableJS init/teardown (Kanban lists/cards, tabs, Planner, settings accordion) |
| `useDatepicker()` | FDatepicker lifecycle |
| `useNativeMenuSettle()` | `waitForNativeMenuTrackingToSettle()` wrapper |
| `useShortcut()` | Shortcut registration; keep the single source in sync with `#modalKeyboardShortcuts` |

Pure logic (`app/utilities/taskList.js`, `dueNotifications.js`, `cardTimestamps.js`,
`linkedObjects.js`, `santizeFileName.js`, `shared/appSettingsSchema.js`) stays as plain
ES modules — directly unit-testable, no Vue dependency.

## 5. Phased Plan

Detailed per-task plans live in [tasks/](./tasks/):
[01 build tooling](./tasks/01-build-tooling.md) ·
[02 Vue primitives](./tasks/02-vue-primitives.md) ·
[03 board switcher](./tasks/03-board-switcher.md) ·
[04 archive browser](./tasks/04-archive-browser.md) ·
[05 leaf modals](./tasks/05-leaf-modals.md)

**Phase 0 — Tooling** (small, low risk)
- Add Vite + Vue 3 + Pinia; `index.html` becomes the Vite entry.
- Mount a single Vue root alongside the legacy bundle, or convert `app/**` to ES
  modules first as an intermediate step (keeps `vm` tests alive longest).
- Keep `buildjs.sh` producing the legacy bundle until the last island is migrated.
- Renderer loaded from built output in `main.js` (dev: Vite dev server or watch build).

**Phase 1 — Leaf islands** (quick wins, low coupling)
- `BoardSwitcherModal`, `ArchiveBrowserModal`, `ListActionsPopover`,
  `SponsorPill`, `AboutModal`/`SponsorModal`, `KeyboardShortcutsModal`,
  `ObsidianVaultRequiredModal`, theme toggle.
- Establish `AppModal`/`AppPopover`/`FeatherIcon` primitives here.

**Phase 2 — Board rendering**
- `useBoardsStore` + `useBoardDataStore` + `useLabelsStore` + `useSearchStore`.
- `KanbanBoard` → `ListColumn` → `CardItem`; `TableView`; board tabs; header.
- Retire `renderBoard()`'s manual lifecycle (request IDs, Sortable teardown,
  `feather.replace()`).

**Phase 3 — Planner**
- `PlannerOverlay` + four date views + filter popover, fed by the same stores.

**Phase 4 — Card editor**
- Decompose `toggleEditCardModal.js` last, reusing popover primitives and stores
  already built. Sub-component order: notes editor wrapper → dates → labels →
  linked objects → Smart Actions → task-line controls.

**Phase 5 — Cleanup**
- Delete `buildjs.sh` and the legacy bundle; remove global fallbacks.
- Re-target `vm`-based Node suites at extracted composables/pure modules.
- Update `CODEX.md`, `AGENTS.md`, `docs/codex/*` architecture docs.

Each phase ships with the Playwright suite green; DOM selectors are preserved
phase-by-phase so the suite keeps passing without big-bang test rewrites.

## 6. Test Strategy

- **Playwright (3,660 lines):** primary regression net. Preserve the DOM contract
  (IDs/classes/roles/`data-*`) in each component; update selectors only when a phase
  intentionally changes markup.
- **Node unit suites:** suites that test pure logic (`taskList`, `dueNotifications`,
  frontmatter, timestamps, …) are untouched. The two `vm`-based renderer suites
  (`test-board-views`, `test-board-card-metadata`) get rewritten against extracted
  composables (Phase 2) or replaced with component tests (Vitest + `@vue/test-utils`).
- **New:** component tests for stores/composables introduced in each phase.

## 7. Effort Estimate

- **Total:** ~4–8 weeks for one developer for a faithful 1:1 migration with the
  Playwright suite green throughout.
- **Distribution:** Phase 0 ~5%, Phase 1 ~15%, Phase 2 ~25%, Phase 3 ~15%,
  Phase 4 ~30%, Phase 5 ~10%.
- **Biggest risks:** the card editor decomposition (Phase 4) and the `vm` test-harness
  rework (Phase 5).

## 8. Trade-offs

**For migrating**
- Removes the concatenated-globals model and the 487 defensive `typeof` guards.
- Reactivity eliminates a whole class of manual-lifecycle bugs (stale Sortables,
  missed `feather.replace()`, render races).
- Component isolation makes the editor and settings UI tractable to extend.

**Against migrating**
- The app works today and has strong DOM-level test coverage.
- All "interesting" logic (filesystem, Obsidian, MCP, CLI, importers) is already
  outside the renderer and gains nothing from this migration.
- Multi-week effort with user-visible benefit only indirect (maintainability).

## 9. Open Questions

1. Keep SortableJS (via `useSortable`) or switch Kanban DnD to `vuedraggable`?
   (Recommendation: keep SortableJS — its fallback/ghost styling is heavily customized
   in `static/styles.css` + `cardDragTilt.js`.)
2. Keep the custom tooltip engine as a directive, or replace with a Vue tooltip
   library? (Recommendation: keep — it's small, styled to the design system, and
   attribute-driven.)
3. Dev workflow: Vite dev server with Electron pointing at `localhost`, or
   `vite build --watch` + `loadFile`? (Recommendation: build-watch first — simpler
   CSP/protocol story; evaluate HMR later.)
4. Should `index.html`'s static modals move into components incrementally (teleported
   to a modal layer) or all at once? (Recommendation: incrementally via `<Teleport>`.)
5. TypeScript? (Recommendation: out of scope for the 1:1 migration; revisit after.)
