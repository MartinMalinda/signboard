---
title: Share one V2 dashboard section adapter across Dashboard and Table
labels:
  - dashboard
  - renderer
  - data-model
  - testing
statusChangedAt: 2026-08-04T17:47:11.782Z
createdAt: 2026-08-04T17:36:33.238Z
activity:
  - type: created
    at: 2026-08-04T17:36:33.238Z
  - type: moved-list
    at: 2026-08-04T17:39:05.717Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T17:47:11.782Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
signboard_v2:
  contract_version: 1
  kind: task
  work_type: product
  priority_class: P2
  parent: "V2 product-development feedback specification (source of truth)"
  objective: Keep Dashboard and Table/View all aligned on one evaluator-backed section projection.
  scope: Extract a typed V2 section adapter for membership, ordering, reason formatting, and unbounded results; preserve current five sections, evaluator formulas, priority/impact fallbacks, and legacy boards.
  acceptance_criteria:
    - Dashboard and Table/View all use the same section membership and comparator for configured V2 sections.
    - Agent-loop ordering remains agent_pick_index-based in both surfaces.
    - Reason codes have one human-readable formatter used by the relevant UI surfaces.
    - Existing fallback, empty-section, filter-preservation, and card-opening behavior remains intact.
    - No plugin registry, new section, or broad configurable predicate system is introduced.
  verification: Run focused Dashboard/Table Vue tests and npm run build:vue; add regression coverage for Agent-loop View all ordering and summary counts.
  depends_on:
    - Assess generic dashboard lenses and per-card membership explanations
  status_summary: Ready after discovery validated a narrow adapter seam.
  next_action: Inspect dashboardSections.ts, DashboardView.vue, TableView.vue, and App.vue before extracting shared behavior.
  estimate:
    effort_points: 3
---
Implement the bounded dashboard reuse validated by discovery: centralize V2 section membership, comparator, reason formatting, and unbounded View-all results while preserving evaluator authority, current fallback rules, and the existing five sections. Do not build a generic plugin registry or add sections.

Development review evidence: shared dashboardSections.ts now owns section membership, ordering, reason formatting, and section-aware Table/View-all sorting; DashboardView.vue, TableView.vue, tableView.js, and V2WorkDetails.vue consume it. Focused Dashboard/Table/adapter tests passed (15 independently rerun; agent reported 17 focused), npm run build:vue and type-check passed, and git diff --check passed. Full Vue suite remains 106 passed with one unrelated pre-existing task12 accessibility failure. Move to Review for final acceptance.
Review hold: independent reviewer confirmed the bounded implementation checks pass, but the shared worktree mixes substantial unrelated Planner removal and a broad TableView rewrite that may remove board-search filtering. Keep this card in Review until those changes are separated or explicitly accepted; no runtime rollback was performed because the worktree contains pre-existing user changes.
