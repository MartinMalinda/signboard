---
title: Keep the internal migration board metadata aligned as V2 evolves
labels:
  - migration
  - docs
  - testing
createdAt: 2026-08-03T12:54:58.337Z
activity:
  - type: created
    at: 2026-08-03T12:54:58.337Z
area: internal-board
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
enablement:
  downstream_value: 3
  downstream_breadth: 4
  critical_path: 3
engineering_health:
  maintenance_reduction: 2
  complexity_reduction: 2
  reliability_testability: 3
  recurring_time_saved: 3
estimate:
  effort_points: 2
  implementation_complexity: 1
  coordination_complexity: 2
evidence:
  - tasks/signboard-v2-migration/.board.json
  - tasks/V2-project-management.md
  - lib/cardFrontmatter.js
  - scripts/migrate-v2-internal-board.js
  - package.json
execution:
  specification_clarity: 4
  verification_strength: 3
  boundedness: 4
  isolation: 5
  coordination_complexity: 2
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 4
  strategic_fit: 4
  urgency: 2
  maintenance_delta: 1
next_action: Run `npm run test:v2-internal-board` after each accepted V2 contract change and refresh the board before implementation continues.
priority_class: P2
status_summary: 'All 24 internal cards use the canonical signboard_v2 namespace; the migration script and freshness check keep this living fixture aligned as V2 evolves.'
work_type: documentation
signboard_v2:
  contract_version: 1
  kind: task
  work_type: documentation
  priority_class: P2
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  estimate:
    effort_points: 2
    implementation_complexity: 1
    coordination_complexity: 2
  status_summary: 'All 24 internal cards use the canonical signboard_v2 namespace; the migration script and freshness check keep this living fixture aligned as V2 evolves.'
  next_action: Run `npm run test:v2-internal-board` after each accepted V2 contract change and refresh the board before implementation continues.
  engineering_health:
    maintenance_reduction: 2
    complexity_reduction: 2
    reliability_testability: 3
    recurring_time_saved: 3
  enablement:
    downstream_value: 3
    downstream_breadth: 4
    critical_path: 3
  modifiers:
    confidence: 4
    strategic_fit: 4
    urgency: 2
    maintenance_delta: 1
  execution:
    specification_clarity: 4
    verification_strength: 3
    boundedness: 4
    isolation: 5
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
# Refresh triggers

- V2 metadata namespace changes.
- Board profile or stage semantics change.
- A computed section is added, renamed, or removed.
- CLI, MCP, or desktop support becomes asymmetric.
- Current compatibility rules change.

# Acceptance criteria

- [x] Stage lists match the current migration workflow.
- [x] Cards use the current agreed metadata shape.
- [x] Dependencies point to real cards or explicit decisions.
- [x] Completed discoveries preserve evidence.
- [x] New V2 concepts are introduced here before implementation assumes them.

# Objective

Keep this migration board as a truthful, runnable fixture for the accepted V2 card/profile/UI contracts as implementation evolves.

# Scope

Update task metadata, labels, stages, dependencies, and examples only when an accepted contract changes. Do not use this card to hide new runtime implementation scope.

# Verification

- Audit all board cards after each accepted contract change for status, dependencies, acceptance, and evidence.
- Check that references resolve to real files or explicit decisions and that completed discoveries retain evidence.
- Rollback: revert the documentation-only board update without changing runtime data.
