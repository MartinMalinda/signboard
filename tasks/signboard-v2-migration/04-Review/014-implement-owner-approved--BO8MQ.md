---
title: Implement owner-approved merciless Planner retirement
statusChangedAt: 2026-08-05T05:05:40.018Z
createdAt: 2026-08-04T21:27:58.675Z
activity:
  - type: created
    at: 2026-08-04T21:27:58.675Z
  - type: moved-list
    at: 2026-08-04T21:29:40.479Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T05:05:40.018Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: product
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Complete the owner-approved merciless Planner retirement as a separately attributable migration.
  scope: Remove remaining Planner runtime/store/view wiring, shortcuts, dead CSS/helpers, stale docs/parity claims, and obsolete tests while preserving dated-work metadata and supported Kanban/Table paths.
  acceptance_criteria:
    - No supported runtime path, shortcut, dock, store, or view still advertises or depends on Planner.
    - Stale Planner docs, parity claims, dead CSS/helpers, and obsolete tests are cleaned up or explicitly replaced.
    - Start/due and incomplete task-date metadata remain available through supported views/integrations.
    - The diff is attributable to Planner retirement and does not restore Table text search or alter V2 scoring semantics.
  verification: Run renderer-selection, board-view, snapshot/task-date, notification/calendar, packaging, and relevant Planner replacement tests; inspect docs and dead-code references.
  status_summary: Owner explicitly approved aggressive Planner retirement after audit identified incomplete cleanup.
  next_action: Assign development, then review the migration diff and replacement coverage.
  estimate:
    effort_points: 8
---
Implement the owner-approved merciless Planner retirement as a separate change. Remove remaining legacy and Vue Planner runtime/store/view wiring, dock/shortcut integrations, dead Planner CSS/helpers, stale Planner docs and parity claims, and obsolete/skipped Planner tests. Preserve the supported dated-work path through Kanban/Table and existing start/due/task-date metadata. Keep the change attributable to Planner retirement; do not mix new dashboard scoring or Table search behavior into it.


## Development result: revise

Planner retirement work updated board-view behavior and nine internal task/migration docs; board-view tests and diff checks pass. However, Planner CSS and the skipped Planner Playwright test remain, and renderer-selection, packaging, notification/calendar, and broader Playwright suites were not completed. Board snapshot still fails at a pre-existing V2 projection assertion.

Keep this card in Review until the residual cleanup is completed under the owner-approved merciless-retirement scope.

## Development result: revise/hold

Residual Planner cleanup removed Planner/temporal CSS, the skipped Planner Playwright test, tasks/07-planner.md, stale parity/migration references, and retainPlanner from the internal board manifest. Renderer selection, packaging, board views, snapshots, task/date parsing, notifications, calendar units, evaluator, and diff checks pass.

Bounded Playwright smoke subset: 2 passed, 5 failed on stale/shared expectations or environment instability (missing renderBoard, timestamp format, Table aria-selected, legacy OverType selector, calendar ECONNREFUSED). Keep the retirement work in Review until these failures are attributed or explicitly accepted; no V2 scoring, dated-work metadata, Kanban/Table paths, or Table search changes were made.