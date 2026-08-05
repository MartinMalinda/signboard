---
title: Render missing Impact breakdown terms as unavailable
statusChangedAt: 2026-08-04T21:14:07.853Z
createdAt: 2026-08-04T21:11:07.789Z
activity:
  - type: created
    at: 2026-08-04T21:11:07.789Z
  - type: moved-list
    at: 2026-08-04T21:11:22.172Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T21:14:07.853Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 02-Ready
    toListDisplayName: 02-Ready
signboard_v2:
  contract_version: 1
  kind: task
  work_type: ux
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Distinguish valid zero Impact terms from missing or invalid terms in the breakdown popover.
  scope: Use existing evaluator provenance in the display layer to show valid zero as 0.0 and missing/invalid terms as Unavailable or Incomplete; preserve aggregate guards, formulas, ranking, and applicability schema.
  acceptance_criteria:
    - Explicit valid zero terms remain displayed as 0.0.
    - Missing terms are not presented as numeric zero.
    - Invalid terms are not presented as numeric zero.
    - Existing evaluator provenance is used without changing formulas or ranking.
    - Focused tests cover valid zero, missing, and invalid display states.
  verification: Run focused ImpactScorePopover/Dashboard tests, V2 evaluator tests, and board snapshot tests.
  status_summary: Discovery confirmed a provenance-aware display fix is warranted and bounded.
  next_action: Assign implementation, then review only the display and regression diff.
  estimate:
    effort_points: 2
---
Implement the bounded provenance-aware Impact breakdown display validated by discovery card 001. Keep explicit valid zero values as `0.0`, but render missing or invalid breakdown terms as `Unavailable` or `Incomplete` using existing evaluator provenance passed through snapshots. Do not alter evaluator formulas, ranking, or introduce a not_applicable schema; preserve the existing aggregate-score guard.

## Development attempt\n\nA developer agent confirmed the required provenance is already available through missing_fields, defaults_applied, and warnings, but made no changes because ImpactScorePopover.vue, DashboardView.vue, evaluator, snapshot types, and tests are already mixed with unrelated dirty-worktree changes. Keep this card Ready until a cleanly attributable display hunk can be isolated; no formulas or ranking changes are authorized.