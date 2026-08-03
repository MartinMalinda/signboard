---
title: Extend the batched board snapshot with an opt-in V2 card projection
labels:
  - data-model
  - dashboard
  - testing
createdAt: 2026-08-03T12:54:57.240Z
activity:
  - type: created
    at: 2026-08-03T12:54:57.240Z
area: snapshot
blocks:
  - Create the first V2 dashboard surface beside Kanban and Table
  - Expose V2 metadata through card creation and agent paths
depends_on:
  - Add an optional V2 board profile to .board.json
  - Specify V2 score and gate evaluator as pure domain logic
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
engineering_health:
  maintenance_reduction: 4
  complexity_reduction: 3
  reliability_testability: 4
  recurring_time_saved: 4
estimate:
  effort_points: 5
  implementation_complexity: 3
  coordination_complexity: 2
evidence:
  - lib/boardSnapshot.js
  - app/board/boardSnapshot.js
  - signboard-vue/src/stores/useBoardDataStore.ts
  - signboard-vue/src/types.ts
  - scripts/test-board-snapshot.js
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 3
  isolation: 3
  coordination_complexity: 2
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 0
next_action: Hand off the shared opt-in projection to the first Dashboard surface.
priority_class: P2
status_summary: Opt-in projection passed independent compatibility review; Dashboard work may consume the shared profile/evaluator/snapshot seam.
work_type: enablement
signboard_v2:
  contract_version: 1
  kind: task
  work_type: enablement
  priority_class: P2
  depends_on:
    - Add an optional V2 board profile to .board.json
    - Specify V2 score and gate evaluator as pure domain logic
  estimate:
    effort_points: 5
    implementation_complexity: 3
    coordination_complexity: 2
  status_summary: Opt-in projection passed independent compatibility review; Dashboard work may consume the shared profile/evaluator/snapshot seam.
  next_action: Hand off the shared opt-in projection to the first Dashboard surface.
  engineering_health:
    maintenance_reduction: 4
    complexity_reduction: 3
    reliability_testability: 4
    recurring_time_saved: 4
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 5
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
    coordination_complexity: 2
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Implementation notes

- Add an explicit opt-in option rather than changing the default snapshot payload.
- Reuse existing frontmatter, task, timestamp, list, and settings reads.
- Call the pure evaluator after normalization.
- Include explainability/reason codes.
- Keep per-card read errors visible and non-fatal.

# Acceptance criteria

- [x] Existing Kanban, Table, and Planner snapshots remain compatible during the transition, but the V2 projection has no dependency on Planner-specific output.
- [x] Opt-in snapshots include profile, normalized V2 metadata, computed scores, eligibility, and section memberships.
- [x] Mixed legacy/V2 boards load without throwing.
- [x] CLI/MCP can later request or reproduce the same projection through the shared evaluator and snapshot seam.
- [x] Planner can be retired or replaced without invalidating the V2 projection.
- [x] Tests cover missing fields, P0/P1 gates, blockers, and conservative defaults.

# Objective

Extend the existing batched board snapshot with an explicit opt-in V2 projection that carries normalized card metadata, pure evaluator outputs, eligibility, and explainable dashboard memberships.

# Scope

Change the shared read/projection seam and its tests only. Do not add dashboard UI, duplicate formulas in consumers, or make V2 projection part of the default payload.

# Verification

- Run snapshot tests for legacy, mixed, V2-shaped, blocked, and malformed cards.
- Compare default and opt-in payload shapes to prove existing Kanban/Table/Planner consumers remain compatible.
- Rollback: remove the opt-in request at the adapter boundary; default snapshot behavior remains unchanged.

# Implementation handoff

The pure evaluator is implemented in `shared/v2Evaluator.js` and verified by `npm run test:v2-evaluator`. Snapshot code must call that seam after card normalization, keep V2 opt-in, and avoid duplicating formulas.

# Implementation evidence

- `lib/boardSnapshot.js` exposes `includeV2: true`, preserves default snapshots, derives list status from the enabled profile, and projects shared evaluator output per card.
- `app/board/boardSnapshot.js` and `signboard-vue/src/types.ts` preserve the opt-in shape for renderer consumers without enabling it by default.
- `scripts/test-board-snapshot.js` covers default compatibility, opt-in profiles, mixed legacy/V2 cards, malformed metadata, sparse cards, blockers, and P0/P1 autonomy caps.
- Focused and regression verification pass: `npm run test:board-snapshot`, `npm run test:v2-evaluator`, `npm run test:board-labels`, `npm run test:board-duplication`, `npm run test:app-settings`, `npm run test:mcp`, `npm run test:cli`, `npm run test:desktop-cli`, and `npm run build:vue`.
- Independent read-only review confirmed default snapshots omit `boardSettings.v2`, while `includeV2: true` preserves profile and per-card projections.
