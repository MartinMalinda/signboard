---
title: Choose migration and compatibility strategy for existing boards and cards
historical: true
labels:
  - discovery
  - migration
  - data-model
createdAt: 2026-08-03T12:54:56.912Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.912Z
area: compatibility
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
engineering_health:
  maintenance_reduction: 4
  complexity_reduction: 2
  reliability_testability: 4
  recurring_time_saved: 3
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 3
evidence:
  - lib/cardFrontmatter.js
  - lib/boardLabels.js
  - lib/boardDuplication.js
  - lib/orderManifest.js
  - docs/codex/PROJECT_CONTEXT.md
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
  confidence: 4
  strategic_fit: 5
  urgency: 4
  maintenance_delta: -1
next_action: Implement shared read/normalize behavior and make any write migration explicit and user-approved.
priority_class: P1
risk_prevented:
  likelihood: 4
  harm: 4
  blast_radius: 5
  mitigation_effectiveness: 4
  credible_tail: true
  horizon: 12m
status_summary: 'Decision accepted: hybrid read-old/write-new compatibility with no implicit rewrite or backfill.'
work_type: technical_debt
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: technical_debt
  priority_class: P1
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  estimate:
    effort_points: 3
    implementation_complexity: 2
    coordination_complexity: 3
  status_summary: 'Decision accepted: hybrid read-old/write-new compatibility with no implicit rewrite or backfill.'
  next_action: Implement shared read/normalize behavior and make any write migration explicit and user-approved.
  risk_prevented:
    likelihood: 4
    harm: 4
    blast_radius: 5
    mitigation_effectiveness: 4
    credible_tail: true
    horizon: 12m
  engineering_health:
    maintenance_reduction: 4
    complexity_reduction: 2
    reliability_testability: 4
    recurring_time_saved: 3
  modifiers:
    confidence: 4
    strategic_fit: 5
    urgency: 4
    maintenance_delta: -1
  execution:
    specification_clarity: 2
    verification_strength: 2
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
# Scenarios

- Legacy board with arbitrary Markdown cards and legacy list directories.
- New board created by desktop, CLI, MCP, or an AI agent.
- Mixed board where only some cards are V2-shaped.
- Trello, Obsidian, and Tasks.md imports.
- External card edits refreshed through the board watcher.

# Options

1. Opt-in board profile with lazy classification.
2. Explicit dry-run migration followed by user-approved writes.
3. Agent-created V2 scaffolding with no automatic legacy backfill.
4. Hybrid read-old/write-new behavior.

# Accepted decision

Use hybrid read-old/write-new behavior. Opening and reading a board never rewrites arbitrary Markdown or backfills missing V2 metadata. Mixed boards are supported; new V2-aware writers emit only additive `signboard_v2` fields; list folders remain the initial status source of truth. Any backfill is an explicit dry-run and user-approved operation with diff reporting, rollback, and error handling. Desktop, CLI, MCP, and importers must share the same normalizer.

# Acceptance criteria

- [x] Board open never rewrites arbitrary card Markdown.
- [x] Unknown frontmatter round-trips as a compatibility invariant.
- [x] Legacy list folders remain readable and renameable.
- [x] CLI/MCP/desktop agree on the intended list-derived V2 status semantics.
- [x] Rollback and error reporting are explicit requirements for any future migration writer.

# Objective

Choose a compatibility strategy that lets legacy and V2-shaped cards coexist without implicit rewrites or unsafe metadata invention.

# Scope

Decide read/write behavior, explicit migration boundaries, status ownership, and cross-entry-point normalization; leave implementation and migration tooling to ready cards.

# Verification

Decision reviewed against card frontmatter preservation, legacy list compatibility, desktop/CLI/MCP/import seams, and external-edit synchronization.
