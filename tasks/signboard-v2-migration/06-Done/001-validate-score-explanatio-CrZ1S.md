---
title: Validate score explanations against the evaluator output
labels:
  - discovery
  - data-model
  - dashboard
  - testing
statusChangedAt: 2026-08-04T17:55:10.042Z
createdAt: 2026-08-04T17:32:11.076Z
activity:
  - type: created
    at: 2026-08-04T17:32:11.076Z
  - type: moved-list
    at: 2026-08-04T17:37:29.929Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T17:55:10.042Z
    fromListDirectoryName: 04-Review
    fromListDisplayName: 04-Review
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: "V2 product-development feedback specification (source of truth)"
  objective: Make every score-breakdown expression explain the exact evaluator result.
  scope: Trace one reported discrepancy through the evaluator, snapshot projection, dashboard, and score popover; do not change formulas unless reproduction proves the formula is wrong.
  acceptance_criteria:
    - The reported mismatch is reproduced or explicitly disproved with a named fixture.
    - The source of displayed score terms and the numeric result is identified.
    - A bounded implementation card is proposed only if the discrepancy is real.
    - Regression cases cover strategic-fit and priority-class multiplier variants.
  verification: Run the focused evaluator/dashboard/card-popover tests and compare the rendered expression with the calculator output.
  status_summary: Feedback reports stale or independently reconstructed score terms.
  next_action: Trace the score result and explanation fields to their source symbols.
  estimate:
    effort_points: 3
---
Discovery: reproduce the reported score-breakdown discrepancy across evaluator, snapshot, dashboard, and card popover. Decide the smallest fix that makes displayed terms and result come from one structured explanation, with regression coverage and no formula changes unless evidence requires it.

Delegated validation confirmed the discrepancy with scripts/test-v2-evaluator.js: P0 evaluator impact_index 92.2366 versus popover reconstruction 83.8514. shared/v2Evaluator.js applies strategic-fit 1.10 to P0/P1, while ImpactScorePopover.vue displays 1.00, matching the framework rule that P0/P1 ignore strategic fit. Even noncritical expressions can drift from rounded operands. Development scope: align impactIndex P0/P1 behavior, return structured explanation terms through the snapshot projection, render the popover from those terms, and add evaluator/snapshot/Vue regressions. Focused evaluator, snapshot, and six Dashboard Vue tests passed for the audit.
