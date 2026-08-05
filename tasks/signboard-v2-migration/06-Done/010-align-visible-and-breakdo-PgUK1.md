---
title: Align visible and breakdown Impact score formatting
statusChangedAt: 2026-08-04T19:26:39.233Z
createdAt: 2026-08-04T18:08:21.060Z
activity:
  - type: created
    at: 2026-08-04T18:08:21.060Z
  - type: moved-list
    at: 2026-08-04T19:26:39.233Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make Impact score presentation consistent and understandable without changing score semantics.
  scope: Compare the Dashboard chip and ImpactScorePopover display format, label, rounding, and test coverage; leave evaluator formulas untouched.
  acceptance_criteria:
    - The visible score and breakdown follow one documented display rule.
    - The label distinguishes presentation from underlying evaluator semantics.
    - A focused regression test covers the shared formatting behavior.
  verification: Inspect the dashboard and popover render paths and run focused Vue tests; record any mismatch and the smallest fix.
  status_summary: UX triage found a visible precision and labeling mismatch for Impact scores.
  next_action: Validate the mismatch and promote only a bounded formatting fix.
  estimate:
    effort_points: 2
---
Validate the reported ambiguity between the rounded dashboard Impact chip and the one-decimal breakdown, both labeled “Impact score.” Define one shared display/formatting rule and a focused regression test if the mismatch is user-visible. Do not change scoring semantics in this card.


## Validation result

Confirmed: the mismatch is presentation-only. The evaluator and snapshot expose the same exact `impact_index`; DashboardView rounds it to an integer while ImpactScorePopover shows one decimal, and both label it “Impact score.”

Recommendation: promote to development. Display the exact evaluator value to one decimal in the chip, accessible label, and popover header; keep full precision for sorting and semantics. Add a focused regression and do not change evaluator formulas.

Verification: evaluator, board snapshot, DashboardView, and dashboard-section checks passed; existing tooltip warnings are test-only.