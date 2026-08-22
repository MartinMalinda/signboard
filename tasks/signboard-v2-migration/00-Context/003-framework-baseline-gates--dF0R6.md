---
title: 'Framework baseline: priority, value dimensions, and delivery risk'
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
  priority_class: P2
  parent: null
  depends_on: []
  blocked_by: []
  estimate:
    effort_points: 2
  discovery_value:
    uncertainty_reduction: 4
    decision_importance: 4
    cost_of_wrong_choice: 4
  modifiers:
    confidence: 5
    urgency: 2
    maintenance_delta: 1
---
# Preserve in V2

- `signboard_v2` is additive, namespaced, and limited to the exact trimmed card contract.
- The Markdown body is the source of truth for narrative project information.
- Stage/status comes from the card's list directory.
- Parent, dependency, and blocker relationships remain structured and distinct.
- Opportunity, risk prevented, and discovery value are the supported value dimensions.
- Delivery risk remains separate from the risk being addressed.
- Scores are reviewable ranking instruments, not objective truth.

# V2 interpretation

The product slice should hardcode only the trimmed card attributes and compute a small set of useful dashboard sections. Narrative detail stays in the body, and labels provide optional classification.

The same evaluator should be shared by desktop, CLI, and MCP so derived scores do not diverge.

# Objective

Identify the framework concepts that must survive into V2 and the concepts that should remain deferred until real product usage justifies them.

# Acceptance criteria

- [x] Priority class, relationships, value dimensions, delivery risk, and list-derived stage are preserved.
- [x] The first V2 slice is bounded to the exact trimmed attribute set and useful sections.
- [x] Narrative content is explicitly assigned to the card body.

# Verification

Cross-checked against the framework sections in tasks/V2-project-management.md and used as input to the accepted shaping decisions.
