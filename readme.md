# Signboard

Signboard is a fork of [cdevroe/signboard](https://github.com/cdevroe/signboard).

Signboard is a local-first project management desktop app. Kanban is the main interface for moving work through workflow stages. Lists are directories and cards are Markdown files on disk. New list directories use the sanitized list name directly; older numbered or randomized list names remain compatible.

Signboard's product model is V2. A card represents one coherent outcome. Its list provides the workflow stage, while the namespaced `signboard_v2` metadata captures only the structured information useful for project management: card kind, relationships, priority, value, and delivery risk. The Markdown body remains the source of truth for the outcome, context, boundaries, acceptance details, evidence, decisions, progress, and next step.

Read the [V2 operating framework](./skills/signboard-board-management/references/v2-framework.md) for the working rules and the [V2 project-management specification](./tasks/V2-project-management.md) for the full contract.

Signboard is free for personal use. If you are using Signboard for your work, it would be appreciated if you make the commercial-use sponsorship payment to support future development. See the app's "Sponsor" button.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/cdevroe/signboard)](../../issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/cdevroe/signboard)](../../pulls)
[![Donate](https://img.shields.io/badge/Donate-388307)](https://cdevroe.com/donate)

---

## Core capabilities

- Kanban-first workflow with draggable cards and lists. A card's list is its stage or status; V2 does not store a competing status field.
- V2 card kinds: `task`, `discovery`, `epic`, and `incident`.
- Relationships for parent work, real sequencing dependencies, and current blockers.
- Priority classes from P0 to P3, plus derived Priority and Impact rankings based on compact value inputs, effort, confidence, urgency, and maintenance impact.
- Separate delivery-risk scoring for the risk introduced by making a change.
- Markdown bodies for the human project record. Structured metadata stays small and namespaced under `signboard_v2`.
- A secondary Table view for scanning, sorting, filtering, and bulk actions, plus V2 dashboard lenses for Priority, Impact, Low-hanging fruit, and Blocked. Kanban remains the primary workspace.
- Board labels, card start and due dates, task-level date markers, progress counters, and linked objects.
- Local-first storage with stable ordering in `.board.json` manifests and no hosted service required.
- Optional Obsidian integration, including links, local file attachments, and managed Bases for boards inside a vault.
- Built-in CLI and MCP interfaces for inspecting and updating local boards.
- Light and dark themes, board color schemes, keyboard navigation, and screen-reader support.

V2 is a reviewable ranking aid for project work. It does not add an agent queue, autonomy score, or unattended execution policy. Agents and people still follow the task, repository, and review rules that apply to the work.

---

## Installation

1. Go to the [Releases page](../../releases).
2. On the latest release, use the curated download links in the release body:
   - `Download for macOS (Universal)`
   - `Download for Windows`
   - Linux packages grouped by package type with explicit `x64` and `ARM64` labels

For standard releases, Signboard intentionally promotes a smaller public download set:

- macOS: universal build
- Windows: single installer
- Linux: separate `x64` and `ARM64` packages

The Vue renderer is the only desktop renderer. Packaged builds include the Vue
`dist` output, shared styles, and vendored renderer libraries.

### Install from source with `npm link`

To run the current source checkout and make the `signboard` command available on your PATH:

```bash
git clone https://github.com/cdevroe/signboard.git
cd signboard
npm install
npm run build:vue
npm link
signboard run
```

Use `npm start` from the checkout when you do not need the linked command. `npm link` is useful when you want to run the CLI commands directly while developing or testing a local checkout.

## Documentation

- [Documentation hub](./docs/README.md)
- [Using Signboard](./docs/using-signboard.md)
- [V2 operating framework](./skills/signboard-board-management/references/v2-framework.md)
- [V2 project-management specification](./tasks/V2-project-management.md)
- [Signboard CLI](./docs/signboard-cli.md)
- [MCP Server](./MCP_README.md)

### Keyboard shortcuts

On macOS, use `Cmd`. On Windows and Linux, use `Ctrl`.

- `Cmd/Ctrl + /`: open keyboard shortcuts
- `Cmd/Ctrl + K`: switch between currently open boards or search and open a card in the current board
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

The header search control opens the quick switcher and transfers focus to its search field. Type to search open boards and cards in the current board; `Enter` opens the selected card or switches to the selected board.

Board tabs, list actions, label/filter popovers, and Settings sections support arrow-key navigation. `Home` and `End` jump to the edges, `Esc` closes popovers, and `Delete` / `Backspace` closes a focused board tab.

When a card is open, workspace-level shortcuts such as create, board switcher, view switching, Settings, Archive, and search close the card first. Card-specific shortcuts such as moving or archiving the open card still act on that card.
Use a Kanban list header’s plus button to open Add Card directly for that list, or use the header `Card` button / `Cmd/Ctrl + N` to open Quick Add. In the Quick Add card modal, choose the board and list before creating the card. `Shift + Enter` creates the card, opens it immediately, and focuses the notes field. App Settings can also register an optional global Quick Add shortcut that works while Signboard is open.

You can also open the shortcut helper from `Help > Keyboard Shortcuts`.

Editable fields, including the card title and body editor, support the native right-click text editing menu for cut, copy, paste, delete, and select all.

Card titles are optional. When the title is empty, Signboard displays a cleaned-up version of the stable Markdown filename, such as `fix-login-Ab12c.md` as `Fix login`. Typing in the title field creates an explicit title override; clearing it restores the filename-based title. Editing a title never renames the file.

On Kanban cards, right-click the card surface to open its action menu and choose `Duplicate card` or `Archive card`. Right-clicking labels, metadata controls, or editable fields keeps their existing interaction menus.

Raw `http://`, `https://`, and `www.` URLs typed in the card body are visually marked in the editor. Use the inline open-link control or Cmd/Ctrl-click the URL to open it in your default browser without changing the card's Markdown.

Links to other Signboard cards stay compact inside sentences. When a card link is the only content in a paragraph or list item, the editor reuses the Kanban card presentation, including available preview, labels, and metadata, without changing the stored Markdown.

Fenced Markdown code blocks with `ts` or `json` language labels receive syntax highlighting in the Vue card editor without changing the stored Markdown.

Cards, list actions, and dialogs are keyboard-operable, with screen-reader status announcements for common actions. Focus indicators appear for keyboard navigation without adding persistent outlines to the card editor for pointer users.

## MCP server

Signboard includes a built-in MCP server so agents can interact with local boards.

- Dedicated instructions: [MCP_README.md](./MCP_README.md)
- To copy config: `Help` -> `Copy MCP Config`
- MCP uses `signboard_list_boards` plus both explicit allowed roots and Signboard's desktop trusted/open board state for board lookup.
- Optional agent skill: `skills/signboard-mcp/SKILL.md`

## CLI

Signboard includes a terminal CLI for direct board management without going through MCP.

- Full guide: [docs/signboard-cli.md](./docs/signboard-cli.md)

- In the desktop app on macOS/Linux: `Help` -> `Install Signboard CLI`
- From a source checkout linked with `npm link`: `signboard run` opens the desktop app
- Use `signboard boards list --json` to list known boards before choosing one
- Use `signboard boards discover . --json` to find board folders under a project; discovery never changes the selected board unless you add `--use`
- Pass an absolute card path to `--card` to infer its board automatically; `--board` remains available for IDs, titles, and bare filenames
- Use `signboard use /Path/to/Board` once to remember the active board for later commands
- Use `signboard boards create /Path/to/NewBoard --use` to create and select a new board from the terminal
- The installed `signboard` wrapper runs the bundled CLI in Electron's Node mode, avoiding desktop app startup for terminal commands.

Examples:

```bash
# Select a board once
signboard boards list --json
signboard use /Path/to/Board

# Create a board
signboard boards create /Path/to/NewBoard --use

# Lists
signboard boards discover . --json
signboard lists
signboard lists create "Waiting"
signboard lists rename "Waiting" "Blocked"

# Cards
signboard cards --due next:7
signboard cards "To do"
signboard cards --label Urgent --search launch
signboard cards create --list "To do" --title "Ship release notes" --start 2026-03-18 --due 2026-03-20
signboard cards edit --card ab123 --due none --move-to Doing
signboard cards duplicate --card ab123 --list Leads --remove-label Template --dry-run --json
signboard cards create --from-card ab123 --list Leads --title "New lead"
signboard cards notes add --card ab123 --text "Emailed follow-up" --timestamp
signboard cards read --list Doing --card ab123

# Imports
signboard import trello --file ~/Downloads/trello-export.json
signboard import obsidian --source ~/Vault/Kanban.md --source ~/Vault/Boards/
signboard import tasksmd --source ~/TasksWorkspace/tasks/Project-A

# Or run through the packaged app executable
/Applications/Signboard.app/Contents/MacOS/Signboard use /Path/to/Board
/Applications/Signboard.app/Contents/MacOS/Signboard cards --due next:7
```

Interesting card listing filters:

- `--due today`
- `--due tomorrow`
- `--due overdue`
- `--due this-week`
- `--due next:7` / `next:14` / `next:30`
- `--due-source card|task|any`
- `--label <name-or-id>` (repeatable)
- `--label-mode any|all`
- `--search <query>`
- `--sort list|due|title|updated|updated-oldest|updated-newest|created-oldest|created-newest`
- `--no-body` or `--summary` to omit Markdown bodies from card JSON output
- `--json` for scripting output

JSON failures are emitted as a single structured error object on stderr. In `boards list --json`, `activeBoardRoot` is the desktop-open active board and `currentBoardRoot` is the CLI-selected board; the shorter keys are retained as aliases.

Import options:

- `signboard import trello --file <export.json> [--board <path>] [--json]`
- `signboard import obsidian --source <path> [--source <path> ...] [--board <path>] [--json]`
- `signboard import tasksmd --source <path> [--board <path>] [--json]`

## Optional Obsidian integration

Signboard boards can live inside an Obsidian vault. A good layout is `Vault/Project/Signboard/<Board Name>/`; avoid making a board a nested Obsidian vault with its own `.obsidian` folder. You can move an existing board into a vault with `Settings > General > Move Board`.

If the board is inside a detected vault, the card's Open With menu shows Obsidian actions for opening the card and copying an Obsidian URI.

Use the paperclip control next to labels to link Obsidian notes, local files, folders, web URLs, app deep links, and `signboard://` links. You can also drag local files onto the open card editor to link them to that card.

Inside a vault, Signboard automatically creates `Signboard Board.base` for Obsidian Bases and keeps it current while it is still Signboard-managed. If you customize the Base in Obsidian, Signboard leaves it alone until you choose Settings > Obsidian > Generate Base again.

An optional desktop-only Obsidian companion plugin lives in `obsidian-plugin/`. Enable it to open/copy Signboard links, attach active Obsidian notes to Signboard cards, handle `obsidian://signboard?cardId=...`, and right-click a folder to `Create Signboard`.

Example task checklist syntax:

```md
- [ ] Draft update
- [ ] (start: 2026-03-18) Outline proposal
- [x ] (due: 2026-03-20) Send proposal
- [ ] (scheduled: 2026-03-21) Follow up
- [ X] Confirm scope
- [ x ] Share notes
```

## Automatic updates

- The Signboard app can check for updates automatically.
- You can manually check any time from `Check for Updates...`:
  - macOS: Signboard app menu
  - Windows/Linux: Help menu

---

## Development

```bash
git clone https://github.com/cdevroe/signboard.git
cd signboard
npm install
npm start
```

### Tests

```bash
npm run test:frontmatter
npm run test:board-labels
npm run test:board-snapshot
npm run test:board-duplication
npm run test:app-settings
npm run test:ai-task-suggestions
npm run test:due-notifications
npm run test:task-list
npm run test:obsidian-integration
npm run test:mcp
npm run test:cli
npm run test:cli-install
npm run test:desktop-cli
npm run test:card-ordering
npm run test:card-timestamps
npm run test:timestamp
npm run test:external-calendar
npm run test:archive
npm run test:vue-packaging
npm --prefix signboard-vue run test:unit -- --run
npm run test:playwright
npm run test:import-trello
npm run test:import-obsidian
npm run test:import-tasksmd
npm run test:obsidian-plugin
npm run release:verify
```

Playwright Electron tests do not explicitly bring the Signboard window to the foreground by default. Set `SIGNBOARD_PLAYWRIGHT_FOREGROUND=1` before `npm run test:playwright` when you want the app focused while debugging.

---

## Distribution builds

### macOS

```bash
# Default public macOS release build
npm run dist:mac

# Optional: specific macOS architectures for troubleshooting
npm run dist:mac:universal
npm run dist:mac:arm64
npm run dist:mac:x64

# Optional: build every macOS variant
npm run dist:mac:all
```

### Windows (NSIS installer)

```bash
# Default public Windows release build
npm run dist:win

# Alias for the default Windows release build
npm run dist:win:all

# Optional: specific Windows architectures for troubleshooting
npm run dist:win:x64
npm run dist:win:arm64
```

### Linux (AppImage, deb)

```bash
# Specific Linux architecture
npm run dist:linux:x64
npm run dist:linux:arm64

# Build both Linux architectures
npm run dist:linux:all

# Optional: RPM-only builds (requires rpmbuild in PATH)
npm run dist:linux:rpm:x64
npm run dist:linux:rpm:arm64
npm run dist:linux:rpm:all
```

### Build everything

```bash
# Public release matrix: macOS universal, Windows installer, Linux x64 + ARM64
npm run dist:all
```

Notes:
- `--publish never` is used for local builds so these commands package artifacts without attempting to publish releases.
- Standard public downloads are: macOS universal, one Windows installer, and Linux `AppImage`/`deb` builds for `x64` and `ARM64`.
- The GitHub release body should be treated as the curated download surface. Link the public download set there instead of expecting users to interpret the raw asset list.
- Copy `.env-sample` to `.env` and fill in your credentials before running signing/notarization builds.
- macOS signing/notarization uses environment variables from `.env` (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`).

---

## Contributing

Contributions in all forms are welcome!  

- **Report bugs**: Open an [Issue](../../issues).  
- **Suggest features**: Open an [Issue](../../issues) with the `enhancement` label.  
- **Submit fixes or features**: Fork the repo, make your changes, and open a [Pull Request](../../pulls).  

### Contribution Guidelines
- Keep PRs focused: one change per PR makes reviews faster.
- Be respectful and constructive in discussions.

---

## Sponsor the project

Signboard now includes an in-app sponsorship modal with two options:

- Personal use: free, with an optional tip in any amount
- Commercial use: requested one-time payment

---

## License

The source code in this repository is licensed under the [MIT](./LICENSE) license.

[MIT](./LICENSE) © 2025-2026 Colin Devroe - https://cdevroe.com

Important clarification:

- The MIT license allows personal and commercial use of the source code.
- The in-app `$49` commercial-use payment is currently a sponsorship request and honor-system purchase model for packaged app users.
- The optional personal-use tip is also a sponsorship mechanism, not a separate software license.
