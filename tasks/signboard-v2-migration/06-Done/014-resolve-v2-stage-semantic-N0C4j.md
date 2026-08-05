---
title: Resolve V2 stage semantics type-check gate
statusChangedAt: 2026-08-04T21:27:53.309Z
createdAt: 2026-08-04T21:22:37.259Z
activity:
  - type: created
    at: 2026-08-04T21:22:37.259Z
  - type: moved-list
    at: 2026-08-04T21:22:50.740Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T21:24:26.847Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T21:27:53.309Z
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
  objective: Restore the Vue type-check/build gate for the stage-semantics implementation without changing runtime semantics.
  scope: Resolve only the unused @ts-expect-error in signboard-vue/lib/v2StageSemantics.ts and verify the existing stage behavior.
  acceptance_criteria:
    - Vue type-check and npm run build:vue complete successfully.
    - Stage role resolution behavior and legacy-board preservation are unchanged.
    - Focused stage-semantic tests remain green.
  verification: Run npm run build:vue, the stage-semantics test, snapshot/due/calendar checks, and git diff --check.
  status_summary: Stage implementation review is blocked only by an unused TypeScript suppression directive.
  next_action: Assign a narrow type-check fix, then rerun stage review.
  estimate:
    effort_points: 1
---
Resolve the Vue type-check failure reported during review of the stage-semantics implementation: an unused `@ts-expect-error` in `signboard-vue/lib/v2StageSemantics.ts`. Confirm whether the directive is stale or the intended type contract is missing, make only the minimal type-safe correction, and rerun the Vue build/type-check plus stage-focused tests. Do not change stage role behavior, list names, or card metadata.

## Development result\n\nRemoved only the unused @ts-expect-error from signboard-vue/lib/v2StageSemantics.ts. npm run build:vue, test:v2-stage-semantics, board snapshot, due notifications, external calendar, and git diff --check all passed. Existing Vite CommonJS/chunk-size warnings are non-fatal.\n\nReview request: confirm the one-file change restores the type-check gate without changing stage runtime behavior.

## Review result: accept

Independent review accepted the stage resolver and one-line type-check fix. The resolver fails closed for unmapped/ambiguous roles, terminal stages are excluded from due/calendar consumers, V2-disabled boards retain legacy workflow behavior, and no list renames, card-frontmatter writes, or metadata backfills occur.

Passed: npm run build:vue, test-v2-stage-semantics, board snapshot, due notifications, external calendar, and git diff --check. Only non-fatal Vite warnings remain.