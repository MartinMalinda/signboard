# Using Signboard

This guide covers the desktop app and the core workflow for managing a project in Signboard.

## Table of Contents

- [How Signboard Stores Your Board](#how-signboard-stores-your-board)
- [Create or Open a Board](#create-or-open-a-board)
- [Work with Lists](#work-with-lists)
- [Work with Cards](#work-with-cards)
- [Start Dates, Due Dates, Labels, and Checklists](#start-dates-due-dates-labels-and-checklists)
- [Search, Filters, and Open Boards](#search-filters-and-open-boards)
- [Board Views](#board-views)
- [Archive and Restore](#archive-and-restore)
- [Settings](#settings)
- [Accessibility](#accessibility)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [A Few Practical Tips](#a-few-practical-tips)

## How Signboard Stores Your Board

Signboard is file-first.

- A board is a folder on disk.
- Lists are folders inside the board.
- Cards are Markdown files inside those list folders.
- Board-level settings live under `settings` in the root `.board.json` manifest. Older boards with `board-settings.md` are migrated when Signboard next writes their settings.
- Archived cards and lists live in `XXX-Archive`.

Boards can live inside an Obsidian vault. Use a normal folder such as `Vault/Signboard/<Board Name>/`; do not create a nested vault inside the board. You can also move an existing board into a vault later from `Settings > General > Move Board`.

Because the board is just files and folders, you can back it up, sync it, inspect it in your editor, and use it from the CLI or MCP server.

For automation, the CLI can return compact card records with `cards --summary --json` (or `--no-body`); legacy cards use their filename as the JSON `id` when no five-character filename ID exists.

## Create or Open a Board

When Signboard opens without a board selected, click `Create your first board` and choose an empty directory.

If the directory is empty, Signboard creates a starter board with:

- `To do`
- `Doing`
- `Done`
- `Archive`

It also creates a starter card that explains the basics and includes a few upcoming checklist due-date examples. 👋

You can switch between multiple projects using the board tabs across the top of the window. On startup, the board that was active when you last quit is placed first. After that, tabs stay in place as you switch boards. Signboard does not cap the number of open boards; when they no longer fit, the tab strip shows an `N more` control that opens the quick board switcher. Choosing a hidden board reveals it without scrambling the relative order of the tabs.

Press `Cmd/Ctrl + K` from any screen to open the quick board switcher, then type an open board name and press `Enter`. The same field searches card titles and body text in the current board; select a card result and press `Enter` to open it. You can also close open boards from the switcher result list.

## Work with Lists

Lists are the columns of your kanban board.

### Create a list

You can create a list in a few ways:

- Press `Cmd/Ctrl + Shift + N`
- Use the list actions menu on an existing list and choose `Add new list`

Signboard creates a folder using the sanitized list name, such as `Ongoing`, `Staging`, or `Done`. Existing numeric prefixes and random suffixes are retained for compatibility, but new lists do not need them because ordering is stored in the board root `.board.json` manifest.

### Rename a list

Click a list title, edit it inline, and press `Enter` or click away.

Under the hood, Signboard updates the folder name while preserving the list's position in `.board.json`.

### Move lists

Lists can be reordered visually in the board. Signboard updates the board root `.board.json` file; the list directories themselves keep their names.

You can also open a list's actions menu and choose `Move list left` or `Move list right`.

### Archive a list

Open the list actions menu and choose `Archive this list`.

Archiving a list moves the entire list into `XXX-Archive` so it is removed from the active board without deleting its cards. It can be restored!

## Work with Cards

Cards are Markdown files, so every card is portable and readable outside the app.

### Create a card

You can create a card by:

- Clicking the header `Card` button
- Pressing `Cmd/Ctrl + N` to open Quick Add for any currently open board
- Using the `Add new card` button for a specific list

Use the plus button in a Kanban list header to open Add Card directly for that list, or use the header `Card` button / `Cmd/Ctrl + N` for the cross-board Quick Add modal. In the Quick Add card modal, choose the board and list before creating the card. The name seeds the stable filename; the card title remains optional. Press `Shift + Enter` after entering the name to create the card, open it immediately, and focus the notes field.

Card filenames are chosen based on the name you first give the card, with a random card ID suffix (to help with name collisions). New cards do not receive numeric ordering prefixes; older cards may still have them for compatibility. New cards are inserted at position 0 of the target list. Card order is stored in each list's `.board.json` file, and the filename stays the same even if you edit the title or reorder the card.

### Open and edit a card

Click a card to open it. A blank title uses a cleaned-up version of the filename, such as `fix-login-Ab12c.md` displayed as `Fix login`. Type into the title field to set an explicit title override. Clear the field to return to the filename-based title. Changing the title does not rename the file.

In the card editor you can:

- Set or clear its optional title
- Edit the Markdown body
- Set start and due dates
- Add or remove labels
- Move the card to another list
- Move it to the next list
- Use the `...` menu to copy the complete Markdown file or the card's
  `/[list-name]/[file-name]` path to your clipboard
- Share it
- Open it in Obsidian or the default Markdown app
- Open raw web URLs from the card body
- Create, open, or remove linked objects
- Configure Smart Card Actions in App Settings when AI assistance is enabled
- Archive it

The card body is Markdown, so plain text notes, headings, lists, checklists, and fenced code blocks all work naturally. Fenced blocks with `ts` or `json` language labels receive syntax highlighting in the Vue card editor while preserving the original Markdown. In the Vue card editor, checklist items use native accessible checkboxes; checking one still saves the standard Markdown task marker.

Raw `http://`, `https://`, and `www.` URLs in the body stay as plain Markdown text. When the cursor is in one, Signboard shows a small open-link control; Cmd/Ctrl-clicking the URL also opens it in your default browser.

The editor shows when the card was created and when it was last updated. Newer cards use Signboard's card metadata for the created date; older cards fall back to filesystem timestamps. When a card is dragged between lists, its frontmatter also records the ISO `statusChangedAt` timestamp for the latest status/list change.

Right-click in editable areas of the card title or body to use the native cut, copy, paste, delete, and select-all context menu.

In Kanban view, right-click a card surface to open its action menu and choose `Duplicate card` or `Archive card`. Labels, metadata controls, and editable fields keep their existing context-menu behavior.

### Move cards

Drag a card between lists in Kanban view. In the card editor, use the adjacent-list arrow or the card-move keyboard shortcuts. From Table view, change the row's list dropdown.

While dragging, the board shows an empty insertion slot where the card would land; the card is moved only after you drop it.

The arrow action and card-move keyboard shortcuts in the editor place moved cards at the top of the destination list.

### Copy or duplicate a card

Use the card editor's `...` menu and choose `Copy` to put the complete Markdown file, including frontmatter, into the clipboard. Choose `Copy path` to copy the board-relative card path in the form `/[list-name]/[file-name]`. Use the Kanban card context menu when you want a new card with the same content and metadata. You can use this to make it quick and easy to create new cards from templates. That's what I do!

The CLI can also duplicate cards and create cards from templates with `cards duplicate` and `cards create --from-card`, including dry-run previews for automation.

### Share a card

Use the share action in the card editor to hand the underlying Markdown file to another app using the operating system share flow when supported.

### Use Obsidian with Signboard

You can keep a board inside an Obsidian vault. A practical layout is `Vault/Signboard/<Board Name>/`. Do not make the board a nested vault with its own `.obsidian` folder. If you already created the board elsewhere, use `Settings > General > Move Board` and choose a folder inside the vault.

When Signboard detects that the board is inside a vault, the card editor's Open With menu can open the card in Obsidian and copy an Obsidian URI. Use the paperclip control next to labels to create a linked Obsidian note in the board folder. Signboard-created notes use the name `Linked Signboard Note.md` when available, add a numeric suffix when needed, and start empty except for link metadata. If the board is not inside a vault, Signboard explains that requirement instead of creating the note or Base file.

The same paperclip menu can link local files, folders, web URLs, app deep links, and `signboard://` links. You can also drag local files onto the open card editor to link them to that card. Local files and folders stay wherever they are on your computer; Signboard stores the path and opens the item in your default app. Web links open in your default browser, accept entries like `example.com/page`, and Signboard caches site favicons locally when possible so linked URL chips stay fast.

Linked objects appear in the card editor as removable chips. Click the object name to open it, or click its remove control to unlink it from the card without deleting the underlying file, folder, or note. If a linked Obsidian note cannot be found, Signboard keeps the link, marks the chip as missing, and offers controls to recreate the note, relink it to another Markdown note, or remove the link. Cards with linked objects also show a small paperclip count in Kanban and Table views.

Links to other Signboard cards in card notes render as compact links when they appear inside a sentence. Put a card link by itself in a paragraph or list item to show it with the same title, body preview, labels, dates, task progress, linked-object count, and work signals used by Kanban cards; this richer presentation does not change the stored Markdown. Hover over either form for 300ms to show its clamped title and Edit/Open actions. Clicking the link opens the related card immediately on top of the current editor, so closing it returns to the previous card. Canonical `signboard://open-card` links and relative Markdown card links are supported. Links outside the active board use the link title until their card data is available.

New or edited cards include flat Obsidian-friendly properties such as `title`, `signboard_board`, `signboard_list`, `status`, `signboard_uri`, and `related`, plus structured `linked_objects` when the card has linked files, folders, URLs, app links, or Obsidian notes. Canonical Signboard-generated filenames also include `signboard_id`; existing Markdown files with ad-hoc names do not need a custom ID and use a relative-path Signboard link instead. When a board is inside a vault, Signboard automatically creates `Signboard Board.base` for Obsidian Bases and keeps it current while it is still Signboard-managed. If you customize the Base in Obsidian, Signboard leaves it alone until you choose `Settings > Obsidian > Generate Base` again.

Signboard also includes an optional desktop-only Obsidian companion plugin in `obsidian-plugin/`. Copy or symlink that folder into your vault as `.obsidian/plugins/signboard-companion` and enable it from Obsidian's Community plugins settings. The plugin can open and copy Signboard links, attach the active Obsidian note to a Signboard card, open cards by `obsidian://signboard?cardId=...`, and add a folder context-menu action named `Create Signboard`. That action asks first, then adds board metadata/list folders, treats existing child folders as lists, moves top-level Markdown notes into a To-do list, and opens the board in Signboard. When you delete an Obsidian note that is linked from Signboard cards, the plugin asks before removing those linked objects from the cards.

## Start Dates, Due Dates, Labels, and Checklists

These features make card dates visible and available to date-aware integrations.

### Card start dates

Every card can have a start date in addition to a due date. Use a start date when work is scheduled to begin or become actionable before it is due.

Start dates appear on cards and in date-aware integrations. On Kanban cards and in the card editor, start and due dates share one compact `Dates` control. Click the calendar icon or date range to open both fields.

### Card due dates

Every card can have a due date.

Once a card has a due date, it becomes visible in:

- date displays on the card
- due-date-aware integrations
- daily due notifications if enabled in app settings

### Task list items with start and due dates

Signboard also understands start and due dates inside Markdown task lists.

Example:

```md
- [ ] Draft release notes
- [ ] (start: 2026-04-02) Draft beta announcement
- [ ] (start: 2026-04-03) (due: 2026-04-05) Send beta build
- [ ] (scheduled: 2026-04-06) Follow up with testers
- [x] Review copy
```

Task dates are separate from the card’s main start and due dates. Unchecked checklist item dates remain available in Markdown and CLI metadata even when a card has no top-level date. Once that checklist item is checked off, its date stays in the Markdown but is not treated as actionable by default. CLI due filters expose `--task-status open|any` when you need to choose whether checked task due markers count.

### Labels

Labels are defined per board. Add them in `Settings > Labels`, or create a new label directly from the label picker while editing or creating a card. The label picker also has a gear button that opens the board's Labels settings for renaming labels or changing colors.

Labels are useful for:

- priority
- work type
- people or teams
- contexts such as `Waiting`, `Errands`, or `Writing`
- Version numbers!

### Progress counters

If a card contains checklist items, Signboard shows progress based on completed versus total tasks.

## Search, Filters, and Open Boards

### Search

Use the `Search cards` control in the header. It opens the quick switcher and transfers focus to the switcher's search field. Reminder: `Cmd/Ctrl + F` opens it from the board workspace.

Type to search open boards and card title/body text in the current board. Use the arrow keys to move through matches and `Enter` to switch boards or open the selected card. Press `Esc` to close the switcher.

### Label filters

Use the filter button in the header to narrow the visible cards by your board labels. When filters are active, Signboard shows a compact summary chip beside search; click it to clear the active filters.

When a filter popover is open, use arrow keys, `Home`, and `End` to move through its controls. Press `Esc` to close the popover and return focus to the button that opened it.

## Board Views

Board context can be Kanban or Table.

### Kanban

Kanban is the board view. Use it for day-to-day drag-and-drop organization. Cards show compact metadata for start/due date ranges, checklist progress, labels, and linked-object counts.

### Table

Table is an active-board view for scanning and bulk-managing cards in board/list order. It uses the same label filters, task progress badges, linked-object counts, and completed-list workflow rules as Kanban. Use the header search control for quick-switcher card search.

Use the bottom view dock to switch to Table. Click a card title or row to open the normal card editor. Use the row's list dropdown to move a card to another list; moved cards land at the top of the destination list.

Table columns are ordered `Card`, `List`, `Tasks`, `Labels`, `Links`, `Depends on`, `Blocked By`, then the V2 score columns when available. Card and V2 score headers support PrimeVue sorting; the dashboard's `Dashboard priority` preset uses the same tie-break order as the Dashboard and can be cleared back to board order. Filter to one list, all completed lists, or all lists. Label and dashboard section filters apply before the table sort.
The Dashboard's Priority queue may show explainable `High Risk`, `High Damage`, and `Wide Impact` markers. These are informational signals; risk-prevention value contributes to Priority ordering and the separate Risk reduction score. The Impact view sorts unfinished work by positive opportunity, with effort weighted lightly; risk-prevention value is intentionally excluded from that positive-value view.
In expanded card Work details, Priority and Impact are shown as tie-aware percentiles among scored cards on the active board. Risk reduction retains its meaningful absolute 0–145 scale. Hovering a score reveals its raw index and theoretical range.
Impact is a broad dashboard view, not a label repeated on every Kanban or Dashboard card; derived chips are reserved for more specific states such as Blocked and Quick win.

Use the row checkboxes to select visible cards for bulk actions. After selecting one card, hold `Shift` while checking another row to select the range between them. The header checkbox selects the currently visible rows only. Bulk actions can archive selected cards, move them to another list, add or remove labels, set or clear start dates, and set or clear due dates.

## Archive and Restore

Archiving removes things from the active board without deleting them.

### Archive a card

Open the card editor and choose the archive action.

### Archive all cards in a list

Open the list actions menu and choose `Archive cards in this list`.

For selective cleanup, switch to Table, filter to `Completed lists` or a specific list, select the cards you want, and choose `Archive` from the bulk toolbar.

### Archive a list

Open the list actions menu and choose `Archive this list`.

### Restore from archive

Open the board menu and choose `Archive`.

From the archive browser you can:

- browse archived cards
- browse archived lists
- search archived content
- inspect details before restoring
- restore a card into a destination list
- restore an archived list back into the board

From archive search, press `Enter` or `Arrow Down` to focus the first result. Arrow keys move through archived results, `Enter` or `Space` selects the focused result, and `Esc` returns to archive search.

This lets you keep the active board clean without losing history.

## Settings

Open `Settings` from the board menu or press `Cmd/Ctrl + ,`.

### App Settings

The `App Settings` group controls settings that apply across Signboard:

- `General`: tooltips and the optional global Quick Add shortcut while Signboard is open
- `Notifications`: daily due-date reminders and External Published Calendar publishing
- `Smart Actions`: AI assistance through Ollama and Smart Card Actions

If notifications are enabled, Signboard checks open boards each day at the configured local time and shows a reminder when cards are due. The notification time field is shown only while reminders are enabled.

When AI assistance is enabled, Signboard checks the configured Ollama URL, shows whether it can connect, and loads the locally installed models from Ollama into a model dropdown. Use the refresh button next to the model picker after pulling a new model. Smart Actions remain configurable in App Settings, but the card editor no longer shows the floating Smart Card Actions button. App Settings lets you drag actions to reorder them, expand an action with `Edit`, customize each built-in prompt, and add custom actions with a label, affected card data, and prompt.

### External Published Calendar

External Published Calendar is an optional read-only iCalendar feed for local calendar apps.

When enabled in `App Settings` > `Notifications`, Signboard serves a local subscription URL on `127.0.0.1` while Signboard is open. The port and subscription URL settings are shown only while publishing is enabled. Copy the URL from Settings and subscribe to it from your calendar app. The feed is built from boards Signboard has opened and trusted, unless a board is toggled off.

The feed includes:

- card due dates
- unchecked task-list item due dates

The feed hides:

- checked-off task-list item due dates
- cards in completed lists
- boards that are toggled off in that board's Workflow settings

Due items are published as all-day events because Signboard due dates are date-only. The port can be changed in `App Settings` > `Notifications` if the default local port is unavailable.

### Board General

The board `General` section lets you:

- rename the board
- move the board folder to a new location
- duplicate the board into a chosen folder with a chosen board name

Duplicating a board copies the board folder, lists, cards, labels, settings, archive contents, and linked objects. Canonical generated cards receive fresh IDs and their `signboard://open-card?id=...` links are updated; ad-hoc cards continue to use relative-path links within the copied board.

### Labels

The `Labels` section lets you:

- add labels
- rename labels
- choose label colors
- remove labels

Labels are stored with the board so each board can have its own vocabulary.

### Appearance

The `Appearance` section lets you choose a board color scheme. Each scheme includes both light and dark variants.

You can also apply the color scheme to all currently open boards.

### Workflow

The `Workflow` section controls which lists count as completed work for the current board.

Completed-list cards and checked-off task date markers keep their dates, but daily due reminders hide them by default so finished work does not look actionable.

Auto-detection is enabled by default. You can turn it off, manually choose completed lists, or uncheck an auto-detected list.

Workflow also includes the board-level External Published Calendar inclusion toggle. Leave it on to include this board in the app-wide local calendar feed, or turn it off to keep the board out of subscribed calendar apps.

### Obsidian

The `Obsidian` section lets you generate or open the managed `Signboard Board.base` file for boards stored inside an Obsidian vault.

### Import

The `Import` section can bring content into the current board from:

- Trello
- Obsidian
- Tasks.md

Imports copy data into Signboard and leave the original source files where they are.

## Accessibility

Signboard keeps common board work available from the keyboard. Card titles are native buttons, list titles are editable textboxes, list actions are native buttons, and modals move focus into the active dialog and restore focus when closed.

### Renderer updates

Signboard starts with the packaged Vue renderer in both development and
production. Renderer changes are built with `npm run build:vue`.

Status changes such as creating, moving, archiving, restoring, and switching views are announced through a polite status region for screen readers. The app also respects reduced-motion and forced-colors preferences.

Focus styling is keyboard-only where possible, including the card editor title and list names, so mouse users do not get a persistent editor outline while keyboard users still get a visible focus target.

## Keyboard Shortcuts

On macOS, use `Cmd`. On Windows and Linux, use `Ctrl`.

- `Cmd/Ctrl + /`: open keyboard shortcuts
- `Cmd/Ctrl + K`: switch between currently open boards
- `Cmd/Ctrl + N`: quick add a card to any open board
- `Cmd/Ctrl + Shift + N`: create a list
- `Cmd/Ctrl + 1`: return to Kanban
- `Cmd/Ctrl + Option/Alt + 1`: switch to Table
- `Cmd/Ctrl + ,`: open Settings
- `Cmd/Ctrl + Shift + D`: toggle light and dark mode
- `Cmd + Control + Shift + C` on macOS, `Ctrl + Alt + Shift + C` elsewhere: cycle board color schemes
- `Cmd/Ctrl + Shift + [`: move the open card to the previous list
- `Cmd/Ctrl + Shift + ]`: move the open card to the next list
- `Cmd/Ctrl + Option/Alt + Shift + Backspace`: archive the open card
- `Cmd/Ctrl + Shift + A`: open Archive
- `Cmd/Ctrl + F`: open the quick switcher from the board search control
- `Esc`: close open modals

The header's `Search cards` control opens the quick switcher and transfers focus to its search field. Type to search open boards and cards in the current board; `Enter` opens the selected card or switches to the selected board.

In board tabs, use arrow keys, `Home`, and `End` to move across visible tabs. Press `Enter` or `Space` to switch boards, or `Delete` / `Backspace` to close the focused board tab.

In list actions, label/filter popovers, and Settings sections, use arrow keys, `Home`, and `End` to move through options. `Esc` closes popovers and restores focus to the opener.

When a card is open, workspace-level shortcuts such as create, board switcher, view switching, Settings, Archive, and search close the card first. Card-specific shortcuts such as moving or archiving the open card still act on that card.

You can also open the shortcut helper from `Help > Keyboard Shortcuts`.

## A Few Practical Tips

- Keep list names short. They are stored in folder names, so concise names stay readable on disk.
- Use labels for durable categories and use lists for workflow stages.
- Archive aggressively. The archive browser makes restoring easy.
- If you want automation or scripting, pair this guide with [Signboard CLI](./signboard-cli.md), which can also create new board folders from the terminal.
