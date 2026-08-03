---
title: Create the first V2 dashboard surface beside Kanban and Table
labels:
  - dashboard
  - renderer
  - testing
createdAt: 2026-08-03T12:54:57.434Z
activity:
  - type: created
    at: 2026-08-03T12:54:57.434Z
area: dashboard
depends_on:
  - Define the V2 dashboard information hierarchy and first sections
  - 'Define V2 workspace navigation: Dashboard, Kanban, Table, and Planner boundary'
  - Extend the batched board snapshot with an opt-in V2 card projection
enablement:
  downstream_value: 4
  downstream_breadth: 4
  critical_path: 4
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 3
evidence:
  - signboard-vue/src/components/WorkspaceViewDock.vue
  - signboard-vue/src/App.vue
  - signboard-vue/src/stores/useViewStore.ts
  - signboard-vue/src/stores/useBoardDataStore.ts
  - signboard-vue/src/components/board/TableView.vue
  - signboard-vue/src/components/board/CardItem.vue
execution:
  specification_clarity: 3
  verification_strength: 3
  boundedness: 3
  isolation: 2
  coordination_complexity: 3
  autonomous_execution_blocked: true
  do_not_autorun: true
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Hand off to the compact V2 card signal row and metadata popover card.
opportunity:
  reach: 4
  benefit: 4
  frequency: 5
parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
priority_class: P2
status_summary: Dashboard shell passed independent review; V2-enabled boards now have the first projection-driven Dashboard surface with persisted Dashboard-first navigation.
work_type: product
signboard_v2:
  contract_version: 1
  kind: task
  work_type: product
  priority_class: P2
  parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
  depends_on:
    - Define the V2 dashboard information hierarchy and first sections
    - 'Define V2 workspace navigation: Dashboard, Kanban, Table, and Planner boundary'
    - Extend the batched board snapshot with an opt-in V2 card projection
  estimate:
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 3
  status_summary: Dashboard shell passed independent review; V2-enabled boards now have the first projection-driven Dashboard surface with persisted Dashboard-first navigation.
  next_action: Hand off to the compact V2 card signal row and metadata popover card.
  opportunity:
    reach: 4
    benefit: 4
    frequency: 5
  enablement:
    downstream_value: 4
    downstream_breadth: 4
    critical_path: 4
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: -1
  execution:
    specification_clarity: 3
    verification_strength: 3
    boundedness: 3
    isolation: 2
    coordination_complexity: 3
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
# Role in the V2 implementation slice

This is the implementation parent for the first V2 board dashboard. The UI contract, navigation decision, information hierarchy, card signals, editor details, and Project settings are decomposed into child cards on this migration board.

# Exact surface

- Add Dashboard as the first item in the existing bottom workspace dock for V2-enabled boards.
- Keep Kanban as the main manipulation surface and Table as the dense scan/bulk-edit surface.
- Do not make Planner a required V2 view.
- Use a compact summary row followed by Critical, Next best work, Low-hanging fruit, Agent loops, and conditional Blocked sections.
- Limit each section to three cards initially, with View all opening a filtered existing view.

# Card presentation inside the dashboard

Each result shows title, source list/stage, one priority/kind signal, one derived badge, and a one-line reason. Raw formulas remain behind Why this appears.

# Acceptance criteria

- [x] Available only for opted-in V2 boards.
- [x] Dashboard navigation and default-view behavior follow the accepted workspace-navigation card.
- [x] Section order and visibility come from the board profile.
- [x] Kanban and Table remain reachable; Planner is only required if the migration decision explicitly retains it.
- [x] Membership comes from snapshot projection, not client-only formulas.
- [x] Dashboard opens the normal editor and preserves board context.
- [x] Dashboard behavior is not coupled to Planner components.
- [x] Tests cover mixed legacy/V2 cards, custom stages, empty sections, and more-than-three results.

# Technical seams

- signboard-vue/src/components/WorkspaceViewDock.vue
- signboard-vue/src/App.vue
- signboard-vue/src/stores/useViewStore.ts
- signboard-vue/src/stores/useBoardDataStore.ts
- signboard-vue/src/components/board/TableView.vue
- signboard-vue/src/components/board/CardItem.vue

# Objective

Create the first V2 Dashboard as a compact shared-projection view for deciding what deserves attention now, available only on explicitly enabled boards.

# Scope

Implement the Dashboard shell, section rendering, empty/unshaped states, navigation, and board-context-preserving card opening. Leave score/evaluator formulas and card metadata editing to their dedicated seams.

# Verification

- Test enabled/disabled boards, mixed legacy/V2 cards, custom stages, empty sections, limits, View all, and editor context.
- Verify the Dashboard has no runtime dependency on Planner components.
- Rollback: disable the V2 profile or remove the Dashboard route; generic boards retain the existing view.

# Current handoff

The profile, pure evaluator, and opt-in snapshot foundations are complete and independently reviewed. The Dashboard implementation is complete and handed off to the compact card-signal child card.

# Implementation evidence

- `DashboardView.vue` renders profile-controlled sections from `snapshot.v2.cards`, caps each section at three cards, preserves normal card opening, and exposes empty/unshaped states for legacy, invalid, and `priority_index: null` cards.
- `WorkspaceViewDock.vue`, `App.vue`, `useBoardDataStore.ts`, `useViewStore.ts`, and `TableView.vue` gate Dashboard to enabled profiles, persist the Dashboard-first view per board, preserve Kanban/Table reachability, and support View all section filtering.
- `dashboardView.spec.ts`, `viewStore.spec.ts`, and `workspaceViewDock.spec.ts` pass; `npm run build:vue` passes type-check and Vite build.
- Independent read-only review passed after fixes for empty-section explanations, unshaped/sparse-card filtering, and default-board gating; the full Vue suite still has one unrelated pre-existing accessibility test failure.
