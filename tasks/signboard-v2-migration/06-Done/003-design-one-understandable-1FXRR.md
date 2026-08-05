---
title: Design one understandable execution-policy model for agent work
historical: true
labels:
  - discovery
  - agent
  - ux
  - data-model
statusChangedAt: 2026-08-04T17:55:11.197Z
createdAt: 2026-08-04T17:32:11.646Z
activity:
  - type: created
    at: 2026-08-04T17:32:11.646Z
  - type: moved-list
    at: 2026-08-04T17:37:48.410Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T17:55:11.197Z
    fromListDirectoryName: 04-Review
    fromListDisplayName: 04-Review
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: "V2 product-development feedback specification (source of truth)"
  objective: Define a user-facing execution policy that is easier to reason about than three overlapping booleans.
  scope: Map existing policy fields and evaluator gates to an execution ceiling, background-selection control, recommendation, and limiting reasons without weakening any human restriction.
  acceptance_criteria:
    - Current fields and persisted compatibility behavior are mapped.
    - The proposed policy distinguishes human-only, analysis-only, supervised implementation, and autonomous PR levels.
    - P0/P1 and sensitive-surface caps remain explicit.
    - A bounded data/editor/evaluator implementation slice is proposed with migration behavior.
  verification: Compare the proposal with the V2 autonomy framework and existing agent/dashboard fixtures; verify restrictive legacy combinations remain restrictive.
  status_summary: Feedback identifies overlapping agent controls and requests one understandable policy.
  next_action: Audit current execution fields, normalizers, editor controls, and agent-loop eligibility.
  estimate:
    effort_points: 3
---
Discovery: map the current agent booleans and computed autonomy fields to a single user-facing execution ceiling plus background-selection control. Identify compatibility, policy gates, recommendation/limiting-reason requirements, and the smallest implementation slice.

Validated discovery: current execution fields are agent_execution_blocked (A0), autonomous_execution_blocked (A2 cap), and do_not_autorun (background/eligibility restriction), with restrictive missing-value defaults in shared/v2Evaluator.js. V2WorkDetails.vue reads absent booleans as unchecked, creating a UI/state mismatch. No actual agent runner exists in this repository. Bounded recommendation: add a read-compatible pure policy resolver exposing effective_ceiling, background-selection state/mode, and limiting_reasons while preserving legacy fields and gates; then separately decide the editor migration. Do not broaden modes or remove fields without a compatibility decision.
