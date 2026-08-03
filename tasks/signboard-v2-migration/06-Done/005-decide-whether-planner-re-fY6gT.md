---
title: Decide whether Planner remains a V2 surface or is retired
labels:
  - discovery
  - dashboard
  - renderer
  - migration
createdAt: 2026-08-03T13:03:14.570Z
activity:
  - type: created
    at: 2026-08-03T13:03:14.570Z
area: workspace-navigation
delivery:
  regression_likelihood: 3
  change_blast_radius: 3
  reversibility: 4
  behavior_surface: 3
  data_sensitivity: 1
depends_on:
  - Define per-board project profile and dashboard contract
  - Create the first V2 dashboard surface beside Kanban and Table
discovery_value:
  uncertainty_reduction: 5
  decision_importance: 4
  cost_of_wrong_choice: 3
enablement:
  downstream_value: 4
  downstream_breadth: 3
  critical_path: 3
engineering_health:
  maintenance_reduction: 4
  complexity_reduction: 4
  reliability_testability: 2
  recurring_time_saved: 4
estimate:
  effort_points: 2
  implementation_complexity: 1
  coordination_complexity: 2
evidence:
  - app/board/plannerView.js
  - signboard-vue/src/components/planner/
  - signboard-vue/src/stores/usePlannerStore.ts
  - signboard-vue/src/__tests__/planner.spec.ts
  - lib/boardSnapshot.js
execution:
  specification_clarity: 3
  verification_strength: 3
  boundedness: 4
  isolation: 3
  coordination_complexity: 2
  autonomous_execution_blocked: true
  agent_execution_blocked: false
  do_not_autorun: true
  required_reviews:
    - product
    - architecture
    - UX
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 4
  strategic_fit: 4
  urgency: 2
  maintenance_delta: 2
next_action: Preserve Planner as a temporary compatibility path while Dashboard replacement is piloted; do not add a fourth V2 dock slot.
priority_class: P2
status_summary: 'Decision accepted: Dashboard replaces Planner as the V2 attention surface, with a reversible compatibility bridge.'
verification:
  plan: Compare current Planner responsibilities with the proposed V2 dashboard and date/task metadata consumers.
  tests:
    - navigation decision record
    - component/dependency inventory
  rollback: Keep Planner behind the existing compatibility path until replacement behavior is proven.
  observation: Review usage after the V2 dashboard pilot; do not treat existing implementation as evidence of demand.
work_type: product
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: product
  priority_class: P2
  verification:
    plan: Compare current Planner responsibilities with the proposed V2 dashboard and date/task metadata consumers.
    tests:
      - navigation decision record
      - component/dependency inventory
    rollback: Keep Planner behind the existing compatibility path until replacement behavior is proven.
    observation: Review usage after the V2 dashboard pilot; do not treat existing implementation as evidence of demand.
  depends_on:
    - Define per-board project profile and dashboard contract
    - Create the first V2 dashboard surface beside Kanban and Table
  estimate:
    effort_points: 2
    implementation_complexity: 1
    coordination_complexity: 2
  status_summary: 'Decision accepted: Dashboard replaces Planner as the V2 attention surface, with a reversible compatibility bridge.'
  next_action: Preserve Planner as a temporary compatibility path while Dashboard replacement is piloted; do not add a fourth V2 dock slot.
  engineering_health:
    maintenance_reduction: 4
    complexity_reduction: 4
    reliability_testability: 2
    recurring_time_saved: 4
  enablement:
    downstream_value: 4
    downstream_breadth: 3
    critical_path: 3
  discovery_value:
    uncertainty_reduction: 5
    decision_importance: 4
    cost_of_wrong_choice: 3
  modifiers:
    confidence: 4
    strategic_fit: 4
    urgency: 2
    maintenance_delta: 2
  delivery:
    regression_likelihood: 3
    change_blast_radius: 3
    reversibility: 4
    behavior_surface: 3
    data_sensitivity: 1
  execution:
    specification_clarity: 3
    verification_strength: 3
    boundedness: 4
    isolation: 3
    coordination_complexity: 2
    autonomous_execution_blocked: true
    agent_execution_blocked: false
    do_not_autorun: true
    required_reviews:
      - product
      - architecture
      - UX
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Decision

Planner is currently implemented but unused. V2 replaces its primary attention-surface role with Dashboard and keeps a temporary compatibility bridge while the pilot is validated. Disabling V2 restores the existing Kanban/Planner route without changing card data. Planner can be retired only after usage and replacement verification.

# Preserve independently

- Card-level start and due metadata.
- Incomplete task date parsing where it remains useful.
- Snapshot-level date/task data if other views or integrations consume it.
- A safe migration path for users who depend on current Planner behavior.

# Do not assume

- The V2 dashboard must coexist with the Planner UI.
- Planner-specific view state should become part of the V2 board profile.
- Existing Planner components justify continued maintenance.

# Acceptance criteria

- [x] Choose replacement with a temporary compatibility bridge.
- [x] Preserve card-level start/due, incomplete task date parsing, and snapshot date/task data independently.
- [x] Define the user-visible migration and profile-level rollback path.
- [x] Remove Planner from the required V2 dashboard hierarchy.

# Objective

Decide whether Planner remains part of the V2 workspace while preserving date/task capabilities that other consumers need.

# Scope

Choose the V2 navigation role, compatibility bridge, rollback path, and independently preserved temporal metadata; do not implement or delete Planner here.

# Verification

Decision reviewed against Planner responsibilities, snapshot consumers, date/task parsing, and the reversible V2 profile boundary.
