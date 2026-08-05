---
title: Attribute and isolate Impact display from broader dashboard/evaluator changes
createdAt: 2026-08-04T20:28:45.343Z
activity:
  - type: created
    at: 2026-08-04T20:28:45.343Z
signboard_v2:
  contract_version: 1
  kind: decision
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make the validated Impact display fix attributable without accepting unrelated dashboard or evaluator changes.
  scope: Attribute or isolate broader DashboardView/test and shared evaluator changes from the one-decimal display patch; preserve exact numeric sorting and evaluator semantics.
  acceptance_criteria:
    - The display-only diff is isolated, or every additional change has explicit scope attribution to another card.
    - Chip, accessible label, and popover header remain one-decimal and consistent.
    - Evaluator formulas, section membership, and sorting are not accepted under the display card without explicit decision.
  verification: Review the implementation diff against card 011, map overlapping hunks to existing cards, and rerun focused display/evaluator tests.
  status_summary: Implementation behavior passed review, but mixed Dashboard/evaluator scope requires attribution before acceptance.
  next_action: Resolve scope ownership, then request a second review of the isolated patch.
  estimate:
    effort_points: 2
---
Review found the one-decimal Impact display behavior correct but the shared worktree does not isolate it. DashboardView/tests contain broader section, risk, fallback, and dashboard changes, and shared/v2Evaluator.js contains formula, section-membership, and sorting modifications relative to HEAD. Attribute the overlapping changes to existing cards or isolate the display-only patch before acceptance. Do not change the validated display rule or evaluator semantics without an explicit decision.


## Attribution audit result

The one-decimal formatter, display callsites, and three presentation assertions are attributable to this card. Broader DashboardView/test changes belong to the dashboard section adapter and Impact semantics cards; `shared/v2Evaluator.js` belongs to evaluator/explanation/section work, not the display card.

Keep the display card on review hold until a hunk-level patch excludes unrelated Dashboard/evaluator hunks. Also review the formatter's invalid-value fallback (`0.0`) so missing data is not silently presented as a real score.
