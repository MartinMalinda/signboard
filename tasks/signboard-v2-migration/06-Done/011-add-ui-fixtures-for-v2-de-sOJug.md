---
title: Add UI fixtures for V2 density, disclosure, and mixed legacy cards
labels:
  - testing
  - ux
  - renderer
createdAt: 2026-08-03T13:10:01.684Z
activity:
  - type: created
    at: 2026-08-03T13:10:01.684Z
  - type: completed
    at: 2026-08-03T18:33:00.000Z
area: ui-verification
delivery:
  regression_likelihood: 2
  change_blast_radius: 2
  reversibility: 5
  behavior_surface: 2
  data_sensitivity: 1
depends_on:
  - Add a compact V2 work-signal row and metadata popover to Kanban cards
  - Add a progressive-disclosure Work details section to the card editor
  - Add a board-level Project settings panel for V2 profile and display defaults
engineering_health:
  maintenance_reduction: 3
  complexity_reduction: 2
  reliability_testability: 5
  recurring_time_saved: 4
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 1
evidence:
  - signboard-vue/src/__tests__/App.spec.ts
  - signboard-vue/src/__tests__/task16-card-click-behavior.spec.ts
  - signboard-vue/src/__tests__/task17-v2-work-signal.spec.ts
  - signboard-vue/src/__tests__/task18-v2-work-details.spec.ts
  - signboard-vue/src/__tests__/task19-v2-creation-defaults.spec.ts
  - signboard-vue/src/__tests__/settings.spec.ts
  - signboard-vue/src/__tests__/task11-app-extras.spec.ts
  - tests/playwright/signboard-smoke.spec.js
execution:
  specification_clarity: 5
  verification_strength: 5
  boundedness: 5
  isolation: 5
  coordination_complexity: 1
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 4
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 1
next_action: 'Phase gate review: inspect the remaining shaping queue and decide whether to broaden V2 beyond the pilot surface.'
parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
priority_class: P2
status_summary: 'V2 fixture coverage now exercises enabled/disabled signal visibility, compact density, editor disclosure and derived links, Project settings, and optional creation defaults without changing legacy flows.'
work_type: correctness
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: 'V2 UI contract: dashboard, Kanban signals, and editor details'
  depends_on:
    - Add a compact V2 work-signal row and metadata popover to Kanban cards
    - Add a progressive-disclosure Work details section to the card editor
    - Add a board-level Project settings panel for V2 profile and display defaults
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 1
  status_summary: 'V2 fixture coverage now exercises enabled/disabled signal visibility, compact density, editor disclosure and derived links, Project settings, and optional creation defaults without changing legacy flows.'
  next_action: 'Phase gate review: inspect the remaining shaping queue and decide whether to broaden V2 beyond the pilot surface.'
  engineering_health:
    maintenance_reduction: 3
    complexity_reduction: 2
    reliability_testability: 5
    recurring_time_saved: 4
  modifiers:
    confidence: 4
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 1
  delivery:
    regression_likelihood: 2
    change_blast_radius: 2
    reversibility: 5
    behavior_surface: 2
    data_sensitivity: 1
  execution:
    specification_clarity: 5
    verification_strength: 5
    boundedness: 5
    isolation: 5
    coordination_complexity: 1
  eligibility:
    readiness: true
    dependencies: false
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Fixture states

- Generic board with no V2 profile: current card/editor/settings density.
- V2 board with an unshaped legacy card.
- V2 board with a fully shaped card.
- Card with Critical, Quick win, Agent-ready, and Blocked signals.
- Dashboard with empty sections and with more than three results.

# Acceptance criteria

- [x] V2 signals do not appear on generic boards.
- [x] Card face stays within the agreed signal density.
- [x] Work details opens and closes without losing note focus or dirty state.
- [x] Advanced scoring remains collapsed.
- [x] Dashboard View all links preserve filters and open the normal editor.
- [x] Keyboard and compact-window layouts remain usable.

# Objective

Create regression fixtures for V2 density, progressive disclosure, mixed legacy cards, and profile-disabled behavior before broadening the UI surface.

# Scope

Cover component/interaction states and the smallest end-to-end checks needed for Dashboard, Kanban signals, editor Work details, Project settings, and creation disclosures. Do not add product behavior solely to satisfy a fixture.

# Verification

- Run focused Vue and Playwright tests at desktop and compact sizes. Focused Vue coverage is green; the production Vue build is green. The full Vue suite is 89/90 with the known pre-existing jsdom modal-discovery failure.
- Assert enabled/disabled visibility, signal limits, disclosure state, keyboard focus, dirty state, and Dashboard editor navigation through the new task17/task18/task19/settings fixtures and existing editor sync coverage.
- Rollback: remove fixture-only data and tests without changing runtime card formats.
