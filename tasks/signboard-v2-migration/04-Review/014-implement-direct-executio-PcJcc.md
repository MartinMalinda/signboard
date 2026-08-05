---
title: Implement direct execution ceiling and background-selection policy
statusChangedAt: 2026-08-05T05:05:40.618Z
createdAt: 2026-08-04T21:31:59.782Z
activity:
  - type: created
    at: 2026-08-04T21:31:59.782Z
  - type: moved-list
    at: 2026-08-04T21:32:29.353Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T05:05:40.618Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: product
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Migrate execution controls directly to the new policy model without legacy boolean compatibility.
  scope: Implement one execution ceiling and separate background selection, with conservative defaults, safety caps, and explicit no-runner messaging.
  acceptance_criteria:
    - Legacy execution booleans and compatibility handling are removed from the supported V2 contract.
    - The new execution ceiling and background-selection control serialize and render consistently.
    - P0/P1 and A2 caps remain enforced.
    - Missing new-format values default conservatively.
    - UI/docs do not imply that a real agent runner or merge executor exists.
  verification: Run focused execution-policy, settings, card-editor, evaluator/gate, and serialization tests; inspect docs and fixtures for legacy field assumptions.
  status_summary: Owner approved a direct migration to the new execution-policy format.
  next_action: Assign development, then review schema, UI, safety caps, and migration removal.
  estimate:
    effort_points: 5
---
Implement the owner-approved direct migration to the new execution policy format. Replace the legacy execution booleans with one explicit execution ceiling (Human only, Analysis and planning only, Supervised implementation, Autonomous pull request, and policy-permitted Autonomous merge) plus a separate background-selection control. Remove legacy field support rather than preserving compatibility. Use conservative defaults for missing new-format values, keep P0/P1 and A2 caps, and clearly state that Signboard has no real agent runner/merge executor yet. Do not broaden into unrelated dashboard or scoring changes.

Development result: partial, not ready to merge. The direct execution-policy migration touched shared execution policy, evaluator, card metadata, board profile, settings/editor/card-creation/type files, and fixtures. Evaluator, card-metadata, and board-label tests pass, but board-snapshot is blocked because malformed policy fields are normalized away before evaluator warnings; settings/editor tests were not run. Keep this card in Review pending the focused serialization/provenance follow-up.
The serialization/provenance follow-up y8Utu implemented the missing new-format handling. Request a fresh review of PcJcc together with that follow-up; keep legacy booleans removed and no-runner messaging explicit.