---
title: Route BoardTabs through the safe board-switch helper
statusChangedAt: 2026-08-05T06:31:13.641Z
createdAt: 2026-08-05T06:20:05.725Z
activity:
  - type: created
    at: 2026-08-05T06:20:05.725Z
  - type: moved-list
    at: 2026-08-05T06:20:37.440Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T06:31:13.641Z
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
  objective: Make BoardTabs use the same safe context-switch behavior as Cmd/Ctrl+K switching.
  scope: Route tab-driven board activation through the shared editor-closing switch helper and add focused coverage; preserve tab overflow and switcher behavior.
  acceptance_criteria:
    - Changing boards through BoardTabs closes the active card editor before context changes.
    - Cmd/Ctrl+K and BoardTabs use the same safe switch helper.
    - Overflow-tab behavior and card-open navigation remain intact.
    - No Table text search or V2 scoring behavior is changed.
  verification: Run focused BoardTabs, switcher, editor-close, shortcut, and board-view tests.
  status_summary: Table direction review found direct BoardTabs activation bypassing the safe switch helper.
  next_action: Assign a narrow implementation, then review the board-switch regression.
  estimate:
    effort_points: 2
---
Route BoardTabs board activation through the same safe board-switch helper used by the Cmd/Ctrl+K switcher. Close the active card editor before changing boards, preserve overflow-tab behavior, and keep quick-switcher/card-open behavior unchanged. Add a focused regression for tab switching with an open editor. Do not restore Table text search or alter V2 scoring.


## Development result: revise

BoardTabs now delegates activation through the existing editor-closing switchBoard helper, and the open-editor Playwright regression was added. Vue build/type-check and diff checks pass, but the focused BoardTabs test still fails because the active board remains unchanged after the forced tab click. An existing switcher editor test also hits a stale legacy editor selector. Keep this card Active/Review pending the routing fix; no Table-search or V2-scoring files changed.