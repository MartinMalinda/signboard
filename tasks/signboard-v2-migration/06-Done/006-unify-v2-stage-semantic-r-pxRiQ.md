---
title: Unify V2 stage semantic resolution across board consumers
labels:
  - data-model
  - migration
  - testing
  - dashboard
statusChangedAt: 2026-08-04T21:27:53.005Z
createdAt: 2026-08-04T17:38:29.830Z
activity:
  - type: created
    at: 2026-08-04T17:38:29.830Z
  - type: moved-list
    at: 2026-08-04T17:46:37.524Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T17:54:54.637Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T21:27:53.005Z
    fromListDirectoryName: 04-Review
    fromListDisplayName: 04-Review
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make configured V2 stage semantics consistent across all board consumers.
  scope: Add a shared resolver for role-to-list mappings and use it in snapshot, dashboard, due-notification, and calendar paths; preserve legacy behavior when V2 is disabled and fail closed for V2 ambiguity.
  acceptance_criteria:
    - A custom V2 profile maps list folders to semantic stages without literal-name inference.
    - Missing or duplicate V2 mappings produce unresolved/unshaped behavior, not an inferred Ready or terminal state.
    - Custom V2 terminal mappings suppress due notifications and calendar items as expected.
    - Legacy/V2-disabled boards retain existing completed-list behavior.
    - No card frontmatter backfill or list renaming occurs.
  verification: Run snapshot, due-notification, calendar, internal-board, and focused Vue/dashboard regression tests with custom-name, missing, and duplicate-mapping fixtures.
  depends_on:
    - Define configurable semantic roles for V2 stages
  status_summary: Ready after discovery validated a shared semantic-resolution seam.
  next_action: Trace the existing snapshot resolver and legacy completion paths before extracting shared behavior.
  estimate:
    effort_points: 3
---
Implement the bounded stage resolver validated by discovery: centralize role-to-list resolution, fail closed for unmapped or ambiguous V2 lists, and use the result in snapshot/dashboard/notifications/calendar consumers while preserving legacy behavior on V2-disabled boards. Do not rename lists or backfill card status.

Development review evidence: shared/v2StageSemantics.js now resolves configured role-to-list mappings with mapped/ambiguous/terminal results; boardSnapshot, dashboard helpers, Vue due notifications, and external calendar use V2 semantics while older boards keep workflow completion behavior. Focused stage semantics test passes after aligning it with the canonical list-card snapshot shape; npm run test:v2-evaluator, npm run test:board-snapshot, npm run test:due-notifications, npm run test:external-calendar, npm run test:v2-internal-board, focused Vue Dashboard/adapter/Table tests, npm run build:vue, and git diff --check pass. No list renames or card frontmatter backfill.


## Independent review result: revise

The resolver correctly uses configured roles and fails closed for ambiguous/unmapped lists. Snapshot, dashboard, notifications, and calendar consumers use the semantics while preserving legacy behavior; focused stage, snapshot, due-notification, calendar, evaluator, board-view, internal-board, Vue dashboard, and diff checks pass.

Review gate: `npm run build:vue` exits nonzero because `signboard-vue/lib/v2StageSemantics.ts:3` contains an unused `@ts-expect-error`; Vite’s build-only phase succeeds. No list renames or card-frontmatter backfill were found. Keep the implementation in Review until the type-check gate is resolved.

## Review result: accept

Independent review accepted the stage resolver and one-line type-check fix. The resolver fails closed for unmapped/ambiguous roles, terminal stages are excluded from due/calendar consumers, V2-disabled boards retain legacy workflow behavior, and no list renames, card-frontmatter writes, or metadata backfills occur.

Passed: npm run build:vue, test-v2-stage-semantics, board snapshot, due notifications, external calendar, and git diff --check. Only non-fatal Vite warnings remain.
