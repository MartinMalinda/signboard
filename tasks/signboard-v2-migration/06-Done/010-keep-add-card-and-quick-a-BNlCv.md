---
title: Keep Add Card and Quick Add lightweight with V2 defaults
labels:
  - ux
  - agent
  - data-model
createdAt: 2026-08-03T13:10:01.585Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.585Z
  - type: completed
    at: 2026-08-03T18:31:00.000Z
area: card-creation
delivery:
  regression_likelihood: 3
  change_blast_radius: 3
  reversibility: 4
  behavior_surface: 3
  data_sensitivity: 1
depends_on:
  - Add a board-level Project settings panel for V2 profile and display defaults
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
  - signboard-vue/src/components/modals/AddCardModal.vue
  - signboard-vue/src/components/modals/QuickAddCardModal.vue
  - signboard-vue/src/__tests__/task19-v2-creation-defaults.spec.ts
  - lib/cardCreation.js
  - lib/cliBoard.js
  - lib/mcpServer.js
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 4
  isolation: 4
  coordination_complexity: 2
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 4
  strategic_fit: 4
  urgency: 3
  maintenance_delta: 0
next_action: Hand off to V2 fixture coverage and the remaining phase gate review.
opportunity:
  reach: 5
  benefit: 3
  frequency: 5
parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
priority_class: P2
status_summary: 'Add Card, Quick Add, CLI, and MCP creation now apply board V2 defaults and expose only optional kind, work type, priority, and effort fields; full shaping remains in the editor.'
ui:
  placement: AddCardModal and QuickAddCardModal
  default: title/list first; Work details collapsed
  shortcut: preserve Shift+Enter quick create/open
work_type: ux
signboard_v2:
  contract_version: 1
  kind: task
  work_type: ux
  priority_class: P2
  parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
  depends_on:
    - Add a board-level Project settings panel for V2 profile and display defaults
    - 'V2 UI contract: dashboard, Kanban signals, and editor details'
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 2
  status_summary: 'Add Card, Quick Add, CLI, and MCP creation now apply board V2 defaults and expose only optional kind, work type, priority, and effort fields; full shaping remains in the editor.'
  next_action: Hand off to V2 fixture coverage and the remaining phase gate review.
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
    confidence: 4
    strategic_fit: 4
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
    isolation: 4
    coordination_complexity: 2
  eligibility:
    readiness: true
    dependencies: false
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Creation flow

Keep title and list selection first. Add a collapsed Work details disclosure below labels.

When expanded, offer only:

- Kind.
- Work type.
- Priority.
- Effort.

Apply board defaults automatically and allow the user or agent to override them. Do not ask for risk, confidence, delivery, or autonomy inputs during quick creation.

# Acceptance criteria

- [x] Existing quick-create keyboard behavior remains intact.
- [x] V2 defaults are visible and editable without becoming required.
- [x] Shift+Enter still creates, opens, and focuses notes.
- [x] Agent-created cards can provide the same minimal fields.
- [x] Full shaping remains available in the editor.

# Objective

Keep Add Card and Quick Add fast while applying optional V2 defaults and exposing only the smallest useful shaping fields at creation time.

# Scope

Add the collapsed Kind, Work type, Priority, and Effort disclosure to desktop and agent creation paths. Preserve existing shortcuts and defer risk, confidence, delivery, and autonomy inputs to the editor.

# Verification

- Test defaults, overrides, legacy creation, Shift+Enter, board/list selection, and agent-created minimal fields. The focused creation suite passes 4/4 tests; CLI and MCP regression scripts pass.
- Verify full shaping remains available after creation and no required field is added to quick create. The editor Work details disclosure remains the full shaping path.
- Rollback: disable V2 defaults/disclosure; existing creation behavior remains unchanged.
