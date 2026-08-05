# Task 14 — Board color scheme application

Status: **implemented**

## Scope

The final parity gap is closed in the Vue renderer. The legacy nine-scheme
palette is now centralized in `signboard-vue/lib/boardTheme.js` and applied to
the active `#board` element for Kanban and Table. Both light and dark palettes
are installed so the existing app theme toggle switches modes without losing
the selected board scheme. Board snapshot restore, board switching, settings
changes, and theme toggles all reapply the active scheme.

The variables are scoped to `#board`; existing forced-colors rules continue to
override board borders, focus outlines, and selected rows.

## Verification

- `npm --prefix signboard-vue run type-check` — passed.
- `npm --prefix signboard-vue run build` — passed, with the existing non-fatal
  CommonJS-variable-in-ESM warning from `lib/appSettingsSchema.js`.
- `npm --prefix signboard-vue run test:unit -- --run` — passed (17 files,
  56 tests).
- `npm run test:board-labels` — passed.
- `git diff --check` — passed.
- No compatibility files were deleted or broadened beyond the board-theme
  application and focused CSS scope.
