---
title: Resolve new execution-policy serialization and warning provenance
statusChangedAt: 2026-08-05T06:20:05.280Z
createdAt: 2026-08-05T05:05:41.279Z
activity:
  - type: created
    at: 2026-08-05T05:05:41.279Z
  - type: moved-list
    at: 2026-08-05T05:06:18.039Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T06:20:05.280Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make malformed new-format execution policy values observable and safely represented.
  scope: Fix normalization/serialization/provenance across metadata, snapshots, evaluator gates, settings, and editor surfaces without restoring legacy fields or changing unrelated score formulas.
  acceptance_criteria:
    - Malformed new-format policy fields remain observable as invalid rather than disappearing before warnings.
    - Snapshot/evaluator warnings and defaults accurately describe malformed policy data.
    - Settings and editor surfaces serialize the new format consistently.
    - No legacy boolean compatibility path is reintroduced.
  verification: Run evaluator, card-metadata, snapshot, settings, editor, and focused execution-policy tests.
  status_summary: Direct migration is incomplete because malformed policy fields are normalized away before warning provenance.
  next_action: Assign a focused serialization/provenance fix, then re-review the direct migration card.
  estimate:
    effort_points: 3
---
Resolve the direct execution-policy migration mismatch: malformed new-format policy fields are normalized away before evaluator/snapshot warnings are emitted. Preserve the owner-approved no-legacy contract, but ensure invalid new-format values are observable and safely represented through metadata, snapshots, evaluator gates, settings, and editor surfaces. Add focused settings/editor/snapshot tests; do not change unrelated score formulas.


## Development result: ready for review

The serialization/provenance follow-up fixed malformed new-format policy handling. Invalid policy values remain observable; evaluator/snapshot warnings and conservative defaults are accurate; settings fail closed; the editor preserves invalid ceilings visibly. Legacy booleans remain removed and score formulas are untouched.

Passed: V2 evaluator, card metadata, board snapshot, board labels, Vue settings/editor tests (9), Vue type-check, frontmatter tests, and git diff check. Full application/Playwright suites were not run.