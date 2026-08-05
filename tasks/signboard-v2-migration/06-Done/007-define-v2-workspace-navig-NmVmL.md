---
title: 'Define V2 workspace navigation: Dashboard, Kanban, Table, and Planner boundary'
historical: true
labels:
  - discovery
  - ux
  - dashboard
  - renderer
createdAt: 2026-08-03T13:10:01.097Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.097Z
area: workspace-navigation
delivery:
  regression_likelihood: 3
  change_blast_radius: 3
  reversibility: 4
  behavior_surface: 3
  data_sensitivity: 1
depends_on:
  - 'V2 UI contract: dashboard, Kanban signals, and editor details'
  - Decide whether Planner remains a V2 surface or is retired
discovery_value:
  uncertainty_reduction: 5
  decision_importance: 4
  cost_of_wrong_choice: 3
engineering_health:
  maintenance_reduction: 3
  complexity_reduction: 3
  reliability_testability: 2
  recurring_time_saved: 3
estimate:
  effort_points: 2
  implementation_complexity: 1
  coordination_complexity: 2
evidence:
  - signboard-vue/src/components/WorkspaceViewDock.vue
  - signboard-vue/src/App.vue
  - signboard-vue/src/components/planner/PlannerOverlay.vue
  - signboard-vue/src/stores/useViewStore.ts
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
    - UX
    - architecture
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 4
  strategic_fit: 4
  urgency: 2
  maintenance_delta: 1
next_action: Implement the Dashboard entry and preserve the Kanban fallback behind the opt-in profile gate.
priority_class: P2
status_summary: 'Decision accepted: V2-enabled boards use Dashboard | Kanban | Table; generic boards keep the existing navigation.'
work_type: ux
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: ux
  priority_class: P2
  depends_on:
    - 'V2 UI contract: dashboard, Kanban signals, and editor details'
    - Decide whether Planner remains a V2 surface or is retired
  estimate:
    effort_points: 2
    implementation_complexity: 1
    coordination_complexity: 2
  status_summary: 'Decision accepted: V2-enabled boards use Dashboard | Kanban | Table; generic boards keep the existing navigation.'
  next_action: Implement the Dashboard entry and preserve the Kanban fallback behind the opt-in profile gate.
  engineering_health:
    maintenance_reduction: 3
    complexity_reduction: 3
    reliability_testability: 2
    recurring_time_saved: 3
  discovery_value:
    uncertainty_reduction: 5
    decision_importance: 4
    cost_of_wrong_choice: 3
  modifiers:
    confidence: 4
    strategic_fit: 4
    urgency: 2
    maintenance_delta: 1
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
      - UX
      - architecture
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Proposed V2 navigation

Use the existing bottom workspace dock with this order:

Dashboard | Kanban | Table

Dashboard is the first and default view for V2-enabled boards. Kanban remains the main manipulation surface. Table remains the dense scan and bulk-edit surface.

# Planner boundary

Planner should not receive a fourth V2 slot. If retained for compatibility, it remains available through a secondary command or temporary fallback. If retired, date/task data stays available to cards, integrations, or the dashboard where useful.

# Acceptance criteria

- [x] V2-enabled boards have one discoverable Dashboard entry in the existing dock.
- [x] Generic boards keep the current default view and controls.
- [x] Opening a card from Dashboard returns to the normal editor and preserves board context.
- [x] Planner replacement does not create a dead-end navigation state; Kanban is the safe fallback.
- [x] Keyboard shortcuts and help text are deferred until navigation implementation begins.

# Objective

Choose a discoverable V2 workspace navigation order and a safe fallback for generic boards and Planner compatibility.

# Scope

Decide dock order, V2 default, generic-board behavior, card-opening context, fallback, and sequencing for shortcuts/help; leave UI implementation to ready cards.

# Verification

Decision reviewed against the existing workspace dock, Planner overlay, view store, and the accepted profile-gated UI hierarchy.
