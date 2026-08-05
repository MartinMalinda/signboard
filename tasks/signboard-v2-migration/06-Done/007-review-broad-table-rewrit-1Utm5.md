---
title: Review broad Table rewrite and preserve board-search behavior
labels:
  - discovery
  - renderer
  - testing
  - ux
statusChangedAt: 2026-08-04T20:30:21.644Z
createdAt: 2026-08-04T17:50:47.477Z
activity:
  - type: created
    at: 2026-08-04T17:50:47.477Z
  - type: moved-list
    at: 2026-08-04T20:30:21.644Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Ensure the V2 dashboard adapter does not hide unrelated Table behavior or board-search filtering.
  scope: Audit the TableView rewrite against the adapter card, preserve board-search and existing filters unless explicitly approved, and split unrelated changes before V2 review approval.
  acceptance_criteria:
    - Board-search filtering behavior is verified or restored.
    - Section-aware View-all ordering remains while unrelated Table rewrites are isolated.
    - A clear diff boundary exists for the V2 adapter card.
  verification: Run board-view, Table, Dashboard, and shortcut regression tests against the separated scope.
  status_summary: Reviewer found a broad Table rewrite mixed with the V2 adapter work.
  next_action: Compare TableView and related tests against the adapter acceptance criteria and identify unrelated hunks.
  estimate:
    effort_points: 3
---
Discovery/decision: the current TableView rewrite is broader than the V2 section adapter and may remove board-search filtering. Compare the diff with the adapter acceptance criteria, decide whether the rewrite is intentional, and split or restore unrelated behavior before approving the V2 dashboard card.


## Table audit result

Do not accept the broad Table rewrite as-is. It removes board-search filtering and the visible Start, Due, Updated, and Created columns, and weakens tests to encode the removal. The V2 projection and section-aware View-all adapter are useful, but the compatibility/product decision is captured in Ready card `Decide whether to restore Table search and preserve temporal columns`.

Evidence: current TableView no longer consumes search state or passes a query to filtering; the legacy search path is disabled; the switcher searches only for open-card results. PrimeVue/DataTable and V2 dependency/score columns also replace the former date/timestamp columns.
Superseded by the explicit human-gated Table compatibility decision card; audit evidence is retained above.
Replacement decision: Decide whether to restore Table search and preserve temporal columns. The audit evidence remains retained; this card is closed as the completed audit.
