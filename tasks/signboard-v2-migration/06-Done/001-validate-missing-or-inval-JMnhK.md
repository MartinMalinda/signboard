---
title: Validate missing or invalid Impact score display state
statusChangedAt: 2026-08-04T21:11:07.613Z
createdAt: 2026-08-04T21:03:08.586Z
activity:
  - type: created
    at: 2026-08-04T21:03:08.586Z
  - type: moved-list
    at: 2026-08-04T21:11:07.613Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Ensure missing or invalid Impact inputs are not silently presented as a real zero score.
  scope: Trace the shared Impact formatter and its current callsites against evaluator/applicability states; do not change formulas, ranking, or score semantics.
  acceptance_criteria:
    - Invalid, missing, not-applicable, and valid zero states are distinguished or explicitly documented as equivalent.
    - The current formatter callsites are classified as safe or unsafe for a zero fallback.
    - Any follow-up is limited to display/state handling and preserves evaluator authority.
  verification: Inspect the formatter, Dashboard/Popover callsites, evaluator output states, and focused tests; record a minimal recommendation.
  status_summary: Review identified a possible display ambiguity when invalid Impact values become 0.0.
  next_action: Assign a discovery auditor and promote only if a concrete user-facing defect is confirmed.
  estimate:
    effort_points: 2
---
Validate whether the shared Impact score formatter can mask missing or invalid evaluator data by rendering `0.0`. Inspect its current callsites and existing score/applicability states. Decide whether invalid values should remain visibly unavailable, be omitted, or safely display zero under an explicit contract. Do not change evaluator formulas or ranking semantics in this discovery.


## Discovery result

Confirmed a concrete ambiguity in the breakdown popover. The aggregate Dashboard path returns null for invalid/missing impact_index, but ImpactScorePopover converts missing or invalid breakdown terms to `0.0`. Evaluator provenance already distinguishes explicit zero, missing fields/defaults, and invalid-score warnings, and snapshot passes that provenance through.

Recommendation: promote a small display-only follow-up. Render explicit valid zero as `0.0`, missing/invalid terms as `Unavailable` or `Incomplete`, and leave formulas/ranking unchanged. Defer a true not_applicable schema to the existing applicability decision.

Verification: V2 evaluator, board snapshot, focused Vue (15 tests), and internal-board metadata checks passed.