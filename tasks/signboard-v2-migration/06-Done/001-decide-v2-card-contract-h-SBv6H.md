---
title: 'Decide V2 card contract: hardcoded attributes versus generic fields'
historical: true
labels:
  - discovery
  - data-model
  - agent
createdAt: 2026-08-03T12:54:56.699Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.699Z
area: card-contract
depends_on:
  - 'Current architecture baseline: file-backed boards, snapshots, and views'
  - 'Framework baseline: gates, value dimensions, and execution policy'
discovery_value:
  uncertainty_reduction: 5
  decision_importance: 5
  cost_of_wrong_choice: 5
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 3
evidence:
  - tasks/V2-project-management.md
  - lib/cardFrontmatter.js
  - lib/cardLifecycle.js
execution:
  specification_clarity: 2
  verification_strength: 2
  boundedness: 3
  isolation: 2
  coordination_complexity: 3
  autonomous_execution_blocked: true
  do_not_autorun: true
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Use the accepted contract to define the shared V2 normalizer and migration fixtures.
priority_class: P2
status_summary: 'Decision accepted: V2 metadata is additive, namespaced, legacy-safe, and list-derived for status.'
work_type: product
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: product
  priority_class: P2
  depends_on:
    - 'Current architecture baseline: file-backed boards, snapshots, and views'
    - 'Framework baseline: gates, value dimensions, and execution policy'
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 3
  status_summary: 'Decision accepted: V2 metadata is additive, namespaced, legacy-safe, and list-derived for status.'
  next_action: Use the accepted contract to define the shared V2 normalizer and migration fixtures.
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 5
  discovery_value:
    uncertainty_reduction: 5
    decision_importance: 5
    cost_of_wrong_choice: 5
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: -1
  execution:
    specification_clarity: 2
    verification_strength: 2
    boundedness: 3
    isolation: 2
    coordination_complexity: 3
    autonomous_execution_blocked: true
    do_not_autorun: true
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Candidate first-class attributes

- kind: epic, task, discovery, incident.
- work_type: product, ux, security, correctness, reliability, engineering health, technical debt, discovery, documentation.
- priority_class: P0-P3 as a gate.
- framework_status while list folders remain the current stage source.
- estimate.effort_points.
- Separate problem-risk and delivery-risk inputs.
- Execution clarity, verification, boundedness, isolation, and policy blocks.
- Dependencies, blockers, evidence, and review dates.

# Accepted decision

Use an additive `signboard_v2` frontmatter namespace with `contract_version: 1` for opt-in runtime V2 cards. Validate `kind` and `priority_class`; keep the Phase 1 clarity fields canonical but optional (`work_type`, `objective`, `scope`, `acceptance_criteria`, `verification`, `parent`, `depends_on`, `estimate.effort_points`, `status_summary`, and `next_action`). Derive status from the list folder and keep lifecycle/Obsidian fields under their existing owners.

Do not infer V2 semantics from arbitrary unnamespaced frontmatter. Legacy cards remain valid and render normally. Scoring, autonomy, delivery-risk, and computed indexes are deferred until a later contract is accepted.

# Deferred questions

Which fields require validation? Which remain generic profile configuration? Should status remain list-derived initially? Which names avoid collisions with lifecycle and Obsidian metadata? Which fields are optional for legacy cards?

# Acceptance criteria

- [x] Field matrix marks hardcoded, generic, derived, or deferred.
- [x] Chosen fields have a stable namespace and migration rule.
- [x] A legacy card with no V2 fields still renders normally.
- [x] The first computed indexes are explicitly deferred; no score is part of the Phase 1 card contract.

# Objective

Choose the smallest stable V2 card metadata contract that supports product-development clarity without breaking arbitrary Markdown cards.

# Scope

Decide field ownership, namespace, legacy behavior, list-derived status, and deferred scoring; leave runtime normalization and migration implementation to the ready cards.

# Verification

Decision reviewed against the current frontmatter/lifecycle architecture and the compatibility requirements in the migration and framework documents.
