---
title: Define configurable semantic roles for V2 stages
labels:
  - discovery
  - data-model
  - migration
statusChangedAt: 2026-08-04T17:55:12.283Z
createdAt: 2026-08-04T17:32:11.448Z
activity:
  - type: created
    at: 2026-08-04T17:32:11.448Z
  - type: moved-list
    at: 2026-08-04T17:38:29.656Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-04T17:55:12.283Z
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
  objective: Let V2 behavior use configurable stage roles while preserving custom list names.
  scope: Audit current profile stage mappings and literal-name assumptions; specify the smallest settings/evaluator shape for roles such as shaping, ready, active, review, terminal, and blocked.
  acceptance_criteria:
    - All current consumers that need stage semantics are identified with source evidence.
    - The proposed role mapping works for the existing numbered migration lists and custom names.
    - Legacy boards and unmapped lists have conservative behavior.
    - A bounded implementation slice and migration/test plan are recorded.
  verification: Trace stage use through settings, snapshot/evaluator, dashboard, notifications, and agent eligibility; validate with a custom-name fixture.
  status_summary: Feedback warns against literal list-name semantics.
  next_action: Find every stage-name comparison and compare it with the existing settings.v2 stages contract.
  estimate:
    effort_points: 3
---
Discovery: inspect current stage/profile mappings and determine how shaping, backlog, ready, active, review, terminal, and blocked semantics can be configured without literal list-name checks. Propose the smallest board-settings and evaluator contract plus migration behavior.

Validated discovery: settings.v2.stages already has the correct role-to-list shape, but lib/boardSnapshot.js resolves exact mappings independently, dashboardSections.ts duplicates semantics, DashboardView.vue treats unknown status as ready, and due notifications ignore V2 mappings in favor of legacy completed-list names. Duplicate/missing mappings are fragile; custom V2 terminal lists can remain actionable. Recommended seam: shared resolver returning stage/mapped/ambiguous/terminal, snapshot/dashboard/notifications/calendar consumers using it, fail closed for unmapped/ambiguous V2 lists, and preserve legacy behavior on V2-disabled boards. No card frontmatter backfill or list renames.
