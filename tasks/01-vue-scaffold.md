# Task 01 — Standalone Vue renderer scaffold (side-by-side)

Status: **DONE** (2026-07-25). Kept as record + reference for the wiring.
Strategy: [vue-migration.md](../vue-migration.md) §4.
Rules: [vue-styleguide.md](../vue-styleguide.md).

## What exists (verified)

- `signboard-vue/` — create-vue scaffold: **Vue 3 + TypeScript + Pinia +
  Vitest + vue-tsc**, lint via oxlint + eslint + oxfmt (no prettier).
- `signboard-vue/vite.config.ts` — `base: './'` for `file://` loading,
  `@vendor` alias → `../static/vendor`.
- `signboard-vue/index.html` — CSP meta copied verbatim from legacy
  `index.html`; runtime-only Vue (plugin-vue default) → no `unsafe-eval`
  needed. Verified: zero CSP console errors on boot.
- `signboard-vue/src/main.ts` — imports global `../../static/styles.css` +
  fdatepicker CSS, sets `data-vue-renderer` body marker, checks the preload
  bridge, loads vendor globals, mounts.
- `signboard-vue/src/lib/vendor.ts` — loads vendored libs via **classic
  script-tag injection** (paths relative to built index.html). Deviation from
  the original plan (bundled imports): bundling broke UMD global attachment
  for Sortable/feather/FDatepicker. Script tags preserve exact legacy
  semantics.
- `main.js` — single branch: `SIGNBOARD_RENDERER=vue` loads
  `signboard-vue/dist/index.html`; legacy `index.html` stays default.
  (Only legacy-side edit.)
- Root `package.json` — `build:vue`, `watch:vue`, `dev:vue`,
  `test:playwright:vue` scripts.
- `electron-builder.json` — `signboard-vue/dist/**` added to packaged files.
- Playwright — no config change needed: the spec fixture spreads
  `...process.env`, so `SIGNBOARD_RENDERER=vue playwright test` passes through.
- `.gitignore` — no change needed: existing `dist` pattern already covers
  `signboard-vue/dist`.

## Verified acceptance criteria

- `npm start` = unchanged legacy app (smoke-tested: legacy `index.html`
  loads with empty `SIGNBOARD_RENDERER`).
- `SIGNBOARD_RENDERER=vue electron .` boots the Vue shell: marker set,
  `#boardName`/`#board` mounted, `window.board`/`chooser`/`electronAPI`
  present, all 5 vendor globals loaded, no console errors.
- `npm run build` in `signboard-vue/` = vue-tsc type-check + Vite build, green.
- Vitest + oxlint/eslint green.

## Scaffold fixes applied during setup

- `eslint-plugin-oxlint`/`oxlint` peer mismatch (1.73 vs 1.74) → both pinned
  `~1.75.0`.
- `static/styles.css:6134` — fixed pre-existing typo `padding: 8px
  important!;` → `!important` (invalid declaration browsers ignored;
  lightningcss refused to minify it). **Side effect:** the intended
  `padding: 8px !important` on `.overtype-wrapper .overtype-preview pre` now
  actually applies — visually check the legacy editor preview once.

## Remaining from original scope

- `tasks/PARITY.md` — created alongside this task (shell section only).
- Packaged-build smoke (`dist:mac:arm64:no-notarize`) — deferred; run before
  first release that ships `signboard-vue/dist`.

## Notes for later tasks

- `import.meta.env.DEV` is false for `vite build --watch` (production mode) —
  don't rely on it for dev-only behavior in the Electron flow.
- Fonts from `static/styles.css` are bundled into `dist/assets` by Vite
  automatically (relative url resolution) — `font-src 'self'` satisfied.
- scaffold `README.md`, `.vscode/`, `eslint.config.ts` kept as-is.
