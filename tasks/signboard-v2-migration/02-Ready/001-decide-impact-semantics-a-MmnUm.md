---
title: Decide Impact semantics and P0-P3 policy before further dashboard growth
labels:
  - discovery
  - dashboard
  - ux
createdAt: 2026-08-04T17:32:11.269Z
activity:
  - type: created
    at: 2026-08-04T17:32:11.269Z
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Resolve the product meaning and gate behavior of Impact, Priority, and P0-P3.
  scope: Choose between true positive Impact and leverage-style scoring, define the relationship to Priority and Critical, and reserve P0/P1 for mandatory work; do not add dashboard sections yet.
  acceptance_criteria:
    - Impact, Priority, and P0-P3 each have one-sentence user-facing meanings.
    - The decision records formula/version and migration implications for current cards.
    - At least three representative cards show the expected ordering/gating.
    - Open product choices are called out for human review before implementation.
  verification: Review the decision against the V2 framework and current evaluator/dashboard fixtures; obtain product-owner confirmation before promotion.
  status_summary: Significant product-policy decision intentionally held in Ready/To-do.
  next_action: Prepare a concise decision brief with current examples and the two coherent Impact options.
  estimate:
    effort_points: 3
---
Decision card: choose whether Impact is true positive impact or leverage, define how Priority differs, and reserve P0/P1 for mandatory work. Record anchors, gates, examples, formula/version implications, and the minimum UI copy needed. Keep this in To-do/Ready pending product judgment.

Owner guidance (2026-08-04): use evidence to decide whether the current formula is more representative as true Impact or as Leverage. If the effort-adjusted formula is more representative, shift the user-facing meaning/name to Leverage rather than forcing the Impact label. Keep formula/version and migration implications explicit; implementation remains human-gated.