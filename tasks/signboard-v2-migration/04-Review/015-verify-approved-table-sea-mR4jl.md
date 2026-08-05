---
title: Verify approved Table search direction and Cmd/Ctrl+K global search
statusChangedAt: 2026-08-05T05:05:40.337Z
createdAt: 2026-08-04T21:27:58.874Z
activity:
  - type: created
    at: 2026-08-04T21:27:58.874Z
  - type: moved-list
    at: 2026-08-04T21:29:40.789Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T05:05:40.337Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Align the Table redesign with the owner-approved Cmd/Ctrl+K global search direction.
  scope: Verify that Table does not reintroduce board-wide text search, while Cmd/Ctrl+K searches open boards/cards, opens selected cards, preserves keyboard focus, and coexists with V2 Table section/View-all behavior.
  acceptance_criteria:
    - Table has no second board-wide text-search contract.
    - Cmd/Ctrl+K returns relevant board/card results and opens the selected card with Enter.
    - Board switching, overflow tabs, and switcher search use the same safe switch helper.
    - Existing Table label/filter/section behavior remains covered.
  verification: Run board-view, switcher, shortcut, Table, Dashboard, and focused keyboard regression tests; inspect search-store removal only where it matches the approved direction.
  status_summary: Owner rejected Table text-search restoration and approved Cmd/Ctrl+K as the global search path.
  next_action: Assign bounded verification/cleanup development, then review keyboard and Table regressions.
  estimate:
    effort_points: 4
---
Implement and verify the owner-approved Table search direction: do not restore board-wide text filtering in Table; Cmd/Ctrl+K is the global search and board/card switcher. Keep the V2 Table projection and section-aware View-all behavior. Verify the switcher searches/open-card results, board switching, keyboard focus, and relevant Table filters without reintroducing a second search contract. Leave temporal-column visibility out of this implementation unless separately approved.


## Development result: review

The approved direction was implemented: Table text-search dependency removed, Cmd/Ctrl+K remains global from editable fields, V2 projection/section behavior and date metadata/actions remain, and shortcut coverage was added. Focused Vue Table/Dashboard/switcher/view tests (34), shortcut regression, V2 evaluator, snapshot, build/type-check, and diff checks passed. Board-view remains blocked by stale removed-Planner helper expectations; focused Playwright had 10 passes plus stale/Electron-instability failures.

Review only the approved Table/Cmd+K scope; do not restore Table text search or temporal columns.

## Review result: revise

The approved direction is implemented: Table has no board-wide text-search contract, Cmd/Ctrl+K is global from editable fields, board/card results and Enter-to-open work, V2 section/View-all behavior remains, and the visible temporal columns stay removed while underlying metadata remains.

Required follow-up: BoardTabs.vue calls boards.activateBoard directly instead of the shared safe switch helper used by the switcher, so tab switching may not close the active editor before changing boards. Keep this card in Review pending that narrow fix.