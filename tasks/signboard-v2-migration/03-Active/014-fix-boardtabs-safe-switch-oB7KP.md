---
title: Fix BoardTabs safe-switch routing regression
statusChangedAt: 2026-08-05T06:35:24.843Z
createdAt: 2026-08-05T06:31:13.817Z
activity:
  - type: created
    at: 2026-08-05T06:31:13.817Z
  - type: moved-list
    at: 2026-08-05T06:35:24.843Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make BoardTabs reliably activate the selected board through the safe editor-closing switch helper.
  scope: Fix the failing BoardTabs routing regression and preserve overflow/tab identity behavior; leave stale legacy editor selectors as separate scope.
  acceptance_criteria:
    - A forced BoardTabs click changes the active board through the safe helper.
    - An open editor is closed before the board context changes.
    - Overflow tabs and Cmd/Ctrl+K switching remain intact.
  verification: Run focused BoardTabs, switcher, editor-close, shortcut, and Vue build tests.
  status_summary: Initial safe-switch implementation exists but its focused BoardTabs regression still fails.
  next_action: Assign a narrow routing fix, then review the regression.
  estimate:
    effort_points: 2
---
Fix the BoardTabs safe-switch regression. Ensure a forced tab click activates the selected board through the editor-closing switchBoard helper, preserves tab identity/overflow behavior, and passes the new open-editor regression. Do not touch Table text search or V2 scoring; the existing stale legacy editor selector is a separate test issue.
