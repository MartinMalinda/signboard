---
title: Assess generic dashboard lenses and per-card membership explanations
labels:
  - discovery
  - dashboard
  - renderer
  - data-model
statusChangedAt: 2026-08-04T17:55:10.599Z
createdAt: 2026-08-04T17:32:12.037Z
activity:
  - type: created
    at: 2026-08-04T17:32:12.037Z
  - type: moved-list
    at: 2026-08-04T17:36:32.952Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T17:55:10.599Z
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
  objective: Determine whether current dashboard sections can share a generic lens contract and explain membership.
  scope: Compare current section filtering, ranking, projection, limits, and empty states; avoid adding sections or broadening profile configuration until a concrete reuse seam is proven.
  acceptance_criteria:
    - Current section behavior and duplicated logic are mapped.
    - A minimal filter/ranking/projection/explanation contract is proposed or the idea is rejected as premature.
    - Per-card inclusion and exclusion reasons are specified for the existing sections.
    - Any implementation follow-up is independently verifiable and bounded.
  verification: Exercise current dashboard fixtures for inclusion, exclusion, empty sections, and View all behavior; compare the proposal with existing snapshot/evaluator seams.
  status_summary: Feedback sees dashboard sections as lenses, but warns against overbuilding.
  next_action: Trace the current section definitions and card projection path before proposing abstractions.
  estimate:
    effort_points: 5
---
Discovery: compare the current five dashboard sections and card projections with a generic filter-plus-ranking lens model. Propose the smallest reusable section contract and membership/exclusion explanation surface; defer new sections unless current evidence justifies them.

Validated discovery: a narrow V2DashboardSection adapter is justified, but a generic plugin lens framework is premature. Evidence: shared/v2Evaluator.js owns membership/reason codes; DashboardView.vue duplicates prose/ranking; Table View all mismatches Agent-loop ordering; summary counts are inconsistent. Proposed follow-up: typed section adapter for membership, comparator, reason formatting, and unbounded Table results.
