# Signboard Documentation

Signboard is a local-first board app that stores lists as folders and cards as Markdown files.

## Table of Contents

- [Using Signboard](./using-signboard.md)
- [Signboard CLI](./signboard-cli.md)
- [MCP Server](../MCP_README.md)

## Start Here

If you are using the desktop app, begin with [Using Signboard](./using-signboard.md).

If you want to automate Signboard, script it, or drive it from an agent without MCP, go to [Signboard CLI](./signboard-cli.md).

If you want structured tool access from an agent, see [MCP Server](../MCP_README.md).

## Renderer and rollback

The packaged Vue renderer is the normal desktop entry point. `SIGNBOARD_RENDERER=vue`
is accepted for explicit renderer selection; `SIGNBOARD_RENDERER=legacy npm start`
loads the deprecated legacy renderer for rollback/testing. Both paths use the
same preload/main-process APIs.

## What These Docs Cover

- Creating and organizing boards, lists, and cards
- Stable file-first ordering through per-directory `.board.json` manifests without reorder renames
- Drag-and-drop movement, including the empty insertion slot shown while dragging cards
- Calendar-based start/due date ranges on Kanban cards and in the card editor, task-level date markers, labels, linked-object counts, completed-list workflow settings, Kanban/Table board views, card age sorting and bulk actions in Table, Planner date views, and External Published Calendar
- Archiving and restoring cards and lists
- Settings, including app-wide General/Notifications/Smart Actions panels, drag-reorderable local Ollama Smart Card Actions for generated titles/summaries/task lists/auto-labeling/smart paste/due dates/linked-object suggestions, one-off Quick Smart Actions, read-only card questions, and board-specific General, Labels, Appearance, Workflow, Obsidian, and Import panels, plus board rename/move/duplicate actions
- Obsidian integration, including boards stored inside vaults, Open With actions, generated Bases files, linked notes, missing-note handling, linked objects, dropped local-file linking, URL favicons, `signboard://` card/board links, and the optional Obsidian companion plugin
- Raw web URLs in card bodies, opened from the editor through the inline open-link control or Cmd/Ctrl-click
- Native text editing context menus in editable fields, plus a Kanban card right-click action menu
- Accessibility support for keyboard-operable cards/list actions, modal focus handling, live status announcements, reduced motion, and forced-colors mode
- Keyboard result/menu navigation for board search, Planner search, Archive search, board tabs, list actions, label/filter popovers, and Settings sections
- Keyboard shortcuts for Quick Add card creation across open boards, creating lists, switching and closing open boards, opening Planner views across all open boards or the current board, cycling colors, moving open cards, archiving, and opening Archive
- CLI setup, board discovery, board creation, command reference, filters, age sorting, timestamp JSON output, card duplication/template workflows, dry-run previews, archive workflows, settings, and imports
- MCP trusted/open board discovery, trusted-root behavior, and board-name lookup

## File-First Model

Signboard is intentionally simple on disk:

- A board is a folder.
- Each list is a subfolder inside the board's folder; new list folders use the sanitized list name directly, while older numbered/randomized names remain supported.
- Each card is a Markdown file inside a list folder.
- Board settings are stored under `settings` in the root `.board.json` manifest; legacy `board-settings.md` files are migrated when read with file creation enabled.
- Archived cards and lists live in `XXX-Archive`.
- Obsidian helpers auto-create a managed `Signboard Board.base` for boards inside detected vaults, create linked notes in the board root when requested, and mark missing linked notes for explicit recreate/relink/remove actions. Existing boards can be moved into an Obsidian vault from `Settings > General > Move Board`. The optional `obsidian-plugin/` companion plugin can open/copy Signboard links, attach active notes, ask before removing links to deleted notes, and create a Signboard board from an Obsidian folder after confirmation.

That makes boards easy to inspect, back up, sync, and automate with standard filesystem tools.
