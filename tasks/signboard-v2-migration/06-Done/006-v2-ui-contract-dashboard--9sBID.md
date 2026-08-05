---
title: 'V2 UI contract: dashboard, Kanban signals, and editor details'
historical: true
labels:
  - epic
  - ux
  - dashboard
  - renderer
createdAt: 2026-08-03T13:10:00.908Z
activity:
  - type: created
    at: 2026-08-03T13:10:00.908Z
area: ui-architecture
delivery:
  regression_likelihood: 4
  change_blast_radius: 4
  reversibility: 4
  behavior_surface: 4
  data_sensitivity: 1
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  - Define per-board project profile and dashboard contract
  - Decide whether Planner remains a V2 surface or is retired
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 4
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 3
evidence:
  - /Users/martinmalinda/.codex/attachments/63bec029-1e58-4e28-aeaa-61d54d896b60/image-1.png
  - /Users/martinmalinda/.codex/attachments/63bec029-1e58-4e28-aeaa-61d54d896b60/image-2.png
  - signboard-vue/src/App.vue
  - signboard-vue/src/components/board/CardItem.vue
  - signboard-vue/src/components/editor/EditCardModal.vue
  - signboard-vue/src/components/settings/SettingsModal.vue
execution:
  specification_clarity: 4
  verification_strength: 3
  boundedness: 3
  isolation: 2
  coordination_complexity: 3
  autonomous_execution_blocked: true
  agent_execution_blocked: false
  do_not_autorun: true
  required_reviews:
    - product
    - UX
    - architecture
framework_status: done
framework_version: 1
kind: epic
modifiers:
  confidence: 4
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Hand the accepted UI contract to the dashboard, Kanban-signal, editor-disclosure, Project-settings, and fixture cards.
opportunity:
  reach: 4
  benefit: 4
  frequency: 5
priority_class: P2
status_summary: 'Decision accepted: V2 adds a dashboard and progressive work metadata while profile-disabled boards remain unchanged.'
work_type: ux
signboard_v2:
  contract_version: 1
  kind: epic
  work_type: ux
  priority_class: P2
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
    - Define per-board project profile and dashboard contract
    - Decide whether Planner remains a V2 surface or is retired
  estimate:
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 3
  status_summary: 'Decision accepted: V2 adds a dashboard and progressive work metadata while profile-disabled boards remain unchanged.'
  next_action: Hand the accepted UI contract to the dashboard, Kanban-signal, editor-disclosure, Project-settings, and fixture cards.
  opportunity:
    reach: 4
    benefit: 4
    frequency: 5
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 4
  modifiers:
    confidence: 4
    strategic_fit: 5
    urgency: 3
    maintenance_delta: -1
  delivery:
    regression_likelihood: 4
    change_blast_radius: 4
    reversibility: 4
    behavior_surface: 4
    data_sensitivity: 1
  execution:
    specification_clarity: 4
    verification_strength: 3
    boundedness: 3
    isolation: 2
    coordination_complexity: 3
    autonomous_execution_blocked: true
    agent_execution_blocked: false
    do_not_autorun: true
    required_reviews:
      - product
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
# Objective

Define the V2 information hierarchy and control placement for product-development work in the current sparse Signboard UI.

# Hierarchy

1. Board dashboard: what deserves attention now.
2. Kanban/Table: where work is organized and scanned.
3. Card editor: where one card is shaped and its metadata is changed.
4. Advanced scoring: progressive disclosure only; never the default face of a card.

# Density rules

- Kanban cards show at most three V2 signals: kind, priority, and one derived state.
- Raw indexes do not appear on the card face.
- The editor shows a compact summary row first, then a collapsed Work details section.
- Risk, confidence, delivery, and autonomy inputs live under an Advanced scoring disclosure.
- Derived results are read-only and explainable.
- Board settings own defaults, profile, dashboard sections, and stage mapping; cards own their specific values.

# Current UI seams

- Add Dashboard beside Kanban/Table in the existing bottom WorkspaceViewDock.
- Use the existing CardItem metadata row for compact work signals.
- Add Work details between the editor header/toolbar and the notes body.
- Add a board-level Project settings panel beside General/Labels/Workflow.
- Keep header search, Add Card, filter, and menu unchanged.

# Accepted decision

The V2 hierarchy is Dashboard → Kanban/Table → card editor. V2-enabled boards add Dashboard as the default, while generic boards remain unchanged. Dashboard, Kanban cards, and the editor expose only compact, explainable signals; raw scores stay behind progressive disclosure. Work details are collapsed by default, notes remain dominant, and advanced scoring is never required for minimally shaped or legacy cards. Planner is not a required dependency.

# Acceptance criteria

- [x] Child cards define exact fields, controls, disclosure states, and empty/legacy behavior.
- [x] The first V2 UI can be used without opening a score form for every card.
- [x] Profile-disabled boards render the current UI unchanged.
- [x] Planner is not a required dependency for the V2 hierarchy.

# Scope

Set UI contracts only; leave implementation to the child Dashboard, signal, editor, Project-settings, creation, and fixture cards.

# Verification

Contract reviewed against the current Vue seams, accepted profile/card/navigation decisions, accessibility requirements, and legacy-board fallback behavior.
