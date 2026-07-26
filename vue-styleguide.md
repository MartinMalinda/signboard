# Signboard Vue Styleguide

Scope: the Vue 3 renderer introduced by [vue-migration.md](./vue-migration.md).
Adapted from an external project's guidance; only what fits Signboard was kept
(see §10 for what was deliberately dropped). Until the migration starts, this
document is advisory only.

The project favors explicit data flow, predictability, and long-term
maintainability over framework idioms or abstraction-heavy design.

## 1. Component structure

```vue
<script setup lang="ts">
<template>
<style scoped>
```

- `<script setup lang="ts">` first, then template, then style. TypeScript is
  the default — the `signboard-vue/` scaffold (create-vue + vue-tsc) settled
  the earlier "TS after cutover" question.
- `<style scoped>` is preferred for new feature styles. Shared primitives in
  `signboard-vue/src/lib/components/` may use SCSS because Vite now compiles
  them with the compatibility tokens in `src/styles/_tokens.scss`; runtime
  theme values must still use the CSS custom properties from
  `static/styles.css`.

## 2. Data flow (the core rules)

- **Avoid `watch` and especially `watchEffect`.** Prefer direct function calls
  from event handlers and lifecycle hooks. Do not rely on indirect reactive
  flows to trigger logic. Store actions call other stores/actions explicitly.
  - Signboard-specific consequence: external board-file changes arrive via
    preload events — handle them with an explicit store action call, not a
    watcher on a reactive flag.
- **No `defineEmits`.** Emits are unnecessary syntax sugar.
- **No `v-model`** (`modelValue` / `update:modelValue`) in our own components.
  Third-party components that require it are fine.
- **Use explicit props + callback props instead** (`value` + `onChange`,
  `onSubmit`, `onClose`, …).
- The goal is explicit data flow and minimal abstraction. Exceptions are rare
  and intentional; call them out in the PR rather than applying silently.

## 3. State

- Pinia stores replace the `window.__*` singletons per the mapping in
  `vue-migration.md` §4.7. Do not create new ad-hoc module-level reactive
  state outside stores.
- localStorage persistence (board tabs, active board, theme) lives in exactly
  one store action each — no scattered `localStorage` reads in components.
- Keep card records in the shape `readBoardSnapshot` returns
  (`createdAt`, `linked_objects`, `signboard_id`, …). Do not remap persisted
  field names to an ad-hoc middle shape. Pass established objects (card,
  list, board settings) downstream whole instead of building narrow
  intermediate view-models that add little value.

## 4. TypeScript rules

- Trust the types. Limit `: any`, `as any`, `as unknown` — make strict typing
  work first; reach for them only after exhausting reasonable options. Lack
  of upstream context does not justify loosening types.
- Do not define return types on functions; let them be inferred.
- When types are structurally related, derive them with `Omit`, `Pick`,
  `ReturnType` etc. instead of duplicating the shape.
- Do not weaken types to make unit tests easier; improve the mocks instead.
- Type-check scoped: `npm run type-check` in `signboard-vue/` (vue-tsc), not
  repo-wide.
- Lint/format via the scaffold scripts only: `npm run lint` (oxlint + eslint)
  and `npm run format` (oxfmt) in `signboard-vue/`. No prettier via npx.
- Trust the code to be wired correctly. **Do not replicate the legacy
  `typeof fn === 'function'` guard pattern.** Explicit ES imports fail loudly
  at build time; that is the desired behavior.
- Avoid over-defensive fallback chains (`a?.b?.c ?? x ?? y ?? 'default'`).
  If data is unexpectedly undefined, fix the upstream cause or let the failure
  surface. Simple fallbacks like `props.items || []` are fine for genuinely
  optional inputs.
- Do not create wrapper functions with little to no added value.
- When data shapes are related, derive rather than duplicate (e.g. build the
  table-row record from the card record, not a hand-copied parallel shape).
- Pure logic stays framework-free: utilities like `taskList.js`,
  `dueNotifications.js`, `cardTimestamps.js`, `linkedObjects.js` remain plain
  ES modules with no Vue imports, directly unit-testable.

## 5. Styling

- Prefer spacing/color/layout values from the existing design tokens
  (CSS custom properties in `static/styles.css`, documented in `DESIGN.md`)
  over ad-hoc values.
- Consult `DESIGN.md` before changing default palette, typography, spacing,
  shape, elevation, or core component styling — that rule predates Vue and
  still applies.
