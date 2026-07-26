# Task 11 — App-level extras parity

Depends on: Tasks 01–10. Side-build only; the Vue renderer keeps the existing
preload/main contracts and legacy DOM vocabulary.

## Scope

- Due notification scheduling and aggregation using the app notification
  setting, local date/time gating, card due dates, and incomplete task due
  markers. Completed tasks and completed-workflow lists are excluded while
  preserving useful task snippets in the native notification body.
- External board-watch synchronization with race-safe snapshot reconciliation,
  refresh of unchanged open editor drafts, and preservation of dirty local
  editor content.
- App-level Quick Add global shortcut status/error propagation and dispatch to
  the same Vue Quick Add command used by the header and keyboard shortcuts.
- Sponsor pill state in an explicit store, including persisted dismissal and
  compact-window visibility behavior.

## Acceptance criteria

- Due checks read current app settings, notify at most once per local day, and
  aggregate card/task items with legacy-compatible text and workflow semantics.
- Board-watch token changes refresh board snapshots without applying stale
  loads; clean editors reload external changes and dirty editors remain intact.
- The configured Quick Add accelerator continues to use the existing main
  process registration and reports registration failures in Vue settings while
  `open-quick-add-card` opens the normal Quick Add modal.
- Sponsor dismissal is local and persistent; compact windows do not expose the
  fixed pill, while the modal/menu/About entry points remain available.
- Focused unit coverage exercises due aggregation/time gating, sync races and
  clean-vs-dirty behavior, shortcut normalization, and sponsor state.

## Verification

- `npm --prefix signboard-vue run test:unit -- --run src/__tests__/task11-app-extras.spec.ts` — passed, 6 tests.
- `npm --prefix signboard-vue run test:unit -- --run` — passed, 15 files / 48 tests.
- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build` — passed; retains the existing Vite
  CommonJS `module` warning from `lib/appSettingsSchema.js`.
- `npm run test:due-notifications`, `npm run test:external-calendar`,
  `npm run test:app-settings`, and `npm run test:ai-task-suggestions` — passed.
- `git diff --check` — passed.
- `npm run test:board-views` remains a known unrelated baseline failure at
  `scripts/test-board-views.js:638` on the existing add-list shortcut-hint
  assertion in `app/lists/listActionsPopover.js`.
- Vue Electron Playwright is not claimed as passing: Electron aborts with
  `SIGABRT` during launch in this environment, before page interaction.
