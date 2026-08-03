---
title: Expose V2 metadata through card creation and agent paths
labels:
  - agent
  - data-model
  - migration
  - testing
createdAt: 2026-08-03T12:54:57.573Z
activity:
  - type: created
    at: 2026-08-03T12:54:57.573Z
  - type: completed
    at: 2026-08-03T18:38:00.000Z
area: agent-workflow
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  - Add an optional V2 board profile to .board.json
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 4
engineering_health:
  maintenance_reduction: 4
  complexity_reduction: 3
  reliability_testability: 4
  recurring_time_saved: 4
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 3
evidence:
  - lib/cliApp.js
  - lib/cliBoard.js
  - lib/mcpServer.js
  - lib/importers/shared.js
  - lib/aiTaskSuggestions.js
  - lib/cardFrontmatter.js
  - shared/v2CardMetadata.js
  - scripts/test-v2-card-metadata.js
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 3
  isolation: 3
  coordination_complexity: 3
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 0
next_action: Hand off to Phase 2 score/dashboard calibration; keep new metadata fields additive and evaluator-owned.
priority_class: P2
status_summary: 'Desktop, CLI, MCP, importer, and editor persistence now pass through one conservative V2 card metadata normalizer; invalid fields are removed without touching lifecycle, labels, links, or Markdown body data.'
work_type: enablement
signboard_v2:
  contract_version: 1
  kind: task
  work_type: enablement
  priority_class: P2
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
    - Add an optional V2 board profile to .board.json
  estimate:
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 3
  status_summary: 'Desktop, CLI, MCP, importer, and editor persistence now pass through one conservative V2 card metadata normalizer; invalid fields are removed without touching lifecycle, labels, links, or Markdown body data.'
  next_action: Hand off to Phase 2 score/dashboard calibration; keep new metadata fields additive and evaluator-owned.
  engineering_health:
    maintenance_reduction: 4
    complexity_reduction: 3
    reliability_testability: 4
    recurring_time_saved: 4
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 4
  modifiers:
    confidence: 3
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 0
  execution:
    specification_clarity: 4
    verification_strength: 4
    boundedness: 3
    isolation: 3
    coordination_complexity: 3
  eligibility:
    readiness: true
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Paths

Desktop Quick Add and editor; CLI create/edit/duplicate; MCP create/edit/duplicate; Trello, Obsidian, and Tasks.md importers; opt-in AI Smart Card Actions.

# Acceptance criteria

- [x] One shared normalizer validates or conservatively accepts V2 metadata.
- [x] Non-V2 boards still create ordinary cards.
- [x] V2 defaults do not make every field mandatory.
- [x] Invalid metadata reports clearly and cannot inflate scores.
- [x] Lifecycle, Obsidian, labels, and linked-object metadata remain intact.
- [x] CLI and MCP expose the same normalized shape where applicable.

# Objective

Prevent V2 metadata drift by using one conservative normalizer across desktop creation/editing, CLI, MCP, importers, and opt-in AI card actions.

# Scope

Normalize only the accepted Phase 1 card fields and preserve lifecycle, Obsidian, labels, linked objects, Markdown body, and legacy behavior. Do not implement ranking formulas or broad migration backfills.

# Verification

- Run focused creation/edit/import tests for each mutation seam, including malformed and partial metadata. `npm run test:v2-card-metadata`, CLI, and MCP smoke tests pass; desktop creation/editor coverage is green.
- Compare desktop, CLI, and MCP normalized output for the same input through the shared `cardFrontmatter.normalizeFrontmatter` persistence seam.
- Rollback: keep V2 metadata absent on non-V2 boards and bypass the normalizer for legacy-only writes.
