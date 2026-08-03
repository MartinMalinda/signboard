---
title: 'Framework baseline: gates, value dimensions, and execution policy'
labels:
  - discovery
  - agent
  - docs
createdAt: 2026-08-03T12:54:56.565Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.565Z
area: framework
discovery_value:
  uncertainty_reduction: 4
  decision_importance: 4
  cost_of_wrong_choice: 4
estimate:
  effort_points: 2
  implementation_complexity: 1
  coordination_complexity: 1
evidence:
  - tasks/V2-project-management.md
execution:
  specification_clarity: 5
  verification_strength: 4
  boundedness: 5
  isolation: 5
  coordination_complexity: 1
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 5
  strategic_fit: 4
  urgency: 2
  maintenance_delta: 1
next_action: Use the decision cards to choose the compatible V2 subset.
priority_class: P2
status_summary: Framework concepts triaged into implementation-relevant groups.
verification:
  plan: Cross-check child decisions against the framework sections before implementation.
  tests:
    - framework document review
  rollback: Planning-only card.
  observation: Review when V2 learns from real project usage.
work_type: documentation
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: documentation
  priority_class: P2
  verification:
    plan: Cross-check child decisions against the framework sections before implementation.
    tests:
      - framework document review
    rollback: Planning-only card.
    observation: Review when V2 learns from real project usage.
  estimate:
    effort_points: 2
    implementation_complexity: 1
    coordination_complexity: 1
  status_summary: Framework concepts triaged into implementation-relevant groups.
  next_action: Use the decision cards to choose the compatible V2 subset.
  discovery_value:
    uncertainty_reduction: 4
    decision_importance: 4
    cost_of_wrong_choice: 4
  modifiers:
    confidence: 5
    strategic_fit: 4
    urgency: 2
    maintenance_delta: 1
  execution:
    specification_clarity: 5
    verification_strength: 4
    boundedness: 5
    isolation: 5
    coordination_complexity: 1
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Preserve in V2

- Priority class is a hard gate; P0/P1 must not be outranked by ordinary score.
- Readiness and dependency eligibility precede ranking.
- Execution policy is separate from business value.
- Positive opportunity, risk reduction, engineering health, enablement, and discovery value are distinct dimensions.
- Problem risk and delivery risk are different.
- Specialized views answer different questions: Critical, Quick Wins, Agent Queue, Human-led High-leverage, Engineering Health, Unlockers, Validate Before Building, Blocked, and Stale Assumptions.
- Scores are reviewable ranking instruments, not objective truth.

# V2 interpretation

The first product slice should hardcode only a small set of product-development attributes and compute a small set of useful sections. The rest can remain generic metadata or later extensions.

An agent-pick score is only useful if the metadata is normalized and visible to the same evaluator used by desktop, CLI, and MCP.

# Objective

Identify the framework concepts that must survive into V2 and the concepts that should remain deferred until real product usage justifies them.

# Acceptance criteria

- [x] Priority, readiness/dependency, execution policy, value dimensions, and risk separation are preserved.
- [x] The first V2 slice is bounded to a small normalized attribute set and useful sections.
- [x] Deferred formula and governance concepts are left for explicit follow-up cards.

# Verification

Cross-checked against the framework sections in tasks/V2-project-management.md and used as input to the accepted shaping decisions.
