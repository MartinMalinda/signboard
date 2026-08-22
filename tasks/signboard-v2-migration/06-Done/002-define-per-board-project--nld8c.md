---
title: Define per-board project profile and dashboard contract
historical: true
labels:
  - discovery
  - dashboard
  - data-model
createdAt: 2026-08-03T12:54:56.806Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.806Z
area: board-profile
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
discovery_value:
  uncertainty_reduction: 5
  decision_importance: 5
  cost_of_wrong_choice: 4
enablement:
  downstream_value: 5
  downstream_breadth: 4
  critical_path: 5
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 3
evidence:
  - tasks/V2-project-management.md
  - lib/boardLabels.js
  - lib/orderManifest.js
  - signboard-vue/src/types.ts
execution:
  specification_clarity: 2
  verification_strength: 2
  boundedness: 3
  isolation: 2
  coordination_complexity: 3
  autonomous_execution_blocked: true
  do_not_autorun: true
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Implement the normalized opt-in profile seam and preserve disabled-board behavior.
priority_class: P2
status_summary: 'Decision accepted: V2 is opt-in per board with shared dashboard sections and custom stage mappings.'
work_type: product
signboard_v2:
  contract_version: 1
  kind: discovery
  priority_class: P2
  parent: null
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  blocked_by: []
  estimate:
    effort_points: 3
  discovery_value:
    uncertainty_reduction: 5
    decision_importance: 5
    cost_of_wrong_choice: 4
  modifiers:
    confidence: 3
    urgency: 3
    maintenance_delta: -1
  delivery:
    regression_likelihood: 2
    change_blast_radius: 3
    reversibility: 3
---
# Accepted decision

Store the opt-in profile under `.board.json` `settings.v2`. The minimum profile contains `enabled`, `profileId`, `version`, title/description, semantic stage-to-list mappings, dashboard section IDs/order, card defaults, and explicit `retainPlanner` compatibility behavior. Missing or invalid profiles fail closed to current behavior. Profiles contain configuration only; scores and dashboard results remain derived.

The first stable section IDs are `critical`, `next_best_work`, `low_hanging_fruit`, and `blocked`, with a fixed initial limit of three results per section. Unmapped lists remain visible but do not participate in ranking; terminal stages are excluded. The internal migration board is the first profile fixture, with a generic product profile as the second example.

# Profile responsibilities

- Project type or profile name.
- Optional V2 enablement.
- Stage/list semantics and completed-list rules.
- Visible computed sections and relevant score dimensions.
- Default card metadata and validation policy.
- Optional product leverage dimension.
- Dashboard title and explanatory copy.

# Candidate sections

Critical; Best overall investments; Low-hanging fruit; Blocked.

# Constraints

Lists remain folders and can vary slightly by project. Sections use the same snapshot as Kanban and Table; Planner is only included if explicitly retained during migration. Profile absence preserves the current board. Derived metrics remain distinct from configuration.

# Acceptance criteria

- [x] Profile shape includes this migration board as an example.
- [x] List/stage mapping handles custom project stages.
- [x] Sections have stable identifiers, filters, sort inputs, and a fixed initial result limit.

# Objective

Define the per-board V2 profile and the first dashboard contract without copying derived scores into configuration.

# Scope

Choose opt-in enablement, stage mapping, stable dashboard sections, defaults, and Planner compatibility; leave profile persistence and rendering to ready implementation cards.

# Verification

Decision reviewed against custom-list compatibility, shared snapshot architecture, and the accepted card contract.
