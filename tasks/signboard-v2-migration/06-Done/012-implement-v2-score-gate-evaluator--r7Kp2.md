---
title: Implement the pure V2 score and gate evaluator
labels:
  - data-model
  - testing
  - agent
createdAt: 2026-08-03T16:00:00.000Z
activity:
  - type: created
    at: 2026-08-03T16:00:00.000Z
area: scoring
blocks:
  - Extend the batched board snapshot with an opt-in V2 card projection
depends_on:
  - 'Specify V2 score and gate evaluator as pure domain logic'
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
engineering_health:
  maintenance_reduction: 4
  complexity_reduction: 3
  reliability_testability: 5
  recurring_time_saved: 4
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 2
evidence:
  - tasks/V2-project-management.md
  - tasks/signboard-v2-migration/06-Done/004-specify-v2-score-and-gate-xqjng.md
  - lib/boardLabels.js
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 4
  isolation: 5
  coordination_complexity: 2
  autonomous_execution_blocked: false
  agent_execution_blocked: false
  do_not_autorun: false
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 1
next_action: Unblock snapshot projection and keep all downstream consumers on this evaluator seam.
priority_class: P2
status_summary: Evaluator implementation passed independent formula, gate, policy, and determinism review; snapshot projection may resume.
work_type: enablement
signboard_v2:
  contract_version: 1
  kind: task
  work_type: enablement
  priority_class: P2
  depends_on:
    - Specify V2 score and gate evaluator as pure domain logic
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  estimate:
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 2
  status_summary: Evaluator implementation passed independent formula, gate, policy, and determinism review; snapshot projection may resume.
  next_action: Unblock snapshot projection and keep all downstream consumers on this evaluator seam.
  engineering_health:
    maintenance_reduction: 4
    complexity_reduction: 3
    reliability_testability: 5
    recurring_time_saved: 4
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 5
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 1
  execution:
    specification_clarity: 4
    verification_strength: 4
    boundedness: 4
    isolation: 5
    coordination_complexity: 2
    autonomous_execution_blocked: false
    agent_execution_blocked: false
    do_not_autorun: false
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Objective

Implement one pure, deterministic V2 evaluator that accepts normalized card/profile data and returns conservative scores, hard-gate results, reason codes, autonomy/QA classes, and section memberships.

# Scope

Implement only the accepted version-1 formulas and gate order: priority, readiness, dependencies, execution policy, core value, delivery risk, autonomy, Agent Pick Index, and the five initial Dashboard section memberships. Missing fields must be visible and conservative. Return explicit deferred reason codes for Quick Win and QA formulas that lack a specification.

Keep the module independent of filesystem, Electron, Vue, and UI state. Do not add snapshot wiring or Dashboard rendering in this card.

# Acceptance criteria

- [x] Inputs and outputs are schema-documented and versioned.
- [x] Identical normalized input produces deterministic output without I/O.
- [x] Missing values/defaults and warnings are visible; sparse cards cannot become execution-eligible.
- [x] P0/P1 gates outrank ordinary scores; blocked/dependency-ineligible cards remain non-executable.
- [x] `agent_execution_blocked` forces zero autonomy and `autonomous_execution_blocked` applies the specified cap.
- [x] Every section result includes deterministic reason codes and stable tie-break inputs.
- [x] Deferred formulas return null/explicit `FORMULA_DEFERRED` rather than invented values.

# Verification

- Run deterministic unit fixtures for critical, blocked, dependency-ineligible, sparse, low-risk, discovery, and agent-policy cases.
- Compare implemented formulas with the reference formulas in `tasks/V2-project-management.md` section 45.
- Rollback: remove the evaluator module and fixture imports; no persisted card or board data changes.

# Implementation evidence

- `shared/v2Evaluator.js` is a pure UMD-compatible module with no filesystem, Electron, Vue, or UI imports.
- `scripts/test-v2-evaluator.js` covers complete, critical, blocked, sparse, agent-blocked, autonomous-cap, and deferred-formula cases.
- `npm run test:v2-evaluator` passes.
- Independent read-only review confirmed formula parity, conservative gates, policy hard caps, deterministic section ordering, and no remaining blocker.
