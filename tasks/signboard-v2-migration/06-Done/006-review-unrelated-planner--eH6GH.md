---
title: Review unrelated Planner removal before accepting V2 changes
labels:
  - discovery
  - migration
  - ux
  - docs
statusChangedAt: 2026-08-04T20:30:21.291Z
createdAt: 2026-08-04T17:50:47.300Z
activity:
  - type: created
    at: 2026-08-04T17:50:47.300Z
  - type: moved-list
    at: 2026-08-04T20:30:21.291Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: epic
  work_type: discovery
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Decide whether the unrelated Planner removal is intentional and safely separable from V2 work.
  scope: Audit the current Planner deletions and view wiring against product/docs compatibility; do not restore or remove runtime code until ownership and user impact are decided.
  acceptance_criteria:
    - The Planner removal is classified as intentional, accidental, or separately staged.
    - Compatibility, migration, and documentation implications are recorded.
    - Any follow-up implementation is split from the score/dashboard cards.
  verification: Review the diff, current docs, renderer selection, and relevant tests; obtain product-owner confirmation before changing the runtime.
  status_summary: Reviewer found substantial unrelated Planner removal in the shared worktree.
  next_action: Prepare a short scope and compatibility decision for the owner.
  estimate:
    effort_points: 3
---
Discovery/decision: the current shared worktree removes the Planner renderer, store, and view wiring, but this is outside the validated score/dashboard cards. Decide whether Planner retirement is intentional, what compatibility/documentation is required, and whether it must be split from the V2 work. Keep this in Ready/To-do pending owner judgment.


## Planner audit result

The Planner audit classifies removal as a deliberate but premature separately staged change, not as validated V2 score/dashboard scope. The owner decision is captured in Ready card `Decide whether to retire Planner separately from the V2 dashboard pilot`.

Evidence: the current diff removes legacy and Vue Planner implementations, store, dock wiring, shortcuts, and tests; user-facing docs no longer mention Planner while parity/shortcut/migration docs still do; a skipped Playwright test targets deleted DOM; Planner CSS/helpers remain. Start/due and incomplete task-date metadata remain preserved in snapshots and integrations.

Recommendation: retain a reversible compatibility path during the Dashboard pilot unless retirement is explicitly approved with migration messaging, replacement dated-work UX, cleanup, docs, and replacement/removal tests.
Superseded by the explicit human-gated Planner retirement decision card; audit evidence is retained above.
Replacement decision: Decide whether to retire Planner separately from the V2 dashboard pilot. The audit evidence remains retained; this card is closed as the completed audit.
