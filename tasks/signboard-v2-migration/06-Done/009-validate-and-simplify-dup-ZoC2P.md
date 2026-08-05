---
title: Validate and simplify duplicated V2 editor metadata controls
statusChangedAt: 2026-08-04T19:26:38.704Z
createdAt: 2026-08-04T18:08:20.866Z
activity:
  - type: created
    at: 2026-08-04T18:08:20.866Z
  - type: moved-list
    at: 2026-08-04T19:26:38.704Z
    fromListDirectoryName: 01-Shaping
    fromListDisplayName: 01-Shaping
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: discovery
  work_type: discovery
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Clarify ownership of duplicated V2 editor metadata controls before changing the editor.
  scope: Compare V2WorkDetails and V2WorkControls responsibilities for Kind, Work type, Priority, effort, and stage; preserve the existing metadata contract and keyboard access.
  acceptance_criteria:
    - Duplication is classified as intentional, confusing, or functionally conflicting.
    - Any proposed consolidation names the retained control and affected tests.
    - No editor redesign is proposed solely to increase feature completeness.
  verification: Inspect the renderer flow and focused editor tests; record a minimal recommendation or explicit defer decision.
  status_summary: UX triage found repeated metadata controls in the V2 editor surfaces.
  next_action: Validate whether the repetition causes user confusion and keep any change bounded.
  estimate:
    effort_points: 2
---
Validate the reported duplication between the V2 editor summary and notes toolbar controls for Kind, Work type, Priority, effort, and stage. Recommend a minimal ownership/consolidation change only if the duplication is confusing in practice; preserve keyboard access and existing frontmatter semantics.


## Validation result

The duplication is presentation-only: V2WorkDetails is a read-only summary, while V2WorkControls owns editable Kind, Work type, Priority, and stage controls. Both derive from the same frontmatter and save queue; focused ownership tests pass.

Recommendation: explicitly defer structural consolidation. If polish is later desired, consider copy-only wording such as “V2 summary”; do not move controls without a broader editor review.