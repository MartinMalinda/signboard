# Task 02 — App shell + read-only Kanban from real board data

Depends on: Task 01.
Rules: [vue-styleguide.md](../vue-styleguide.md) — stores own state, explicit
actions, no `watch`; pure logic lives in framework-free modules.

## Goal

The Vue renderer restores the previous session (open board tabs + active
board), opens boards via the directory picker, and renders the active board as
a **read-only** Kanban with correct card metadata (title, labels, task
badges, linked-object counts, dates). First vertical slice that looks like
Signboard.

## In scope

- **Pure libs** — copy framework-free modules into `app-vue/lib/` as ES
  modules: `taskList.js`, `linkedObjects.js`, `cardTimestamps.js`,
  `santizeFileName.js`, `dueDateStatus.js`, `timestampListItem.js`,
  `shared/appSettingsSchema.js`. Add `THIS CAN BE REMOVED WHEN` notes at the
  top of each copy ("...cutover makes this canonical; keep in sync with
  `app/**` until then"). Do **not** import from legacy `app/**`.
- **Stores**
  - `useBoardsStore` — open board paths, active board, tab restore from
    `localStorage` (`openBoardPaths`, `activeBoardPath`, legacy `boardPath`
    fallback), trusted-board re-authorization on restore, `open-boards.json`
    mirror via the same preload method the legacy renderer uses
    (`window.electronAPI` sync — find it in `app/board/boardTabs.js`).
  - `useBoardDataStore` — `readBoardSnapshot` via `window.board`, race-safe
    `loadBoard()` action (port the request-ID guard idea as a simple action
    token), lists/cards getters.
  - `useUiStore` — theme state: `data-theme` on `<html>`, localStorage
    persistence, dark-mode toggle action (needed by Task 03's OverType sync).
- **Components**
  - `App.vue`, `AppHeader.vue` (board name, search input rendered but inert,
    Card button inert, filter + menu buttons inert), `BoardTabs.vue` +
    `BoardTab.vue` (display + click-to-switch + close; keyboard arrows/`Home`/
    `End`/`Delete` per legacy `boardTabs.js`), `WorkspaceViewDock.vue`
    (static; Kanban active).
  - `KanbanBoard.vue`, `ListColumn.vue` (+ header with name/count),
    `CardItem.vue` (title button, label chips, task progress badge,
    linked-object badge, compact dates display), `AddListPhantom.vue`
    (rendered, click inert), `EmptyBoardCta.vue`, `MissingBoardAlert.vue`
    (locate + remove actions — these are pure preload flows, include them).
  - `FeatherIcon.vue` — renders `feather.icons[name].toSvg()` inline; the one
    allowed access point to the vendored global.
  - Minimal `BoardMenu.vue` with **working theme toggle only**; other items
    rendered disabled.
- **Board open flow** — picker via `window.chooser.pickDirectory`, authorize
  via preload, starter-content seeding for empty folders (port
  `app/board/openBoard.js`, 197 lines), `shouldUseLocatedBoardDirectory`
  confirm behavior from `renderBoard.js`.
- DOM contract: reproduce legacy IDs/classes on the shell (`#board`, `.list`,
  card markup, `#boardTabs`, …) so Playwright specs can run unchanged.

## Out of scope

- Any card/list mutation, drag/drop, popovers (except the minimal board menu),
  search/filter behavior, card editor, Planner/Table.
- `feather.replace()`-style global scans (Vue renders icons directly).
- Board color-scheme application beyond reading settings if trivial (full
  Appearance settings come later).

## Steps

1. Copy pure libs; convert to ESM exports; unit-test `taskList` parsing via
   the existing Node suite approach (or import the copy from the legacy test —
   pick one, document in `app-vue/lib/README`).
2. Build stores with explicit actions; session restore on app boot.
3. Build shell + Kanban components top-down; render from store getters.
4. Wire board open + missing-board flows; verify starter-content seeding
   produces the same files as legacy (diff the folders).
5. Verify tab session round-trip: open boards in Vue renderer, relaunch into
   **legacy** renderer — same tabs must appear (shared localStorage semantics
   must be byte-compatible).
6. Update `tasks/PARITY.md`: tick shell + read-only Kanban items; note which
   Playwright specs now pass under `test:playwright:vue`.

## Acceptance criteria

- Real board renders identically to legacy for the read-only surface
  (spot-check 3 boards incl. one with labels/tasks/dates).
- Session restore byte-compatible with legacy (both directions).
- `npm run test:playwright` (legacy) still green — untouched.

## Risks / notes

- **Starter-content drift:** `openBoard.js` seeding and
  `lib/boardCreation.js` are related but distinct; port the renderer one and
  diff generated folders byte-for-byte.
- **Board name resolution** uses `window.board.getBoardName`; check snapshot
  `boardName` first (legacy prefers it).
- Keep the header controls visibly inert (disabled), not half-wired —
  half-wired is how side-builds rot.
