---
title: Define scored, not-applicable, and incomplete value states
labels:
  - discovery
  - data-model
  - ux
  - testing
statusChangedAt: 2026-08-04T17:55:11.741Z
createdAt: 2026-08-04T17:32:11.847Z
activity:
  - type: created
    at: 2026-08-04T17:32:11.847Z
  - type: moved-list
    at: 2026-08-04T17:38:07.603Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T17:55:11.741Z
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
  objective: Prevent blank, not-applicable, and zero scoring states from being conflated.
  scope: Audit value-group inputs and work-type validation; define explicit applicability states and anchored 1-5 controls while keeping minimally shaped and legacy cards saveable.
  acceptance_criteria:
    - Opportunity, risk prevented, engineering health, and enablement states are specified.
    - Security/privacy/correctness and other work-type validation expectations are explicit.
    - No generic midpoint values are invented for blank fields.
    - The evaluator, editor, and fixture changes needed for a bounded follow-up are listed.
  verification: Run current evaluator fixtures against blank, zero, partial, and fully scored examples and document conservative behavior.
  status_summary: Feedback reports that blank risk fields are ambiguous across work types.
  next_action: Inspect current normalizers, evaluator defaults, and editor scoring controls for blank/zero handling.
  estimate:
    effort_points: 3
---
Discovery: audit scoring inputs and validation for work types such as security, product, engineering health, enablement, and discovery. Specify explicit applicability states, anchored controls, conservative defaults, and editor behavior without inventing midpoint values.

Validated discovery: shared/v2Evaluator.js normalizes omitted/partial numeric fields to 0, accepts explicit 0, and has no persisted not_applicable state. Opportunity/risk collapse to 0 when incomplete; engineering/enablement/discovery can receive partial scores; fully gated cards with no value groups can still be eligible with priority_index 0. ImpactScorePopover can also display a zero effort factor for missing effort. Existing tests pass, but no N/A, zero-vs-blank, partial-group, or security/privacy applicability matrix exists. Proposed bounded follow-up: group-level incomplete/scored/not_applicable states, preserve legacy zero compatibility, add shared work-type validation, and cover evaluator/snapshot/editor fixtures. Keep semantics in Ready/To-do pending product review.
