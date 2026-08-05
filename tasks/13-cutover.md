# Task 13 — Vue renderer cutover

Status: **implemented**

## Scope

Vue is now the default renderer for normal desktop launches. `main.js` selects
`signboard-vue/dist/index.html` unless `SIGNBOARD_RENDERER=legacy` is set;
`SIGNBOARD_RENDERER=vue` remains a supported explicit value. The old
`index.html`, `app/**`, `buildjs.sh`, and generated `app/signboard.js` remain a
deliberate compatibility boundary for rollback/testing and are marked as
deprecated in the source/docs.

`npm run build:renderers` builds both renderer artifacts. Electron Builder
packages the Vue dist, its assets, shared static files/vendor libraries, and
the legacy entry required by the rollback path. `npm run test:vue-packaging`
checks the packaged-file contract without producing an installer.

## VM-suite audit

Meaningful pure behavior from the legacy VM suites was migrated into the
`signboard-vue/lib/` modules and Vue unit coverage across task parsing, date
filters, snapshots, Table metadata, accessibility, and shortcut models. The
legacy VM suites were not deleted because they still
provide rollback-renderer coverage. `scripts/test-board-views.js` remains
blocked at its existing `scripts/test-board-views.js:638` add-list shortcut-hint
assertion in the previously modified `app/lists/listActionsPopover.js`.

## Rollback

```sh
SIGNBOARD_RENDERER=legacy npm start
```

Use `SIGNBOARD_RENDERER=vue npm start` to make the new default explicit. In
development, `npm run start:dev` watches Vue and
`npm run start:dev:legacy` watches the legacy bundle.

## Verification record

- `npm run test:renderer-selection` — passed; default/`vue` resolve to Vue and
  `legacy` resolves to `index.html`.
- `npm run build:renderers` — passed (Vite retains the existing non-fatal
  CommonJS `module` warning from `lib/appSettingsSchema.js`).
- `npm run test:vue-packaging` — passed after the renderer build.
- Vue type-check, production build, and unit suite — passed (Task 12 baseline:
  16 files / 52 tests).
- Focused main-process Node suites — passed for board labels, board snapshot,
  card metadata, ordering, settings, AI, archive, due notifications, external
  calendar, task parsing, timestamps, Obsidian, and importers.
- `npm run test:board-views` — known baseline failure at line 638 described
  above; no test was weakened or masked.
- `npm run test:playwright:default`, `npm run test:playwright:vue`, and the
  explicit legacy `npm run test:playwright` command were attempted with
  targeted smoke/shortcut selections. In this environment the Electron launch
  aborts with `SIGABRT` at
  `tests/playwright/signboard-smoke.spec.js:506`, before page interaction; this
  is recorded rather than claimed as a passing E2E run.
- `git diff --check` — passed.
