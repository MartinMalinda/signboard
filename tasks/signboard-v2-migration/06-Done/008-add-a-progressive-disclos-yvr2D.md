---
title: Add a progressive-disclosure Work details section to the card editor
historical: true
labels:
  - ux
  - renderer
  - data-model
createdAt: 2026-08-03T13:10:01.392Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.392Z
  - type: completed
    at: 2026-08-03T17:36:00.000Z
  - type: changed
    at: 2026-08-03T19:04:00.000Z
  - type: changed
    at: 2026-08-03T19:08:00.000Z
  - type: changed
    at: 2026-08-03T19:12:00.000Z
  - type: changed
    at: 2026-08-03T19:16:00.000Z
area: card-editor
delivery:
  regression_likelihood: 4
  change_blast_radius: 4
  reversibility: 4
  behavior_surface: 4
  data_sensitivity: 1
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  - 'V2 UI contract: dashboard, Kanban signals, and editor details'
enablement:
  downstream_value: 4
  downstream_breadth: 4
  critical_path: 4
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 2
evidence:
  - signboard-vue/src/components/editor/EditCardModal.vue
  - signboard-vue/src/components/editor/V2WorkDetails.vue
  - signboard-vue/src/stores/useEditorStore.ts
  - signboard-vue/src/components/editor/CardNotesEditor.vue
  - signboard-vue/src/components/editor/CardTimestamps.vue
  - signboard-vue/src/components/editor/CardEditorActions.vue
  - signboard-vue/src/components/editor/CardMoveControls.vue
  - signboard-vue/src/components/editor/V2RelatedTaskSelect.vue
  - signboard-vue/src/__tests__/task18-v2-work-details.spec.ts
  - signboard-vue/src/__tests__/task20-v2-related-task-select.spec.ts
  - signboard-vue/src/__tests__/task11-app-extras.spec.ts
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 3
  isolation: 3
  coordination_complexity: 2
  autonomous_execution_blocked: true
  agent_execution_blocked: false
  do_not_autorun: true
  required_reviews:
    - UX
    - renderer
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Hand off to the board-level Project settings panel for profile and display defaults.
opportunity:
  reach: 4
  benefit: 4
  frequency: 4
parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
priority_class: P2
status_summary: 'The V2 editor now has a collapsed Work summary, optional core and advanced shaping fields, searchable multi-select related-task controls, read-only computed signals before the notes surface, and an explicit stage selector that supports moving backward from Done; the buggy V2 deadline control is removed while underlying date metadata remains available elsewhere.'
ui:
  placement: below editor header/toolbar and above notes
  initial_state: summary visible, details collapsed
  advanced: risk/value/execution groups collapsed
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
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 2
  status_summary: 'The V2 editor now has a collapsed Work summary, optional core and advanced shaping fields, searchable multi-select related-task controls, read-only computed signals before the notes surface, and an explicit stage selector that supports moving backward from Done; the buggy V2 deadline control is removed while underlying date metadata remains available elsewhere.'
  next_action: Hand off to the board-level Project settings panel for profile and display defaults.
  opportunity:
    reach: 4
    benefit: 4
    frequency: 4
  enablement:
    downstream_value: 4
    downstream_breadth: 4
    critical_path: 4
  modifiers:
    confidence: 3
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
    verification_strength: 4
    boundedness: 3
    isolation: 3
    coordination_complexity: 2
    autonomous_execution_blocked: true
    agent_execution_blocked: false
    do_not_autorun: true
    required_reviews:
      - UX
      - renderer
  eligibility:
    readiness: true
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Editor hierarchy

Keep the current title/actions and notes-first experience. Add a compact Work summary below the header and before the notes body:

Task · P2 · Product · 3 pts · Agent-ready

Make the summary clickable to expand Work details.

# Work details, default group

- Kind.
- Work type.
- Priority class.
- Effort points.
- Current stage/list with an explicit selector that supports moving to any configured stage.
- Searchable multi-select dependencies and blocked-by related-task links.

# Advanced scoring, collapsed group

- Opportunity/value inputs.
- Risk prevented.
- Delivery risk.
- Confidence and strategic fit.
- Execution clarity, verification strength, boundedness, isolation, and agent policy.

# Derived signals

Show a read-only Computed signals block after the editable fields when the board is V2-enabled:

- Critical, Quick win, Agent-ready, Blocked, or none.
- One-line Why this appears explanation.
- Link to the dashboard section.

# Acceptance criteria

- [x] Work details are collapsed by default for ordinary editing.
- [x] Notes remain the dominant editor surface.
- [x] Advanced scoring is never required to save a legacy or minimally shaped card.
- [x] Derived values cannot be edited in the card editor.
- [x] Dirty-state, external sync, keyboard focus, and reduced-motion behavior remain correct.

# Objective

Add progressive V2 Work details to the card editor while keeping notes-first editing, legacy saves, and existing accessibility/synchronization behavior intact.

# Scope

Add the compact summary, collapsed editable work fields, and read-only computed signals. Keep advanced scoring collapsed and optional; do not make it a prerequisite for saving legacy or minimally shaped cards.

# Verification

- Test open/close, dirty state, external sync, keyboard focus, reduced motion, and legacy/minimal saves. Focused V2 editor tests pass; existing editor sync coverage remains green, and global reduced-motion rules remain unchanged.
- Confirm the V2 Work details panel does not render the buggy deadline/date control; start/due metadata remains supported by non-V2 date surfaces.
- Confirm stage movement uses an accessible selector with every configured stage, including stages before the current stage; the selected value is the stage indicator.
- Confirm Depends on and Blocked by use searchable multi-select controls, preserve multiple values, and keep the existing string-array metadata contract.
- Confirm expanded V2 metadata uses the shared Modal.vue overflow container rather than a clipped editor-inner scroll region.
- Verify notes remain the dominant surface and derived values cannot be edited. `npm run build:vue` and the focused editor/card regression suite pass.
- Rollback: disable the V2 profile or disclosure path; the current editor remains usable.
