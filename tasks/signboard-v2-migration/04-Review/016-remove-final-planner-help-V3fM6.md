---
title: Remove final Planner helper and documentation residue
statusChangedAt: 2026-08-05T06:35:11.324Z
createdAt: 2026-08-05T06:31:14.189Z
activity:
  - type: created
    at: 2026-08-05T06:31:14.189Z
  - type: moved-list
    at: 2026-08-05T06:31:58.136Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T06:35:11.324Z
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
  objective: Complete the final Planner retirement cleanup without disturbing supported dated work.
  scope: Remove the unused temporal helper and every remaining Planner-era wording/reference from product code, active docs, tests, generated output, and user-facing artifacts. Internal audit cards may retain the term only as provenance.
  acceptance_criteria:
    - Unused Planner/temporal helper code is removed or explicitly justified.
    - Active architecture, project-context, and design docs no longer describe Planner as supported.
    - No supported product, active documentation, test, generated output, or user-facing artifact presents Planner as a concept.
    - V2 scoring, dated-work metadata, Kanban/Table paths, and approved Table search direction are unchanged.
  verification: Run reference searches, board views, snapshots, date parsing, notifications, calendar, and diff checks.
  status_summary: Independent review found residual helper and active Planner-era documentation after retirement cleanup.
  next_action: Assign a final residue cleanup, then request final Planner retirement review.
  estimate:
    effort_points: 2
---
Finish the remaining owner-approved Planner retirement residue: remove the unused temporal helper in app/board/boardLabels.js and generated app/signboard.js where safe, update remaining Planner-era wording in docs/codex/FILE_STRUCTURE.md, docs/codex/PROJECT_CONTEXT.md, and DESIGN.md, and classify any historical migration references. Do not alter V2 scoring, dated-work metadata, Kanban/Table paths, or Table search direction.

## Final cleanup result\n\nRemoved the unused temporal helper chain and regenerated app/signboard.js; cleaned active Planner/temporal references from AGENTS, DESIGN, FILE_STRUCTURE, PROJECT_CONTEXT, PARITY, and related product artifacts. Board views/snapshots, card/date metadata, task parsing, notifications, calendar, evaluator/card metadata, renderer selection, Vue packaging, buildjs.sh, npm run build:vue, and git diff --check passed. Scoped searches find zero Planner/temporal references outside internal migration/audit cards.\n\nReview request: verify the merciless-retirement scope and historical-audit boundary.