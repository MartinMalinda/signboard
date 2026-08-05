---
title: Decide and model explicit V2 value applicability states
labels:
  - discovery
  - data-model
  - ux
  - testing
createdAt: 2026-08-04T17:38:07.810Z
activity:
  - type: created
    at: 2026-08-04T17:38:07.810Z
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: "V2 product-development feedback specification (source of truth)"
  objective: "Agree on explicit V2 value applicability states before changing scoring semantics."
  scope: "Define group-level incomplete, scored, and not-applicable states, preserve legacy explicit zero compatibility, and align evaluator/snapshot/editor/fixtures without changing formulas prematurely."
  acceptance_criteria:
    - "Each value group has explicit state semantics and work-type guidance."
    - "Sparse cards cannot appear fully scoreable solely because missing values default to zero."
    - "Legacy zero and missing fields have documented compatibility behavior."
    - "Formula changes, if any, are separately identified and versioned."
  verification: "Review the applicability discovery card, framework anchors, and current fixtures; obtain product-owner confirmation before implementation."
  depends_on:
    - "Define scored, not-applicable, and incomplete value states"
  status_summary: "Human-gated scoring semantics decision; held in Ready/To-do."
  next_action: "Draft the applicability matrix and examples for product review."
  estimate:
    effort_points: 3
---
Decision/implementation-prep card: define group-level incomplete, scored, and not-applicable states for Opportunity, Risk prevented, Engineering health, Enablement, and Discovery. Preserve legacy explicit zero compatibility, prevent sparse cards from being treated as fully scoreable, and align evaluator, snapshot, editor, settings, and fixtures. Do not change ranking formulas until the state semantics are approved.
