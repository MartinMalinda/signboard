# Task 01 — Standalone Vue renderer scaffold (side-by-side)

Strategy: build the Vue version **on the side** until feature parity, then cut
over (see [vue-migration.md](../vue-migration.md) §4).
Rules: [vue-styleguide.md](../vue-styleguide.md).

## Goal

A standalone Vue 3 + Vite + Pinia renderer in `app-vue/` boots inside the
existing Electron shell when explicitly requested, using the **same preload
bridge** as the legacy renderer. The legacy app stays the default and is
untouched by this task except one opt-in loader branch.

## Why this works cleanly

- `preload.js` exposes the complete filesystem/IPC surface
  (`window.board`, `window.chooser`, `window.electronAPI`) to whatever HTML the
  `BrowserWindow` loads. The Vue renderer needs **zero main-process changes**
  beyond choosing which file to load.
- No DOM is shared between renderers — they are separate documents, so there
  is no double-ownership problem and no bridge hooks into legacy code.

## In scope

- `app-vue/` Vite app:
  - Own `index.html` entry (copy the CSP meta from the root `index.html`
    verbatim; add `<script type="module" src="/main.js">`).
  - Vue aliased to `vue/dist/vue.runtime.esm-bundler.js` (CSP forbids
    `unsafe-eval`; templates are precompiled — **do not** relax CSP).
  - `base: './'`, `build.outDir: 'dist'`, deterministic entry filenames
    (`entryFileNames: 'assets/[name].js'`).
  - `src/main.js` → creates app, installs Pinia, mounts `App.vue` (empty
    shell rendering only the static header skeleton + "Vue renderer" marker).
  - Link `../../static/styles.css` directly (file:// relative; styles stay
    global legacy CSS for DOM-contract parity — do not split yet).
  - Reuse vendored libs via plain `<script src="../../static/vendor/...">`
    tags in `app-vue/index.html` (Sortable/Feather/OverType/FDatepicker) so
    they stay the exact same builds; npm-installed alternatives are a later
    per-lib decision.
- `main.js`: one branch — when `SIGNBOARD_RENDERER=vue` is set, load
  `app-vue/dist/index.html` instead of `index.html`. Default path unchanged.
  This is the **only** legacy-side edit in this task.
- `package.json` scripts:
  - `build:vue`: `vite build` (config in `app-vue/vite.config.js`)
  - `dev:vue`: `concurrently` running `vite build --watch` and
    `SIGNBOARD_RENDERER=vue electron .`
  - `test:playwright:vue`: runs the existing suite with
    `SIGNBOARD_RENDERER=vue` in the launch env.
- Playwright config: pass `SIGNBOARD_RENDERER` through to the Electron launch
  env. Most specs will fail against the Vue renderer at this stage — expected;
  parity is tracked explicitly in [tasks/PARITY.md](./PARITY.md) (create it
  here with the shell section only).
- `electron-builder.json` / `package.json` build files: include
  `app-vue/dist` in packaged files.
- `.gitignore`: ignore `app-vue/dist`.

## Out of scope

- Any feature porting (no board rendering, no stores beyond a placeholder).
- Removing or editing any legacy renderer file.
- TypeScript, HMR/dev-server, SCSS, lint tooling.
- `preload.js` changes (verify the bridge loads identically for both
  renderers; report if anything is HTML-specific).

## Steps

1. Add deps (`vue`, `pinia`, `vite`, `@vitejs/plugin-vue`); scaffold `app-vue/`.
2. Wire `main.js` renderer branch behind the env var.
3. Add scripts; run `npm run build:vue` then
   `SIGNBOARD_RENDERER=vue electron .` → confirm the shell mounts (temporary
   `data-vue-renderer` attribute on `<body>` for easy detection).
4. Confirm `window.board`/`window.chooser`/`window.electronAPI` are all
   defined in the Vue renderer (console assert at boot in dev only).
5. Wire Playwright env passthrough; run one smoke spec against the legacy
   renderer to prove nothing changed, then against Vue to prove the harness
   works (failure of feature specs is fine at this point).
6. Create `tasks/PARITY.md` from the checklist in `vue-migration.md` §9.
7. Full legacy Playwright suite green; packaged build smoke
   (`dist:mac:arm64:no-notarize`) contains `app-vue/dist`.

## Acceptance criteria

- `npm start` = unchanged legacy app (default).
- `SIGNBOARD_RENDERER=vue electron .` boots the empty Vue shell with working
  preload bridge and no CSP console errors.
- `npm run test:playwright` (legacy) green; `test:playwright:vue` harness runs.
- `tasks/PARITY.md` exists.

## Risks / notes

- **Vendored globals:** OverType/Sortable attach to `window`; loading them via
  script tags in `app-vue/index.html` keeps behavior identical — resist
  repackaging them now.
- **Shared `localStorage`:** both renderers share the `file://` origin storage,
  so session keys (`openBoardPaths`, `activeBoardPath`) are visible to the Vue
  app immediately. Good for parity — but never write those keys from Vue until
  Task 02 defines the exact legacy-compatible semantics.
- Keep the `main.js` branch trivial (path selection only); any logic growth
  there is a smell.
