---
title: Add a compact V2 work-signal row and metadata popover to Kanban cards
labels:
  - ux
  - renderer
  - data-model
createdAt: 2026-08-03T13:10:01.294Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.294Z
area: kanban-card-density
delivery:
  regression_likelihood: 3
  change_blast_radius: 3
  reversibility: 4
  behavior_surface: 3
  data_sensitivity: 1
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  - 'V2 UI contract: dashboard, Kanban signals, and editor details'
engineering_health:
  maintenance_reduction: 2
  complexity_reduction: 2
  reliability_testability: 3
  recurring_time_saved: 3
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 2
evidence:
  - signboard-vue/src/components/board/CardItem.vue
  - signboard-vue/src/components/board/CardContextMenu.vue
  - signboard-vue/src/components/board/CardItem.vue
  - signboard-vue/src/__tests__/task17-v2-work-signal.spec.ts
  - signboard-vue/src/stores/useBoardDataStore.ts
  - signboard-vue/src/lib/components/AppPopover.vue
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 4
  isolation: 3
  coordination_complexity: 2
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 0
next_action: Hand off to the progressive-disclosure Work details section in the card editor.
opportunity:
  reach: 5
  benefit: 3
  frequency: 5
parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
priority_class: P2
status_summary: 'Kanban cards now show a compact, profile-gated V2 signal row and keyboard-accessible Work details popover while legacy cards remain unchanged.'
ui:
  placement: CardItem metadata row
  density: maximum three V2 signals
  control: work-signal button opens anchored popover
  legacy_behavior: hidden when board profile is disabled
work_type: ux
signboard_v2:
  contract_version: 1
  kind: task
  work_type: ux
  priority_class: P2
  parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
    - 'V2 UI contract: dashboard, Kanban signals, and editor details'
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 2
  status_summary: 'Kanban cards now show a compact, profile-gated V2 signal row and keyboard-accessible Work details popover while legacy cards remain unchanged.'
  next_action: Hand off to the progressive-disclosure Work details section in the card editor.
  opportunity:
    reach: 5
    benefit: 3
    frequency: 5
  engineering_health:
    maintenance_reduction: 2
    complexity_reduction: 2
    reliability_testability: 3
    recurring_time_saved: 3
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 0
  delivery:
    regression_likelihood: 3
    change_blast_radius: 3
    reversibility: 4
    behavior_surface: 3
    data_sensitivity: 1
  execution:
    specification_clarity: 4
    verification_strength: 4
    boundedness: 4
    isolation: 3
    coordination_complexity: 2
  eligibility:
    readiness: true
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Card face

Add one compact V2 work-signal row using the existing metadata area.

Show, in order:

- Kind pill: Task, Discovery, Epic, or Incident.
- Priority chip: P0-P3, only when set.
- One derived badge: Critical, Quick win, Agent-ready, or Blocked; choose the highest-signal state.

Keep existing labels, dates, task progress, and linked-object count. Do not show raw indexes.

# Control

Add a small Work details icon button in the same metadata row. It opens an anchored popover, not a modal, with:

- Kind selector.
- Work type selector.
- Priority selector.
- Effort selector.
- A More in editor link for dependencies, risk, and execution policy.

The popover must be discoverable by keyboard and must not turn card click/drag into accidental editing.

# Acceptance criteria

- [x] Maximum visible V2 density is three signals plus existing metadata.
- [x] Derived badges are read-only and explainable.
- [x] Legacy cards show no empty placeholders.
- [x] The popover works without relying on right-click.
- [x] Card sorting/dragging and existing label/date controls remain intact.

# Objective

Add a compact, profile-gated V2 signal row and keyboard-accessible Work details popover to Kanban cards without increasing card density or breaking drag/edit controls.

# Scope

Render only the accepted kind, priority, and one derived state on the card face. Keep advanced metadata in the popover/editor and do not expose raw indexes or alter card ordering behavior.

# Verification

- Test generic, legacy, fully shaped, and derived-signal cards plus keyboard and compact-window interaction.
- Verify Sortable drag, card click, labels, dates, and right-click behavior remain unchanged.
- Rollback: hide the signal row/popover when the V2 profile or display toggle is disabled.
