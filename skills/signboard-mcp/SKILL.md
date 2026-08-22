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
- `signboard_create_card`: create a card from optional title/body/optional due+labels. Omit `title` unless the user wants an explicit title override.
- `signboard_update_card`: patch title/body/due/labels of a card, including section edits, note insertion, label add/remove/clear, and dry-run previews. Pass an empty title to clear an explicit title override.
- `signboard_duplicate_card`: duplicate an existing card with optional title/body override, label add/remove/clear, and dry-run preview.
- `signboard_archive_card`: move a card to `XXX-Archive`.
- `signboard_move_card`: move card between lists.
- `signboard_create_list`: create a list directory.
- `signboard_rename_board`: rename a board directory.
- `signboard_move_board`: move a board directory to a new parent directory.
- `signboard_read_board_settings`: read labels/theme/notification settings.
- `signboard_update_board_settings`: update labels/theme/notification/V2 settings.

## V2 project profile and card contract

Board-level V2 configuration lives under `settings.v2` in the root `.board.json`. It includes `enabled`, `profileId`, stage mappings, dashboard settings, and `cardDefaults`. `signboard_update_board_settings` accepts a partial `v2` object and merges nested `stages`, `dashboard`, and `cardDefaults`; preserve unrelated profile keys.

V2 card metadata is additive under `signboard_v2` with `contract_version: 1`. The core fields are:

- `contract_version` and optional `id`.
- `kind`: `task`, `discovery`, `epic`, or `incident`.
- `priority_class`: `P0` through `P3`.
- `parent`, `depends_on`, `blocked_by`, and optional boolean `blocked_on_decision`.
- `estimate.effort_points`.
- `opportunity.{reach,benefit,frequency}`.
- `risk_prevented.{likelihood,harm,blast_radius,mitigation_effectiveness}`.
- `discovery_value.{uncertainty_reduction,decision_importance,cost_of_wrong_choice}`.
- `modifiers.{confidence,urgency,maintenance_delta}`.
- `delivery.{regression_likelihood,change_blast_radius,reversibility}`.

`signboard_create_card` accepts optional `kind`, `priorityClass`, and `effortPoints`; on a V2-enabled board, omitted values inherit `settings.v2.cardDefaults`. `signboard_update_card` currently exposes body, dates, labels, notes, and section edits, but not arbitrary V2 metadata patches. Do not smuggle V2 data into unrelated fields; use an exposed V2-aware surface or the board-management skill's atomic file workflow when a metadata patch is required.

Narrative content belongs in the Markdown body, which is the source of truth. V2 stage/status is derived from the list directory; use `signboard_move_card` to change it and never write a separate lifecycle status into `signboard_v2`. Related-task values are card-title strings in the current contract. `blocked_on_decision` is only a boolean marker; put the decision itself in the body. Preserve unrelated legacy frontmatter and keep legacy cards readable.

For the full operating model—how to shape cards, score value, apply priority classes, interpret delivery risk, and read Dashboard queues—load [the V2 framework reference](../signboard-board-management/references/v2-framework.md) before making prioritization recommendations.

## Output Style

- Confirm which board path was used.
- For reads, summarize key data (lists, card ids/titles, due dates, labels).
- Treat the exact `cardFile` filename as the stable card reference. A returned title may be derived from the filename when `frontmatter.title` is empty.
- For writes, report exactly what changed (before/after when relevant).
- If blocked by read-only mode or root restrictions, state the exact constraint and required user action.
