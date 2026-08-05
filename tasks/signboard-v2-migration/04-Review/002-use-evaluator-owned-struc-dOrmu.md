---
title: Use evaluator-owned structured explanations for score popovers
labels:
  - data-model
  - dashboard
  - testing
  - renderer
statusChangedAt: 2026-08-04T17:47:11.238Z
createdAt: 2026-08-04T17:36:00.977Z
activity:
  - type: created
    at: 2026-08-04T17:36:00.977Z
  - type: moved-list
    at: 2026-08-04T17:39:05.139Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T17:47:11.238Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: "V2 product-development feedback specification (source of truth)"
  objective: Make the Impact score popover render the evaluator's exact terms and result.
  scope: Align the documented P0/P1 impact rule with the evaluator, then add only the structured explanation data needed by the current evaluator/snapshot path and ImpactScorePopover; preserve other dashboard sections and legacy cards.
  acceptance_criteria:
    - The evaluator returns the terms used to calculate impact_index, including the effective multipliers and effort factor.
    - The popover consumes evaluator-owned explanation data and no longer maintains a second formula lookup.
    - The rendered expression evaluates to the displayed score for strategic-fit and priority variants.
    - Focused evaluator and Vue regression coverage is added or updated.
    - P0/P1 impact ignores strategic fit as documented, while P2/P3 retain the configured multiplier.
    - No other formula/version change is made.
  verification: Run npm run test:v2-evaluator, the focused Vue dashboard/popover test with its required jsdom dependency, and npm run build:vue.
  depends_on:
    - Validate score explanations against the evaluator output
  status_summary: Ready after source-level validation; pending bounded implementation.
  next_action: Trace the snapshot projection shape, then implement the smallest explanation payload and test it.
  estimate:
    effort_points: 2
---
Implement the validated score-explanation fix: expose the exact evaluator terms needed by the Impact popover, consume them in Vue, and add regression coverage for strategic-fit variants. Do not change score formulas or add dashboard sections.

Development review evidence: evaluator-owned explanations are projected through shared/v2Evaluator.js and lib/boardSnapshot.js; ImpactScorePopover.vue no longer reconstructs formula terms. P0/P1 impact now ignores strategic fit while P2/P3 retain it. Agent-reported and independently rerun checks passed: npm run test:v2-evaluator, npm run test:board-snapshot, focused Dashboard/popover tests, npm run build:vue, and git diff --check. Move to Review for final acceptance.
Review hold: independent reviewer confirmed the bounded implementation checks pass, but the shared worktree mixes substantial unrelated Planner removal and a broad TableView rewrite that may remove board-search filtering. Keep this card in Review until those changes are separated or explicitly accepted; no runtime rollback was performed because the worktree contains pre-existing user changes.
