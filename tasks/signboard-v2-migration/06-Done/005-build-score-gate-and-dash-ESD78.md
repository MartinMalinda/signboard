---
title: Build score, gate, and dashboard-view fixtures before enabling indexes
labels:
  - testing
  - data-model
  - dashboard
status: Done
statusChangedAt: 2026-08-03T17:03:50.262Z
signboard_id: ESD78
signboard_board: signboard-v2-migration
signboard_list: Done
signboard_uri: signboard://open-card?id=ESD78
createdAt: 2026-08-03T12:54:58.228Z
activity:
  - type: created
    at: 2026-08-03T12:54:58.228Z
  - type: moved-list
    at: 2026-08-03T17:03:43.534Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: Ready
    toListDirectoryName: 03-Active
    toListDisplayName: Active
  - type: moved-list
    at: 2026-08-03T17:03:44.519Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: Active
    toListDirectoryName: 04-Review
    toListDisplayName: Review
  - type: moved-list
    at: 2026-08-03T17:03:45.089Z
    fromListDirectoryName: 04-Review
    fromListDisplayName: Review
    toListDirectoryName: 05-Blocked
    toListDisplayName: Blocked
  - type: moved-list
    at: 2026-08-03T17:03:45.956Z
    fromListDirectoryName: 05-Blocked
    fromListDisplayName: Blocked
    toListDirectoryName: 06-Done
    toListDisplayName: Done
  - type: moved-list
    at: 2026-08-03T17:03:47.722Z
    fromListDirectoryName: 06-Done
    fromListDisplayName: Done
    toListDirectoryName: 05-Blocked
    toListDisplayName: Blocked
  - type: moved-list
    at: 2026-08-03T17:03:48.407Z
    fromListDirectoryName: 05-Blocked
    fromListDisplayName: Blocked
    toListDirectoryName: 06-Done
    toListDisplayName: Done
  - type: moved-list
    at: 2026-08-03T17:03:48.961Z
    fromListDirectoryName: 06-Done
    fromListDisplayName: Done
    toListDirectoryName: 05-Blocked
    toListDisplayName: Blocked
  - type: moved-list
    at: 2026-08-03T17:03:49.401Z
    fromListDirectoryName: 05-Blocked
    fromListDisplayName: Blocked
    toListDirectoryName: 06-Done
    toListDisplayName: Done
  - type: moved-list
    at: 2026-08-03T17:03:49.815Z
    fromListDirectoryName: 06-Done
    fromListDisplayName: Done
    toListDirectoryName: 05-Blocked
    toListDisplayName: Blocked
  - type: moved-list
    at: 2026-08-03T17:03:50.262Z
    fromListDirectoryName: 05-Blocked
    fromListDisplayName: Blocked
    toListDirectoryName: 06-Done
    toListDisplayName: Done
area: verification
depends_on:
  - Specify V2 score and gate evaluator as pure domain logic
  - Extend the batched board snapshot with an opt-in V2 card projection
enablement:
  downstream_value: 4
  downstream_breadth: 4
  critical_path: 4
engineering_health:
  maintenance_reduction: 3
  complexity_reduction: 2
  reliability_testability: 5
  recurring_time_saved: 4
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 1
evidence:
  - tasks/V2-project-management.md
  - scripts/test-board-snapshot.js
  - signboard-vue/src/__tests__/planner.spec.ts
execution:
  specification_clarity: 4
  verification_strength: 5
  boundedness: 5
  isolation: 5
  coordination_complexity: 1
framework_status: ready
framework_version: 1
kind: task
modifiers:
  confidence: 4
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 1
next_action: Build fixtures for gates, scoring inputs, eligibility, and the first five sections.
priority_class: P2
risk_prevented:
  likelihood: 3
  harm: 4
  blast_radius: 4
  mitigation_effectiveness: 4
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  depends_on:
    - Specify V2 score and gate evaluator as pure domain logic
    - Extend the batched board snapshot with an opt-in V2 card projection
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 1
  status_summary: Formula-heavy framework needs deterministic fixtures before rankings are trusted.
  next_action: Build fixtures for gates, scoring inputs, eligibility, and the first five sections.
  risk_prevented:
    likelihood: 3
    harm: 4
    blast_radius: 4
    mitigation_effectiveness: 4
  engineering_health:
    maintenance_reduction: 3
    complexity_reduction: 2
    reliability_testability: 5
    recurring_time_saved: 4
  enablement:
    downstream_value: 4
    downstream_breadth: 4
    critical_path: 4
  modifiers:
    confidence: 4
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 1
  execution:
    specification_clarity: 4
    verification_strength: 5
    boundedness: 5
    isolation: 5
    coordination_complexity: 1
  eligibility:
    readiness: true
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
status_summary: Formula-heavy framework needs deterministic fixtures before rankings are trusted.
work_type: correctness
---
# Fixture families

- P0/P1 cards that outrank P2 regardless of ordinary score.
- P2 cards with missing fields and conservative confidence.
- Quick wins with effort, verification, reversibility, and confidence gates.
- Agent cards capped by behavior surface, data sensitivity, or priority.
- Human-led high-leverage cards with strong value but unsafe autonomy.
- Blocked cards with explicit dependency and next action.
- Legacy cards with no V2 metadata.

# Acceptance criteria

- [ ] Every section has positive and negative fixtures.
- [ ] Expected order is asserted, not just membership.
- [ ] Reason codes explain exclusion and inclusion.
- [ ] Formula versions can change without rewriting historical evidence.

# Objective

Build deterministic fixtures that prove V2 gates, ranking order, reason codes, and conservative defaults before any computed index is trusted by the Dashboard.

# Scope

Cover the accepted evaluator outputs and the five initial Dashboard sections. Keep deferred Quick Win and QA formulas explicitly unimplemented rather than inventing thresholds.

# Verification

- Assert exact order, inclusion, exclusion, defaults, and reason codes for positive and negative fixtures.
- Run the evaluator fixture suite with a versioned formula identifier.
- Rollback: fixtures are test-only and do not alter stored card metadata or historical evidence.
