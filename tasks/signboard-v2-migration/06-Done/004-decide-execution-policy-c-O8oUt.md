---
title: Decide execution-policy compatibility before changing the agent controls
historical: true
labels:
  - discovery
  - agent
  - ux
  - data-model
statusChangedAt: 2026-08-04T21:31:59.245Z
createdAt: 2026-08-04T17:37:48.596Z
activity:
  - type: created
    at: 2026-08-04T17:37:48.596Z
  - type: moved-list
    at: 2026-08-04T21:31:59.245Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Choose a compatible user-facing execution policy before changing agent controls.
  scope: Decide whether to add an execution ceiling and background-selection control while preserving legacy booleans, restrictive missing defaults, A2/P0/P1 caps, and current gates.
  acceptance_criteria:
    - The mapping from each legacy combination to the proposed ceiling is explicit.
    - Missing and malformed values remain conservative.
    - The absence of a real agent runner is reflected in scope and rollout.
    - Field removal, gate changes, and broad mode expansion are explicitly deferred or approved.
  verification: Review the execution-policy discovery card, V2 framework, and current evaluator/UI fixtures; obtain product-owner confirmation before development.
  depends_on:
    - Design one understandable execution-policy model for agent work
  status_summary: Human-gated policy decision; no implementation authorized yet.
  next_action: Prepare a short compatibility decision table for review.
  estimate:
    effort_points: 2
---
Decision card: choose whether and how to expose an execution ceiling plus background-selection control while preserving restrictive legacy booleans, missing-value defaults, A2/P0/P1 caps, and the absence of a real agent runner. Keep field removal, gate changes, and broad mode expansion out of scope until product judgment is recorded.


## Owner decision

The owner approved a direct move to the new execution-policy format and does not require legacy boolean compatibility. Proceed with one execution ceiling plus a separate background-selection control; remove old fields and compatibility handling. Preserve conservative missing-value defaults, P0/P1/A2 safety caps, and explicit messaging that no real agent runner exists yet.
