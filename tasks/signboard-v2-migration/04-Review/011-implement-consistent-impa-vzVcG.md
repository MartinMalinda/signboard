---
title: Implement consistent Impact score display formatting
statusChangedAt: 2026-08-04T19:31:09.819Z
createdAt: 2026-08-04T19:26:43.318Z
activity:
  - type: created
    at: 2026-08-04T19:26:43.318Z
  - type: moved-list
    at: 2026-08-04T19:28:26.148Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T19:31:09.819Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: ux
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make Impact score presentation consistent without changing evaluator semantics.
  scope: Use the exact evaluator impact_index as the display source, format it to one decimal in the dashboard chip and popover/accessibility copy, and add regression coverage.
  acceptance_criteria:
    - Dashboard chip and popover header show the same one-decimal Impact score.
    - Accessible labeling follows the same presentation rule.
    - Full-precision values remain available for sorting and semantics.
    - Evaluator formulas and priority logic are unchanged.
  verification: Run evaluator, board snapshot, DashboardView, dashboard-section, and focused formatting tests.
  status_summary: Discovery reproduced a presentation-only integer versus one-decimal mismatch.
  next_action: Assign bounded UI implementation, then review the diff and regression assertion.
  estimate:
    effort_points: 2
---
Implement the bounded Impact score display fix validated by discovery card 010. Use the evaluator's exact impact_index as the source, display one decimal everywhere labeled “Impact score,” and add a regression covering the dashboard chip, accessible label, and popover header. Preserve full precision for sorting and semantics; do not change evaluator formulas or priority logic.

## Development result\n\nImplemented a shared one-decimal Impact score presentation path across DashboardView and ImpactScorePopover, added focused regression coverage, and left evaluator formulas, sorting, and priority logic unchanged. Two focused Vue files (9 tests), V2 evaluator, and board snapshot checks passed; git diff --check passed. Type-check remains blocked by pre-existing unused @ts-expect-error directives in v2StageSemantics.ts.\n\nReview request: verify the formatting change is display-only and the diff contains no unrelated scope.

## Review result: revise

The display behavior is correct: exact numeric `scores.impact_index` remains the source, chip/accessibility label/popover header share one-decimal formatting, sorting stays numeric, and focused Dashboard/section, evaluator, snapshot, and diff checks pass.

Scope hold: DashboardView/tests include broader section, risk, fallback, and dashboard behavior changes, while `shared/v2Evaluator.js` includes formula, section-membership, and sorting changes relative to HEAD. Keep this card in Review until overlapping work is attributed or isolated; no evaluator logic should be accepted under this display-only card without explicit scope.
Attribution audit confirms the formatter, display callsites, and three presentation assertions belong here. Broader Dashboard/evaluator changes belong to existing adapter/evaluator cards; keep this Review card unreleased until a hunk-level patch is isolated, and review invalid-value fallback behavior.