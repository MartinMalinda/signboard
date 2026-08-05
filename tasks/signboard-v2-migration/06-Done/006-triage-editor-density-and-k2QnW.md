---
title: Triage editor density and small dashboard UX observations
labels:
  - discovery
  - ux
  - renderer
statusChangedAt: 2026-08-04T18:10:19.540Z
createdAt: 2026-08-04T17:32:12.218Z
activity:
  - type: created
    at: 2026-08-04T17:32:12.218Z
  - type: moved-list
    at: 2026-08-04T18:10:19.540Z
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
  objective: Separate evidence-backed usability fixes from speculative V2 editor/dashboard redesign.
  scope: Validate the feedback's density, score-label, popover-anchor, bottom-padding, duplicate-metadata, inspector, dependency, native-select, and spellcheck observations against current UI behavior.
  acceptance_criteria:
    - Each observation is marked reproduced, disproved, or not worth follow-up.
    - Only independently verifiable, user-impacting fixes become development cards.
    - No inspector rewrite or new dashboard surface is proposed without evidence.
    - Accessibility, keyboard, compact-window, and reduced-motion risks are included in triage.
  verification: Use existing component tests and focused Playwright/screenshot checks where appropriate; record concrete selectors/files for any follow-up.
  status_summary: Feedback includes several visual refinements with uneven product value.
  next_action: Review current V2 card/editor/dashboard surfaces and rank only reproducible issues.
  estimate:
    effort_points: 2
---
Discovery: validate which of the feedback's compactness, score labels, anchored popover, bottom padding, duplicate metadata, inspector layout, dependency semantics, native selects, and spellcheck observations are real usability problems. Rank only evidence-backed follow-ups; avoid redesign for completeness.


## UX triage result

The retrying UX auditor found three bounded, evidence-backed follow-ups:

- AppPopover positions only when opened, so teleported dashboard score and editor label popovers can drift after scrolling or resizing. Captured in `008-validate-teleported-popov-oNNua`.
- V2WorkDetails repeats Kind, Work type, Priority, and effort controls that also appear in V2WorkControls; stage ownership also needs clarification. Captured in `009-validate-and-simplify-dup-ZoC2P`.
- The visible Impact chip and breakdown use different precision while both say “Impact score.” Captured in `010-align-visible-and-breakdo-PgUK1`.

No concrete density/inspector overflow, bottom-padding, dependency-contract, native-select, or spellcheck defect was reproduced. Those observations are explicitly deferred rather than expanded into speculative redesign.

Verification: focused UX checks passed 27/28; the lone failure was a stale accessibility fixture missing `aria-modal="true"`, not a reproduced V2 UX failure. V2 evaluator, stage-semantics, and board-snapshot checks passed.