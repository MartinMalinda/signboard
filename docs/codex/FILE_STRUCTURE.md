# Signboard File Structure (Annotated)

This map focuses on source and operational files. Large generated/vendor folders are summarized.

## Top level

- `main.js` - Electron main process window + IPC handlers + trusted board-root/path validation + filesystem watchers + native menus/accelerators + update flow + MCP/CLI startup + external calendar server.
- `preload.js` - Thin renderer bridge (`window.board`, `window.chooser`, `window.electronAPI`) that forwards allowed operations to main-process IPC and main-process-triggered renderer events.
- `signboard-vue/` - Canonical Vue renderer source, framework-free helpers, unit tests, Vite configuration, and generated `dist/` output.
- `lib/` - Main-process, CLI, MCP, filesystem, import, archive, ordering, metadata, and shared application helpers.
- `shared/` - UMD-compatible helpers shared by main-process code and renderer modules.
- `CODEX.md` - Canonical Codex-specific repo instructions and maintenance rules.
- `AGENTS.md` - Cross-tool compatibility entrypoint that points agents to `CODEX.md`.
- `DESIGN.md` - Default theme tokens and visual rationale for Signboard's UI.
- `MCP_README.md` - Dedicated setup guide for Signboard MCP server mode (`--mcp-server`).
- `readme.md` - Human-facing project README.
- `docs/release-template.md` - Curated GitHub release-body template for public download links.
- `package.json` - Runtime, development, test, and packaging scripts.
- `electron-builder.json` - Build targets and artifact settings.
- `LICENSE` - MIT license.
- `obsidian-plugin/` - Optional desktop-only Obsidian companion plugin source.
- `skills/signboard-mcp/` - Optional agent skill instructions for safe/consistent Signboard MCP tool usage.

## Canonical Vue renderer (`signboard-vue/`)

- `signboard-vue/src/App.vue` - Vue shell bootstrap, session restore, empty/missing board states, and Kanban composition.
- `signboard-vue/src/components/` - Header, tabs, workspace dock, board views, cards, editor, settings, and modal components.
- `signboard-vue/src/components/BoardTabs.vue` - Stable board-tab windowing for overflow; activating a visible tab does not reorder the strip.
- `signboard-vue/src/stores/` - Pinia stores for boards, board data, editor state, settings, views, archive, switcher, notifications, and UI state.
- `signboard-vue/src/composables/` - Sorting, accessibility, shortcuts, dates, native-menu settling, and external-board synchronization.
- `signboard-vue/src/lib/components/` - Shared Button, Tooltip, Dropdown, Modal, Close, and Muuri grid primitives.
- `signboard-vue/src/lib/components/RichTextEditor.vue` - Tiptap Markdown editor, raw-URL and standalone-card-link decorations/widgets, card-link actions, and editor integration styles.
- `signboard-vue/src/components/editor/CardLinkEmbed.vue` - Resolves standalone links against active-board snapshot cards and reuses the canonical Kanban `CardItem` presentation inside the editor.
- `signboard-vue/lib/` - Framework-free ESM helpers for labels, filters, tasks, dates, timestamps, linked objects, archive, table views, settings, smart actions, and V2 semantics.
- `signboard-vue/lib/cardTitle.js` - Renderer filename-derived card display title and explicit-title fallback helpers.
- `signboard-vue/vite.config.ts` - Vue/Vite aliases, relative Electron build base, and Sass preprocessing.
- `signboard-vue/dist/` - Generated Vite production output packaged into the Electron app.

## Shared/library code

