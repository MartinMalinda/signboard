---
title: Specify V2 score and gate evaluator as pure domain logic
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
discovery_value:
  uncertainty_reduction: 5
  decision_importance: 4
  cost_of_wrong_choice: 4
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
  work_type: enablement
  priority_class: P2
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
    - Define per-board project profile and dashboard contract
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 2
  status_summary: 'Decision accepted: evaluator is pure, conservative, versioned, and gate-first; Quick Win and QA formulas remain deferred.'
  next_action: Implement the pure evaluator only after the shared metadata/profile seams are available.
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 4
  discovery_value:
    uncertainty_reduction: 5
    decision_importance: 4
    cost_of_wrong_choice: 4
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 1
  execution:
    specification_clarity: 3
    verification_strength: 3
    boundedness: 4
    isolation: 4
    coordination_complexity: 2
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
# Accepted decision

The evaluator accepts normalized domain data and returns versioned scores, visible defaults/warnings, gate results, reason codes, autonomy/QA classes, and section membership. It has no filesystem, Electron, or Vue dependency. Selection is lexicographic: priority gate, readiness, dependency eligibility, execution-policy gate, then mode-specific score and stable ID tie-breaker. Missing value fields default conservatively and are reported; missing readiness/dependency/policy state fails the relevant gate. P0/P1 work remains mandatory but is never autonomous; blocked work may be scored but is not execution-eligible.

Support the reference formulas for core value, priority, delivery risk, autonomy, and Agent Pick Index in version 1. Return `null` plus an explicit reason for `quick_win_index`, QA levels, human-leverage thresholds, and any formula not yet specified. Do not silently approximate them.

# First supported outputs

- Priority gate and critical queue order.
- Readiness and dependency eligibility.
- Core value using the dominant-value model.
- Delivery risk and QA level.
- Autonomy score/class with hard caps.
- Agent Pick Index and Quick Win Index.
- Section membership plus reason codes.

# Rules

Missing fields must not look like high confidence. P0/P1 gates remain lexicographically stronger than ordinary score. Problem risk and delivery risk stay separate. The evaluator must be callable from renderer, CLI, and MCP-facing code without duplicated formulas.

# Acceptance criteria

- [x] Inputs and outputs are typed or schema-documented.
- [x] Defaults are conservative and visible.
- [x] Hard gates are explicit and tested.
- [x] No filesystem, Electron, or Vue dependency.

# Objective

Specify a pure, deterministic, conservative evaluator boundary that later consumers can share without duplicating formulas or bypassing gates.

# Scope

Define normalized inputs/outputs, defaults, hard gates, supported formulas, reason codes, and deferred outputs; leave evaluator implementation and fixtures to ready cards.

# Verification

Decision reviewed against the framework reference formulas and tested conceptually against sparse, blocked, P0/P1, dependency-ineligible, and autonomous-policy cases.
