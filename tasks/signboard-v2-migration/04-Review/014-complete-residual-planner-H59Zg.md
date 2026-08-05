---
title: Complete residual Planner retirement cleanup
statusChangedAt: 2026-08-05T06:20:04.952Z
createdAt: 2026-08-05T05:05:41.095Z
activity:
  - type: created
    at: 2026-08-05T05:05:41.095Z
  - type: moved-list
    at: 2026-08-05T05:06:17.582Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T06:20:04.952Z
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
  objective: Finish the residual cleanup required by the owner-approved merciless Planner retirement.
  scope: Remove remaining Planner CSS, skipped Planner Playwright expectations, and stale runtime/docs/task references; run the outstanding compatibility checks without touching V2 scoring or Table search.
  acceptance_criteria:
    - No supported Planner CSS or skipped Planner Playwright expectation remains without explicit replacement rationale.
    - Renderer-selection, packaging, notification/calendar, and relevant Playwright checks are run or their exact remaining failure is documented.
    - Dated-work metadata and supported Kanban/Table paths remain intact.
  verification: Run board-view, renderer-selection, packaging, snapshot/task-date, notification/calendar, and relevant Playwright tests; audit Planner references.
  status_summary: First retirement pass left residual CSS and a skipped test under the owner-approved scope.
  next_action: Assign residual cleanup, then request a focused Planner-retirement review.
  estimate:
    effort_points: 3
---
Complete the owner-approved merciless Planner retirement residuals. Remove remaining Planner CSS and the skipped Planner Playwright expectation, finish renderer-selection/packaging/notification/calendar checks, and clean any remaining runtime/docs/task references. Preserve supported dated-work metadata and do not alter V2 scoring or restore Table text search. Work only on residual Planner cleanup left after the first retirement pass.


## Development result: revise/hold

Residual Planner cleanup removed Planner/temporal CSS, the skipped Planner Playwright test, tasks/07-planner.md, stale parity/migration references, and retainPlanner from the internal board manifest. Renderer selection, packaging, board views, snapshots, task/date parsing, notifications, calendar units, evaluator, and diff checks pass.

Bounded Playwright smoke subset: 2 passed, 5 failed on stale/shared expectations or environment instability (missing renderBoard, timestamp format, Table aria-selected, legacy OverType selector, calendar ECONNREFUSED). Keep the retirement work in Review until these failures are attributed or explicitly accepted; no V2 scoring, dated-work metadata, Kanban/Table paths, or Table search changes were made.