---
title: Decide whether to retire Planner separately from the V2 dashboard pilot
statusChangedAt: 2026-08-04T21:27:52.399Z
createdAt: 2026-08-04T18:09:36.046Z
activity:
  - type: created
    at: 2026-08-04T18:09:36.046Z
  - type: moved-list
    at: 2026-08-04T21:27:52.399Z
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
  objective: Choose whether Planner remains compatible during the V2 Dashboard pilot or is retired as a separate change.
  scope: Decide the product and migration policy for Planner removal; do not implement retirement from the V2 score/dashboard cards.
  acceptance_criteria:
    - The owner decision explicitly chooses compatibility bridge or separately staged retirement.
    - If retirement is chosen, migration messaging, replacement dated-work UX, cleanup, docs, and tests are listed as separate scope.
    - The decision preserves existing start/due and incomplete task-date metadata unless explicitly changed.
  verification: Review the Planner audit evidence, current docs/tests, and V2 dashboard scope before approving implementation.
  status_summary: Planner removal is a broad, premature scope change held for owner judgment.
  next_action: Obtain the product decision before creating or assigning retirement implementation work.
  estimate:
    effort_points: 3
---
The Planner audit found that the current Planner removal is deliberate but premature for the V2 dashboard scope. Keep this decision separate from score/dashboard work. Decide whether to retain a reversible compatibility bridge during the Dashboard pilot or explicitly approve Planner retirement with migration messaging, replacement UX for dated work, cleanup of dead CSS/helpers, internal-doc alignment, and replacement/removal tests.

Evidence from the audit:

- Current changes remove legacy and Vue Planner implementations, store, dock wiring, shortcuts, and Planner tests.
- User-facing docs advertise only Kanban/Table while parity, shortcut, and migration docs still claim Planner exists.
- A skipped Playwright test still targets deleted Planner DOM; Planner CSS and temporal helpers remain as dead or partial legacy code.
- Card start/due and incomplete task-date metadata remain preserved in snapshots and integrations.

This card is intentionally human-gated; do not implement retirement from the V2 dashboard cards alone.

Owner decision (2026-08-04): retire Planner mercilessly. Proceed with a separate retirement cleanup covering runtime, stores, wiring, shortcuts, dead CSS/helpers, stale docs, parity claims, and obsolete tests. Preserve dated-work metadata and supported Kanban/Table paths; do not wait for a compatibility bridge.
