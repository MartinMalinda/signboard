---
title: Update execution-policy documentation to the new contract
statusChangedAt: 2026-08-05T06:40:51.533Z
createdAt: 2026-08-05T06:31:13.997Z
activity:
  - type: created
    at: 2026-08-05T06:31:13.997Z
  - type: moved-list
    at: 2026-08-05T06:35:25.135Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T06:40:51.533Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: documentation
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Align agent-facing execution-policy guidance with the owner-approved direct new-format contract.
  scope: Update framework/reference guidance for execution ceiling, background selection, defaults, safety caps, no runner, and removal of legacy fields; label historical migration records clearly.
  acceptance_criteria:
    - Active guidance no longer presents legacy execution booleans or do_not_autorun as supported V2 fields.
    - The new execution ceiling/background selection and safety caps are documented.
    - No-runner limitations are explicit.
    - Historical references remain only when clearly labeled historical.
  verification: Search active docs and framework references for legacy fields, review updated guidance, and run documentation/metadata checks.
  status_summary: Execution implementation review found stale active legacy-policy documentation.
  next_action: Assign documentation cleanup, then re-review execution-policy scope.
  estimate:
    effort_points: 2
---
Update execution-policy documentation and framework references to the owner-approved direct new-format contract. Remove active guidance for legacy execution booleans and do_not_autorun; document execution ceiling, background selection, conservative defaults, P0/P1/A2 caps, and the absence of a real agent runner. Preserve historical migration records only when clearly labeled historical.

## Development result\n\nUpdated active execution-policy guidance and framework references to the direct ceiling/background contract; removed active legacy-field guidance, labeled 14 historical records, and documented conservative defaults, P0/P1 to A2 caps, and no-runner limitation. Active legacy scans, historical scan, frontmatter, metadata, evaluator, internal-board, and diff checks passed. No runtime behavior changed.\n\nReview request: verify active documentation no longer advertises legacy execution fields and historical records are clearly labeled.