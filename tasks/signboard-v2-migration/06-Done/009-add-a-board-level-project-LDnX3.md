---
title: Add a board-level Project settings panel for V2 profile and display defaults
historical: true
labels:
  - ux
  - dashboard
  - data-model
createdAt: 2026-08-03T13:10:01.488Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.488Z
  - type: completed
    at: 2026-08-03T18:23:00.000Z
area: project-settings
delivery:
  regression_likelihood: 3
  change_blast_radius: 3
  reversibility: 4
  behavior_surface: 3
  data_sensitivity: 1
depends_on:
  - Define per-board project profile and dashboard contract
  - 'V2 UI contract: dashboard, Kanban signals, and editor details'
enablement:
  downstream_value: 5
  downstream_breadth: 4
  critical_path: 4
engineering_health:
  maintenance_reduction: 3
  complexity_reduction: 2
  reliability_testability: 3
  recurring_time_saved: 3
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 2
evidence:
  - signboard-vue/src/components/settings/SettingsModal.vue
  - signboard-vue/src/components/settings/V2ProjectSettingsPanel.vue
  - signboard-vue/src/stores/useSettingsStore.ts
  - signboard-vue/src/types.ts
  - signboard-vue/src/components/board/CardItem.vue
  - signboard-vue/src/__tests__/settings.spec.ts
  - lib/boardLabels.js
  - lib/atomicFile.js
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 3
  isolation: 3
  coordination_complexity: 2
  autonomous_execution_blocked: false
  agent_execution_blocked: false
  do_not_autorun: false
  required_reviews:
    - product
    - UX
    - architecture
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Hand off to V2-aware Add Card and Quick Add defaults.
parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
priority_class: P2
status_summary: 'The board Settings modal now has one Project panel for V2 enablement, profile identity, dashboard order, card display, new-card defaults, and custom stage mappings.'
ui:
  placement: board Settings navigation after General
  sections:
    - Project profile
    - Dashboard sections
    - Card display
    - Defaults
    - Stage mapping
  default_state: V2 disabled
work_type: product
signboard_v2:
  contract_version: 1
  kind: task
  work_type: product
  priority_class: P2
  parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
  depends_on:
    - Define per-board project profile and dashboard contract
    - 'V2 UI contract: dashboard, Kanban signals, and editor details'
  estimate:
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 2
  status_summary: 'The board Settings modal now has one Project panel for V2 enablement, profile identity, dashboard order, card display, new-card defaults, and custom stage mappings.'
  next_action: Hand off to V2-aware Add Card and Quick Add defaults.
  engineering_health:
    maintenance_reduction: 3
    complexity_reduction: 2
    reliability_testability: 3
    recurring_time_saved: 3
  enablement:
    downstream_value: 5
    downstream_breadth: 4
    critical_path: 4
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: -1
  delivery:
    regression_likelihood: 3
    change_blast_radius: 3
    reversibility: 4
    behavior_surface: 3
    data_sensitivity: 1
  execution:
    specification_clarity: 4
    verification_strength: 4
    boundedness: 3
    isolation: 3
    coordination_complexity: 2
    autonomous_execution_blocked: false
    agent_execution_blocked: false
    do_not_autorun: false
    required_reviews:
      - product
      - UX
      - architecture
  eligibility:
    readiness: true
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Panel placement

Add one Project panel after General in the existing board-settings navigation. Do not add separate settings entries for every score or dashboard section.

# Default controls

- Use product workspace toggle.
- Project profile selector or profile name.
- Dashboard section visibility and order.
- Show work signals on Kanban cards toggle.
- Default kind, work type, and priority for new cards.

# Progressive sections

- Dashboard sections: reorderable list of section toggles.
- Card display: signal density and whether to show derived badges.
- Stage mapping: optional mapping from framework roles to existing list folders; never require hardcoded list names.
- Advanced scoring policy: deferred until the evaluator is stable.

# Acceptance criteria

- [x] V2-disabled boards remain visually and behaviorally unchanged.
- [x] One Project panel owns board-level V2 configuration.
- [x] Settings are persisted through the existing board-settings/atomic path.
- [x] Custom list names remain valid stage choices.
- [x] Settings explain that derived scores are computed, not hand-edited.

# Objective

Add one board-level Project settings panel that owns V2 enablement, profile defaults, dashboard section visibility, card-signal display, and custom stage mappings.

# Scope

Extend existing board settings persistence and navigation only. Keep V2 disabled by default, preserve arbitrary list names, and defer per-board scoring formulas and advanced policy authoring.

# Verification

- Test partial profiles, atomic persistence, custom list mappings, section toggles, and board-settings compatibility. `settings.spec.ts` passes with the new Project panel; the shared normalizer keeps legacy settings intact.
- Verify computed scores are presented as read-only policy outputs. The panel explicitly describes scores/badges as evaluator-derived, and the card display toggle only controls presentation.
- Rollback: disable the profile or remove the panel; existing General/Labels/Appearance/Workflow behavior remains intact.
