# Task 04 — Kanban interactions: CRUD, drag/drop, quick add

Depends on: Tasks 02, 03.
Owner: **split** (see [DELEGATION.md](./DELEGATION.md)) — large model owns
drag/drop; smaller model owns the modals/popover per specs below.
Rules: [vue-styleguide.md](../vue-styleguide.md).

## Goal

The Kanban board becomes fully interactive at parity with legacy: add/rename/
archive cards and lists, drag/drop with transactional persistence, list
actions popover, and Quick Add across open boards.

## In scope

### Large-model track (DnD)

- `useSortable()` composable — SortableJS lifecycle bound to component
  mount/unmount; the only place `new Sortable(...)` may appear.
- Card drag/drop within + across lists and list-column reorder:
  - persistence **only** via `reorderCardsInList` / `reorderLists` IPC
    (transactional, main-process owned — never renderer-side rename loops),
  - `moved-list` lifecycle events only for real cross-list moves,
  - ghost styling = empty drop slot (reuse `static/styles.css` rules),
  - drag tilt + text-selection lock: port `app/utilities/cardDragTilt.js`
    into the composable, incl. reduced-motion checks.
- Post-drop store reconciliation (explicit action call; no watcher).

### Smaller-model track (given store APIs from Task 02/03)

- `AddCardModal.vue` (per-list quick entry) + `QuickAddCardModal.vue`:
  board/list selectors across **all open boards**, active-board label
  preselection, `Shift+Enter` = create + open editor with notes focused
  (switches board first when targeting another board), header `Card` button
  wiring (replaces its Task 02 inert state).
- `AddListModal.vue`; list rename inline in `ListColumnHeader.vue`
  (sanitization via `signboard-vue/lib/santizeFileName.js`); archive card/list
  actions.
- `AppPopover.vue` (build the primitive here — first consumer) +
  `ListActionsPopover.vue`: labelled popover, first-enabled-action focus,
  arrows/`Home`/`End`/`Esc`, opener-focus restore, OS-aware shortcut hints
  (port the shared label-format helper from `boardLabels.js` into
  `signboard-vue/lib/shortcutLabels.js`), live status announcements.
- `EmptyBoardCta`/phantom click handlers replace Task 02 inert states.

## Out of scope

- Board tab drag-reorder (lands with tab-strip work in a later task).
- Table drag behaviors.
- Board search/filter (Task 05).

## Steps

1. Large: `useSortable` + tilt port on a scratch board; verify ghost/placeholder
   CSS applies unchanged (screenshot compare vs legacy).
2. Large: wire reorder IPC + lifecycle semantics; test cross-list move,
   same-list reorder, list reorder; verify on-disk filenames after each.
3. Small (parallel): the three modals + popover against the store APIs.
4. Integrate; keyboard-only pass on popover + modals.
5. Quick Add end-to-end: `Cmd/Ctrl + N` (wire the shortcut in the Vue
   renderer's global key handler — new `signboard-vue/composables/useShortcuts.js`;
   start the shortcut registry here, kept in sync with the legacy
   `#modalKeyboardShortcuts` list per CODEX rule).
6. Update `tasks/PARITY.md`.

## Acceptance criteria

- DnD persists identical on-disk ordering to legacy; `moved-list` only on
  cross-list; reduced-motion disables animation.
- Quick Add parity incl. cross-board `Shift+Enter`.
- Playwright interaction subset passing on Vue renderer; legacy suite green.

## Risks / notes

- Sortable + Vue both managing list DOM is the classic conflict: let Sortable
  move DOM freely during drag, then re-sync store order in `onEnd` and let Vue
  re-render from store truth (legacy does the same dance in
  `createListElement.js` — mirror it).
- Filenames are the persistence format (`NNN-` prefixes); never reorder by
  mutating DOM only.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build-only` — passed.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (5 files, 11 tests).
- Focused legacy tests — passed: task-list parser, board snapshot, board card
  metadata, card timestamps, card ordering, and archive.
- `npm run test:playwright` — not green: all 76 tests abort during Electron
  launch with SIGABRT before page interaction (environment limitation).
- Renderer smoke coverage — blocked by the environment's Electron launch failure.
  `scripts/test-board-views.js:638`, the existing add-list shortcut-hint
  assertion in modified `app/lists/listActionsPopover.js`; not changed here.

The Vue implementation includes the transactional reorder-only DnD path,
cross-list lifecycle handling in main-process `reorderCardsInList`, explicit
post-drop reconciliation, reduced-motion/fallback drag lifecycle, CRUD and
Quick Add modals, list actions/popover keyboard behavior, and shortcut/status
accessibility wiring. No legacy app module was changed for this task.
