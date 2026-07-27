# Task 03 — Card editor core

Depends on: Task 02.
Owner: **large model** (see [DELEGATION.md](./DELEGATION.md)); leaf pieces
(`CardTimestamps`, `OpenWithMenu`, footer buttons) delegable.
Rules: [vue-styleguide.md](../vue-styleguide.md).

## Goal

Clicking a card opens a fully functional editor for the core loop: title,
notes (OverType), card-level start/due, timestamps, list moves, archive,
duplicate, Open With. Save behavior — debounce, serialization, clean-state
tracking, external-edit reload — is behaviorally identical to legacy.

This is the **hardest task in the migration** (~5.4k legacy lines in
`app/modals/toggleEditCardModal.js`; scope here is its core, extras come in a
later task).

## In scope

- `Modal.vue` (shared modal primitive — build on the existing primitive):
  port focus trap, focus restoration, background inert, `Esc`,
  `aria-hidden` from `app/utilities/accessibility.js`. Copy the helper into
  `signboard-vue/lib/accessibility.js` as ESM (`THIS CAN BE REMOVED WHEN` header).
- `EditCardModal.vue` — open/save/close lifecycle via `useEditorStore`.
- `CardTitleField.vue` — native context-menu behavior is main-process owned
  (`context-menu` event) and works unchanged; verify.
- `CardNotesEditor.vue` — OverType wrapper component:
  - init/teardown with the component lifecycle, theme sync from `useUiStore`,
  - **debounced + serialized saves** (port exactly: debounce interval, save
    queue ordering, stale-overwrite race prevention),
  - **clean on-disk state tracking** + reload-on-external-change when the
    editor has no local edits (legacy semantics in `toggleEditCardModal.js`).
- `CardDatesControl.vue` + shared two-field calendar popover — FDatepicker
  wrapper (`useDatepicker()`), writes `start`/`due` frontmatter.
- `CardTimestamps.vue` — quiet Created/Updated from the normalized read
  metadata (`signboard-vue/lib/cardTimestamps.js`).
- `CardMoveControls.vue` — list dropdown + prev/next moves via
  `moveCardToTop` IPC; defer DOM updates with
  `waitForNativeMenuTrackingToSettle()` after the `<select>` popup.
- `CardEditorActions.vue` — duplicate (fresh lifecycle metadata) + archive.
- `OpenWithMenu.vue` — default-app open, reveal file, copy Signboard link;
  Obsidian entries only when inside a detected vault (preload exposes vault
  status — check the exact bridge method used by legacy).
- Task-level start/due markers remain supported in Markdown, but the editor does
  not render a separate date control beside each checklist item.
- Editor store: open card path, draft state, dirty/clean, save queue,
  popover anchoring state.

## Out of scope (later "editor extras" task)

- Linked objects / paperclip menu / file-drop linking.
- Smart Card Actions (AI) popover.
- Raw-URL marking in the OverType preview + inline open buttons.
- Obsidian-note chip reconciliation.

## Steps

1. Read `toggleEditCardModal.js` save/queue/clean-state sections first;
   write the save-queue as a pure module with unit tests **before** the UI
   (stale-overwrite races are the worst regression class here).
2. `Modal` + a11y port; test focus trap/restore keyboard-only manually.
3. Notes editor wrapper; verify OverType theme follows `useUiStore` theme.
4. Title/dates/timestamps; round-trip a card with every frontmatter combo
   (no dates, start only, due only, both) and diff the files vs legacy writes.
5. Move/archive/duplicate/Open With.
6. Verify checklist editing preserves task date markers in wrapped long lines.
7. External-edit reconciliation: edit the card file on disk while the editor
   is open (clean vs dirty) — behavior must match legacy (`app/init.js` sync
   loop semantics; the Vue renderer needs its own board-watch hookup via the
   same preload watch methods).
8. Update `tasks/PARITY.md`.

## Acceptance criteria

- Card round-trip byte-identical to legacy for title/body/dates/frontmatter
  ordering (`lib/cardFrontmatter.js` write order is the oracle).
- No lost edits under rapid typing + immediate close; no clobbering of
  external edits; Playwright editor subset passing under
  `test:playwright:vue`; legacy suite untouched/green.

## Risks / notes

- OverType instances leak if teardown isn't exact — check
  `closeAllModals.js` legacy cleanup list and mirror it in `onBeforeUnmount`.
- Save debounce must survive modal close (flush or discard exactly as legacy).
- The `<select>` move control needs the macOS settle defer before any
  re-render — port `waitForNativeMenuTrackingToSettle` into
  `signboard-vue/composables/useNativeMenuSettle.js`.

## Verification — 2026-07-25

Implemented in the Vue side-build. The editor keeps the legacy IDs/classes,
uses the existing preload bridge for card reads/writes and card actions, and
does not modify generated `app/signboard.js` or unrelated legacy renderer code.

Passing:

- `npm run build:vue` (Vue type-check and production build)
- `npm --prefix signboard-vue run test:unit -- --run` (4 files, 8 tests)
- `npm run test:frontmatter`
- `npm run test:task-list`
- `npm run test:board-snapshot`
- `npm run test:board-card-metadata`
- `npm run test:card-timestamps`
- targeted ESLint for the new editor/store/composable files

The pure save queue has unit coverage for rapid typing debounce, writes added
while a previous write is in flight, and cancelled stale generations. The Vue
Playwright suite was attempted but is not currently green in this checkout,
so editor E2E parity is not claimed here. The focused legacy board-view suite
still has the known baseline failure at `scripts/test-board-views.js:638`
(`expected add-list shortcut hint in list actions popover`) from the existing
`app/lists/listActionsPopover.js` change; it was not broadened or fixed as part
of Task 03.
