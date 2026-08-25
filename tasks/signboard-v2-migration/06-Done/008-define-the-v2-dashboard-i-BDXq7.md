---
title: Define the V2 dashboard information hierarchy and first sections
historical: true
labels:
  - discovery
  - ux
  - dashboard
createdAt: 2026-08-03T13:10:01.196Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.196Z
area: dashboard-information-architecture
delivery:
  regression_likelihood: 3
  change_blast_radius: 3
  reversibility: 4
  behavior_surface: 4
  data_sensitivity: 1
depends_on:
  - 'V2 UI contract: dashboard, Kanban signals, and editor details'
  - Define per-board project profile and dashboard contract
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 2
evidence:
  - tasks/V2-project-management.md
  - signboard-vue/src/components/board/TableView.vue
  - signboard-vue/src/components/board/CardItem.vue
  - signboard-vue/src/stores/useBoardDataStore.ts
execution:
  specification_clarity: 3
  verification_strength: 3
  boundedness: 3
  isolation: 3
  coordination_complexity: 2
  autonomous_execution_blocked: true
  agent_execution_blocked: false
  do_not_autorun: true
  required_reviews:
    - product
    - UX
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Implement the shared-snapshot dashboard shell with profile-controlled section visibility.
opportunity:
  reach: 4
  benefit: 4
  frequency: 5
priority_class: P2
status_summary: 'Decision accepted: five compact, profile-controlled sections answer what deserves attention now without exposing raw formulas.'
work_type: product
signboard_v2:
  contract_version: 1
  kind: discovery
  priority_class: P2
  depends_on:
    - 'V2 UI contract: dashboard, Kanban signals, and editor details'
    - Define per-board project profile and dashboard contract
  estimate:
    effort_points: 3
  blocked_by: []
  opportunity:
    reach: 4
    benefit: 4
    frequency: 5
  modifiers:
    confidence: 3
    urgency: 3
    maintenance_delta: -1
  delivery:
    regression_likelihood: 3
    change_blast_radius: 3
    reversibility: 4
---
# Proposed first dashboard

## Header

- Project name and profile chip.
- Small counts: Critical, Ready, and Blocked.
- One short status line explaining whether the board is fully scored or contains legacy/unshaped cards.

## Primary sections

1. Critical: P0/P1 work, prominent and sorted by critical index.
2. Next best work: the top few available P2 cards.
3. Low-hanging fruit: useful, low-effort cards with acceptable delivery risk.
4. Blocked: compact warning section when non-empty.

## Display rules

- Show at most 3 cards per section initially, with View all opening filtered Table/Kanban.
- Show the card title, list/stage, one priority/kind signal, and one-line reason.
- Do not show raw formulas or five separate scores by default.
- Explain a result through a Why this appears popover or expandable row.
- Empty sections explain their selection rule rather than looking broken.

# Accepted decision

Use four stable sections in this order: `critical`, `next_best_work`, `low_hanging_fruit`, and `blocked`. Show at most three cards per section, with title, stage, one compact signal, and a one-line reason. Keep Critical and Blocked visually distinct, expose Why this appears on demand, and provide an Unshaped affordance for legacy or unscored cards. Results must come from the shared snapshot projection; profile-disabled boards remain unchanged.

# Acceptance criteria

- [x] Section order and visibility are profile-controlled.
- [x] Critical and Blocked remain visually distinct from ordinary recommendations.
- [x] Dashboard results come from the shared snapshot projection.
- [x] A legacy/unscored card can still be opened and shaped from the dashboard.

# Objective

Define the first compact Dashboard sections and explanation pattern so the V2 surface answers what to do next before exposing the full framework.

# Scope

Set stable section IDs, order, limits, display signals, empty/unshaped behavior, and shared-snapshot ownership; leave dashboard rendering to the ready implementation card.

# Verification

Decision reviewed against the accepted profile and evaluator contracts, shared snapshot architecture, and the UI density/legacy requirements.
