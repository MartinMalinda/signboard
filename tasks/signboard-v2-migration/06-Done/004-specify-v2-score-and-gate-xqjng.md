---
title: Specify V2 score and gate evaluator as pure domain logic
historical: true
labels:
  - discovery
  - data-model
  - testing
  - agent
createdAt: 2026-08-03T12:54:57.018Z
activity:
  - type: created
    at: 2026-08-03T12:54:57.018Z
area: scoring
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  - Define per-board project profile and dashboard contract
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 4
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 2
evidence:
  - tasks/V2-project-management.md
  - signboard-vue/lib/
  - lib/boardSnapshot.js
execution:
  specification_clarity: 3
  verification_strength: 3
  boundedness: 4
  isolation: 4
  coordination_complexity: 2
  autonomous_execution_blocked: true
  do_not_autorun: true
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 1
next_action: Implement the pure evaluator only after the shared metadata/profile seams are available.
priority_class: P2
status_summary: 'Decision accepted: evaluator is pure, conservative, versioned, and gate-first; Quick Win and QA formulas remain deferred.'
work_type: enablement
signboard_v2:
  contract_version: 1
  kind: discovery
  priority_class: P2
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
    - Define per-board project profile and dashboard contract
  blocked_by: []
  estimate:
    effort_points: 3
  modifiers:
    confidence: 3
    urgency: 3
    maintenance_delta: 1
---
# Accepted decision

The evaluator accepts normalized domain data and returns versioned value, priority, delivery-risk, and dashboard projections. It has no filesystem, Electron, or Vue dependency. Priority class is applied before ordinary ranking; relationships and list-derived stage provide context for dashboard membership. Missing value fields remain visible and conservative. Blocked work may be scored but belongs in the Blocked view.

Support the reference formulas for opportunity, risk reduction, core value, priority, impact, and delivery risk in version 1. Do not silently add fields or formula inputs that are not in the trimmed contract.

# First supported outputs

- Opportunity and risk-reduction scores.
- Core value, Priority Index, Positive Impact, and Impact Index.
- Delivery risk.
- Critical, Next best work, Low-hanging fruit, and Blocked section membership.

# Rules

Missing fields must not look like high confidence. P0/P1 classes remain stronger than ordinary score. Problem risk and delivery risk stay separate. The evaluator must be callable from renderer, CLI, and MCP-facing code without duplicated formulas. Narrative content is read from the body, not duplicated as normalized card attributes.

# Acceptance criteria

- [x] Inputs and outputs are typed or schema-documented.
- [x] Defaults are conservative and visible.
- [x] Priority classes and blocked relationships are explicit.
- [x] No filesystem, Electron, or Vue dependency.

# Objective

Specify a pure, deterministic, conservative evaluator boundary that later consumers can share without duplicating formulas or bypassing gates.

# Scope

Define normalized inputs/outputs, defaults, supported formulas, and dashboard projections; leave evaluator implementation and fixtures to ready cards.

# Verification

Decision reviewed against the trimmed framework formulas and tested conceptually against sparse, blocked, and P0/P1 cases.
