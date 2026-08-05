---
name: signboard-mcp
description: Use this skill when working with Signboard boards through the local MCP server, including V2 project profiles and card metadata (listing views/lists/cards, reading cards, and safely creating/updating/moving cards, boards, or board settings).
---

# Signboard MCP Skill

Use this skill when the user asks to read or modify Signboard data through MCP.

## Preconditions

- Signboard MCP server is configured and running.
- `boardRoot` values must be absolute paths.
- Respect server mode from `signboard_get_config`:
  - `readOnly: true` means do not attempt write tools.
  - `allowedRoots` is the union of explicit MCP roots and desktop trusted board roots; only use board paths inside those roots.

## Tool Workflow

1. Call `signboard_get_config` first.
2. Call `signboard_list_boards` when board root is unknown or ambiguous; prefer an `isActive` or `isOpen` match when it fits the user's request.
3. If the board is not listed but the name is known, use `signboard_resolve_board_by_name` when `allowedRoots` are available; otherwise ask user for the absolute board path.
4. Discover structure:
   - `signboard_list_lists`
   - `signboard_list_cards`
   - `signboard_read_board_settings`
   - `signboard_read_card` as needed
5. If `settings.v2.enabled` is true, treat list directories as V2 stages and read the card's additive `signboard_v2` namespace. Legacy cards remain valid; do not infer V2 semantics from arbitrary unnamespaced frontmatter.
6. Before write actions, verify:
   - user requested the change
   - server is not read-only
   - target list/card exists (or should be created)
7. Execute write tool only after checks:
   - `signboard_create_card`
   - `signboard_update_card`
   - `signboard_duplicate_card`
   - `signboard_archive_card`
   - `signboard_move_card`
   - `signboard_create_list`
   - `signboard_rename_board`
   - `signboard_move_board`
   - `signboard_update_board_settings`

## Safety Rules

- Never invent filesystem paths.
- Never pass relative paths as `boardRoot`.
- Do not attempt path traversal or multi-segment names in list/card fields.
- Prefer read operations first when user intent is ambiguous.
- Treat `XXX-Archive` as archive list unless user explicitly asks to include/use it.

## Tool Reference

- `signboard_get_config`: inspect MCP mode and path constraints.
- `signboard_list_boards`: list known usable board roots with desktop-open, active, trusted, current, and allowed-root metadata.
- `signboard_list_board_views`: list available board views (`kanban`, `table`).
- `signboard_resolve_board_by_name`: map a board directory name to absolute board paths under allowed roots, including allowed roots that are themselves board folders.
- `signboard_list_lists`: get list directory names in a board.
- `signboard_list_cards`: get card markdown files in a list.
- `signboard_read_card`: return normalized frontmatter and body.
- `signboard_create_card`: create a card from title/body/optional due+labels.
- `signboard_update_card`: patch title/body/due/labels of a card, including section edits, note insertion, label add/remove/clear, and dry-run previews.
- `signboard_duplicate_card`: duplicate an existing card with optional title/body override, label add/remove/clear, and dry-run preview.
- `signboard_archive_card`: move a card to `XXX-Archive`.
- `signboard_move_card`: move card between lists.
- `signboard_create_list`: create a list directory.
- `signboard_rename_board`: rename a board directory.
- `signboard_move_board`: move a board directory to a new parent directory.
- `signboard_read_board_settings`: read labels/theme/notification settings.
- `signboard_update_board_settings`: update labels/theme/notification/V2 settings.

## V2 project profile and card contract

Board-level V2 configuration lives under `settings.v2` in the root `.board.json`. It includes `enabled`, `profileId`, stage mappings, dashboard settings, `cardDefaults`, and policy/profile values. `signboard_update_board_settings` accepts a partial `v2` object and merges nested `stages`, `dashboard`, and `cardDefaults`; preserve unrelated profile keys.

V2 card metadata is additive under `signboard_v2` with `contract_version: 1`. The core fields are:

- `kind`: `task`, `discovery`, `epic`, or `incident`.
- `work_type`: profile-supported work category.
- `priority_class`: `P0` through `P3`.
- `estimate.effort_points`.
- Optional clarity and relationship fields such as `objective`, `scope`, `acceptance_criteria`, `verification`, `parent`, `depends_on`, `blocked_by`, `status_summary`, and `next_action`.
- Optional evaluator groups such as `opportunity`, `risk_prevented`, `delivery`, `modifiers`, and `execution`.

`signboard_create_card` accepts optional `kind`, `workType`, `priorityClass`, and `effortPoints`; on a V2-enabled board, omitted values inherit `settings.v2.cardDefaults`. `signboard_update_card` currently exposes body, dates, labels, notes, and section edits, but not arbitrary V2 metadata patches. Do not smuggle V2 data into unrelated fields; use an exposed V2-aware surface or the board-management skill's atomic file workflow when a metadata patch is required.

V2 stage/status is derived from the list directory. Use `signboard_move_card` to change stage and never write a separate lifecycle status into `signboard_v2`. Related-task values are card-title strings in the current contract. Preserve unknown V2 keys and keep legacy cards readable.

For the full operating model—how to shape cards, score value, apply priority and execution gates, interpret Dashboard queues, and select agent work—load [the V2 framework reference](../signboard-board-management/references/v2-framework.md) before making prioritization or execution recommendations.

## Output Style

- Confirm which board path was used.
- For reads, summarize key data (lists, card ids/titles, due dates, labels).
- For writes, report exactly what changed (before/after when relevant).
- If blocked by read-only mode or root restrictions, state the exact constraint and required user action.
