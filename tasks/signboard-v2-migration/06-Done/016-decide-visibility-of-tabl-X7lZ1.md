---
title: Decide visibility of Table temporal columns after redesign
statusChangedAt: 2026-08-04T21:29:29.172Z
createdAt: 2026-08-04T21:27:59.049Z
activity:
  - type: created
    at: 2026-08-04T21:27:59.049Z
  - type: moved-list
    at: 2026-08-04T21:29:29.172Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: decision
  work_type: product
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Record the owner-approved Table presentation boundary after the search decision.
  scope: Keep the visible Start, Due, Updated, and Created columns removed while preserving underlying date metadata and temporal behavior elsewhere.
  acceptance_criteria:
    - The owner decision explicitly keeps those four visible Table columns removed.
    - Underlying start/due/task-date metadata and relevant integrations remain available unless separately changed.
    - Table tests reflect the approved absence without weakening Cmd/Ctrl+K global search coverage.
  verification: Review the Table audit, temporal views/integrations, and board-view tests after the approved redesign is verified.
  status_summary: Owner approved keeping the visible temporal columns removed.
  next_action: Close this decision and verify the Table/Cmd+K implementation against both approved boundaries.
  estimate:
    effort_points: 1
---
The owner decided not to restore Table board-wide text search and to use Cmd/Ctrl+K as the global search/switcher. The prior Table audit also identified removal of visible Start, Due, Updated, and Created columns, but the owner response did not explicitly decide those temporal columns. Decide whether the redesigned Table should retain, replace, or intentionally omit those columns while preserving underlying date metadata and temporal views.

Owner decision (2026-08-04): keep the visible Start, Due, Updated, and Created Table columns removed. Preserve underlying date metadata and temporal integrations; verify the approved absence in Table tests.
