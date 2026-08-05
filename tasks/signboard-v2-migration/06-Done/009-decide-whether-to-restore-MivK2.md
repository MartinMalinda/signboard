---
title: Decide whether to restore Table search and preserve temporal columns
statusChangedAt: 2026-08-04T21:27:52.708Z
createdAt: 2026-08-04T18:09:36.223Z
activity:
  - type: created
    at: 2026-08-04T18:09:36.223Z
  - type: moved-list
    at: 2026-08-04T21:27:52.708Z
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
  objective: Choose whether the Table rewrite preserves existing search and temporal-column behavior during V2 rollout.
  scope: Decide the compatibility boundary for board search and Start/Due/Updated/Created columns; separate any broader Table redesign from V2 dashboard adapters.
  acceptance_criteria:
    - The owner decision explicitly chooses restore-and-preserve or separately staged redesign.
    - The chosen path includes regression coverage for search, temporal columns, and V2 View-all behavior.
    - The V2 dashboard card accepts only the bounded projection/section adapter that the decision authorizes.
  verification: Review the Table audit evidence and current board-view tests before approving implementation.
  status_summary: The current Table rewrite removes existing behavior and is held for owner judgment.
  next_action: Obtain the compatibility decision before assigning Table restoration or redesign work.
  estimate:
    effort_points: 3
---
The Table audit found that the current broad rewrite removed board-search filtering and visible Start, Due, Updated, and Created columns while also changing the renderer. Accept only the V2 projection plus section-aware View-all behavior under the V2 dashboard work if the owner confirms that compatibility is preserved.

Decision options:

- Restore search state/query propagation and legacy filtering behavior, preserving temporal columns while reviewing the V2 projection separately.
- Explicitly approve a Table redesign as a separate change with migration notes, replacement behavior, and regression coverage.

This card is intentionally human-gated because the scope materially changes existing Table behavior.

Owner decision (2026-08-04): do not restore board-wide Table text search. Cmd/Ctrl+K is the intended global search and board/card switcher. Temporal-column visibility was not explicitly decided here and is split into a separate Ready decision.
Owner decision (2026-08-04): do not restore board-wide Table text search; use Cmd/Ctrl+K as global search and switching. Keep the visible Start, Due, Updated, and Created columns removed. Preserve underlying date metadata and temporal behavior unless separately changed.
