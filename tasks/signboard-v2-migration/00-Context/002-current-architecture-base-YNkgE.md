---
title: 'Current architecture baseline: file-backed boards, snapshots, and views'
labels:
  - discovery
  - data-model
  - renderer
  - docs
createdAt: 2026-08-03T12:54:56.450Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.450Z
area: architecture
enablement:
  downstream_value: 4
  downstream_breadth: 5
  critical_path: 4
engineering_health:
  maintenance_reduction: 2
  complexity_reduction: 2
  reliability_testability: 3
  recurring_time_saved: 2
estimate:
  effort_points: 3
  implementation_complexity: 1
  coordination_complexity: 1
evidence:
  - lib/orderManifest.js
  - lib/cardFrontmatter.js
  - lib/cardLifecycle.js
  - lib/boardSnapshot.js
  - signboard-vue/src/stores/useBoardDataStore.ts
  - app/board/plannerView.js
  - app/board/tableView.js
execution:
  specification_clarity: 5
  verification_strength: 4
  boundedness: 5
  isolation: 5
  coordination_complexity: 1
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 5
  strategic_fit: 4
  urgency: 2
  maintenance_delta: 1
next_action: Use this evidence when shaping metadata and dashboard seams.
priority_class: P2
status_summary: Repository baseline captured for V2 planning.
work_type: engineering_health
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: engineering_health
  priority_class: P2
  estimate:
    effort_points: 3
    implementation_complexity: 1
    coordination_complexity: 1
  status_summary: Repository baseline captured for V2 planning.
  next_action: Use this evidence when shaping metadata and dashboard seams.
  engineering_health:
    maintenance_reduction: 2
    complexity_reduction: 2
    reliability_testability: 3
    recurring_time_saved: 2
  enablement:
    downstream_value: 4
    downstream_breadth: 5
    critical_path: 4
  modifiers:
    confidence: 5
    strategic_fit: 4
    urgency: 2
    maintenance_delta: 1
  execution:
    specification_clarity: 5
    verification_strength: 4
    boundedness: 5
    isolation: 5
    coordination_complexity: 1
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Codebase evidence

## Persistence

- lib/orderManifest.js stores board/list and list/card order in .board.json.
- lib/cardFrontmatter.js parses and atomically writes Markdown cards while preserving unknown frontmatter.
- lib/cardLifecycle.js owns createdAt, activity, and statusChangedAt.
- lib/boardLabels.js normalizes board settings and preserves unrelated manifest content.

## Read path

- lib/boardSnapshot.js batches list/card reads and can opt into timestamps, task items, and board settings.
- app/board/boardSnapshot.js adapts the main-process result for the legacy renderer.
- signboard-vue/src/stores/useBoardDataStore.ts owns the canonical Vue snapshot and refresh flow.

## View path

- Kanban renders cards by list.
- Table provides dense scanning, sorting, bulk actions, and metadata columns.
- Planner currently derives temporal placements across open boards, but it is an existing surface rather than a V2 requirement.
- V2 may retire or absorb Planner; date/task metadata should remain reusable independently.
- Kanban, Table, and the future V2 dashboard are the preferred shared-projection consumers.

## Agent paths

lib/cliApp.js, lib/cliBoard.js, lib/mcpServer.js, lib/importers/shared.js, and lib/aiTaskSuggestions.js are separate creation or mutation seams that V2 must keep aligned.

# Objective

Capture the current persistence, snapshot, renderer, and agent-path architecture that constrains the V2 migration.

# Acceptance criteria

- [x] Persistence, read, view, and mutation seams are identified with source evidence.
- [x] Existing Planner/date-task behavior is distinguished from V2 requirements.
- [x] Compatibility constraints are available to the shaping and ready cards.

# Verification

Reviewed against the referenced source modules and the current V2 migration card dependencies.