- `shared/appSettingsSchema.js` - App-settings defaults and normalizers shared by the main process and renderer.
- `shared/v2StageSemantics.js` - V2 stage resolution shared by main-process consumers.
- `shared/v2Evaluator.js` - Canonical trimmed V2 normalization, value/risk scoring formulas, ranking-index ranges, gates, and dashboard-section projections.
- `lib/atomicFile.js` - Durable same-directory temporary-file and atomic replacement helper.
- `lib/boardSnapshot.js` - Main-process batched board reader used by Kanban/Table views.
- `lib/cardFrontmatter.js` - Card parse/normalize/read/write/update with older-card compatibility.
- `lib/cardTitle.js` - Main-process filename-derived card display title and explicit-title fallback helpers.
- `lib/cardLifecycle.js` - Card lifecycle metadata and archive state helpers.
- `lib/cardTimestamps.js` - Shared timestamp resolver for desktop, CLI, and MCP card records, including tolerant desktop reads for paths that vanish during reconciliation.
- `lib/cardOrdering.js` - Transactional card/list ordering helpers backed by `.board.json` manifests.
- `lib/orderManifest.js` - Atomic ordering manifest read/write/migration helpers.
- `lib/archive.js` - Archive/list archive operations and browse/restore helpers.
- `lib/boardLabels.js` - Board-level label/theme/workflow settings and migration helpers.
- `lib/boardDuplication.js` - Board folder duplication and internal-link rewriting.
- `lib/appSettings.js` - App-wide settings persistence under Electron `userData`.
- `lib/aiTaskSuggestions.js` - Ollama model inspection and Smart Card Action processing.
- `lib/externalPublishedCalendar.js` - External Published Calendar collection and ICS generation.
- `lib/obsidianIntegration.js` - Obsidian vault, Base, linked-note, and URI/deep-link helpers.
- `lib/importers/` - Trello, Obsidian, and Tasks.md importers.
- `lib/mcpServer.js` - Headless MCP stdio server.
- `lib/cliApp.js` / `lib/cliBoard.js` - CLI command handling and board/card filesystem operations.
- `lib/cliInstall.js` - User-level CLI shim and shell-profile installation.

## Scripts (`scripts/`)

- `scripts/test-frontmatter.js` - Frontmatter behavior assertions.
- `scripts/test-board-snapshot.js` - Batched board snapshot assertions.
- `scripts/test-board-duplication.js` - Board duplication assertions.
- `scripts/test-app-settings.js` - App-settings persistence and migration assertions.
- `scripts/test-ai-task-suggestions.js` - Smart Card Action parsing assertions.
- `scripts/test-card-timestamps.js` - Timestamp normalization assertions.
- `scripts/test-archive.js` - Archive browse/restore assertions.
- `scripts/test-due-notifications.js` - Due notification assertions using canonical Vue helpers.
- `scripts/test-external-published-calendar.js` - Published calendar assertions.
- `scripts/test-task-list-parser.js` - Task checklist/date parsing assertions using canonical Vue helpers.
- `scripts/test-import-*.js` - Importer assertions.
- `scripts/test-obsidian-*.js` - Obsidian integration/plugin assertions.
- `scripts/test-mcp-server.js` - MCP protocol and tool smoke test.
- `scripts/test-cli.js` / `scripts/test-desktop-cli.js` - CLI smoke tests.
- `scripts/start-dev.js` - Complete Vue build, source watcher, and Electron dev startup.

## Playwright tests (`tests/playwright/`)

- `tests/playwright/signboard-smoke.spec.js` - Electron UI smoke tests for the canonical Vue renderer.
- `tests/playwright/helpers/fixtureBoard.js` - Temporary board fixture builder.

## Static assets (`static/`)

- `static/styles.css` - App styling, layout, theme tokens, modal/editor styles, keyboard-only focus affordances, reduced-motion/forced-colors rules, and card drag placeholder visuals.
- `static/vendor/*.js|*.css` - Vendored third-party libraries loaded by the Vue renderer.

## Build and packaging support

- `dist/` - Build outputs and unpacked platform artifacts (generated).
- `.board.json` (runtime, per board folder) - Root manifest containing list order and board settings.
- `app-settings.json` (runtime, Electron `userData`) - App-wide preferences.

## Codex doc maintenance rule

- When behavior, architecture, or tooling changes, update `CODEX.md`, `AGENTS.md`, `docs/codex/PROJECT_CONTEXT.md`, and this file.
- When user-facing behavior, setup, or CLI flows change, update `readme.md`, `docs/README.md`, `docs/using-signboard.md`, `docs/signboard-cli.md`, and `MCP_README.md` when relevant.