- Use `em` units where appropriate (e.g. icons sized relative to text).
- Global styles stay in `static/styles.css` during the migration; move a
  selector into a scoped component style only when the component fully owns it.

## 6. Components & files

- Extract a shared primitive into `components/ui/` only when at least two
  features intentionally use it. Do not extract prematurely.
- Avoid repeating a domain name in filenames when the parent folder already
  names it (e.g. `components/board/CardItem.vue`, not
  `components/board/BoardCardItem.vue`).
- Imperative-library integration happens in exactly one place each:
  SortableJS in `useSortable()`, FDatepicker in `useDatepicker()`, OverType
  in its wrapper component, Feather in `FeatherIcon.vue`. Never call
  `feather.replace()` or `new Sortable(...)` from a feature component.

## 7. Signboard invariants (carry over from CODEX.md)

These survive the framework change and every component must respect them:

- Keyboard shortcuts, `#modalKeyboardShortcuts`, and user-facing shortcut docs
  stay in sync.
- Modal focus trapping/restoration, background inert state, live status
  announcements, `data-sb-modal-layer` popovers, reduced-motion and
  forced-colors behavior keep working — now via `Modal`/`AppPopover`.
- After `<select>` popups on macOS, defer DOM/layout mutations with
  `waitForNativeMenuTrackingToSettle()`.
- Drag/drop keeps the empty-drop-slot ghost styling and main-process
  transactional reorder IPC (`reorderCardsInList` / `reorderLists` /
  `moveCardToTop`). No renderer-side multi-rename loops.
- Board rendering keeps the batched `readBoardSnapshot` IPC path; do not
  reintroduce per-card IPC reads.
- The Playwright DOM contract (IDs, classes, roles, `data-*`) is preserved
  surface-by-surface so the **same suite runs against both renderers**;
  intentional markup changes update tests in the same PR.

## 8. Parallel-period compatibility (side-build)

- The Vue renderer (`signboard-vue/`) is standalone. **Never import from legacy
  `app/**`** — share logic only by copying framework-free modules into
  `signboard-vue/lib/` as ESM. Each copy gets a header comment beginning with
  `THIS CAN BE REMOVED WHEN` ("...cutover makes this the canonical copy;
  until then keep in sync with `app/<original>`").
- During the parallel period, bug fixes in duplicated pure modules must land
  in **both** copies (legacy `app/**` and `signboard-vue/lib/`).
- Legacy code stays untouched: no bridge hooks into the legacy renderer, no
  legacy edits beyond the single `main.js` renderer-selection branch
  (Task 01). The two renderers never share a DOM.
- New legacy features shipped during the parallel period must be recorded in
  `tasks/PARITY.md` in the same PR, so the Vue app can track them.
- At cutover, `signboard-vue/lib/*` copies become canonical and the legacy
  duplicates are deleted with `app/**`.

## 9. Testing, failure, performance

- For behavior changes, draft tests before implementation. They don't need to
  be exhaustive; capture expectations while assumptions are fresh.
- E2E (Playwright) stays close to real human behavior.
- Unit-test complex, edge-case-prone pure functions and highly reused ones
  (task parsing, date filters, snapshot adapters). Skip tests for trivial
  functions.
- Failure is acceptable. Prefer throwing / visible failure over silent
  degradation.
- Avoid unnecessary work: no broad recomputation, no extra IPC round-trips,
  no caching or optimization without a clear need.

## 10. Not adopted from the source guidance

| Dropped | Why |
|---|---|
| Global Sass variable systems | Runtime theme tokens belong to CSS custom properties; the limited Sass compatibility layer is only for shared primitive compilation |
| `shared-components/` package rules | Single app; a modest `components/ui/` folder suffices |
| Supabase/Doppler/Redis/migrations/commands sections | No database or hosted stack in this project |
| `PermanentError` / retry classification | No task-runner boundary here |
| `fetch` vs `node-fetch` | Renderer talks to main over preload IPC |
| Multi-tenant Airtable product boundaries | Not this product |
| `date-fns` mandate | No dependency decision yet; revisit if date math grows beyond `boardViews` helpers |

(TypeScript and oxc lint tooling were **adopted** after all: the
`signboard-vue/` scaffold is TS with oxlint + eslint + oxfmt — see §1 and §4.)

## 11. Communication

- Be direct and terse in code review and agent interactions.
- Conciseness must not omit critical risks, bugs, or correctness issues.
- Call out significant duplication, leftover unused code, and potential
  critical bugs or security issues even when unrelated to the task at hand.
