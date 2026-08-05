---
title: Validate teleported popover anchoring after scroll and resize
statusChangedAt: 2026-08-04T19:26:38.093Z
createdAt: 2026-08-04T18:08:20.675Z
activity:
  - type: created
    at: 2026-08-04T18:08:20.675Z
  - type: moved-list
    at: 2026-08-04T19:26:38.093Z
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
  objective: Determine whether teleported V2 popovers lose their anchor after viewport movement.
  scope: Inspect AppPopover positioning for dashboard score and editor label popovers; choose reposition-on-movement or close-on-movement, without redesigning the popover system.
  acceptance_criteria:
    - Scroll and resize behavior is reproduced or disproved with concrete component evidence.
    - The smallest safe behavior and its regression test are specified.
    - Keyboard focus, modal layers, and reduced-motion behavior remain in scope for review.
  verification: Run focused component tests and, if available, a bounded browser interaction check; record files and observed behavior.
  status_summary: UX triage reproduced a likely anchoring defect affecting dashboard and editor popovers.
  next_action: Validate the defect and recommend a bounded implementation card if warranted.
  estimate:
    effort_points: 2
---
Validate the reported V2 UX issue that teleported AppPopover instances drift after scrolling or resizing because they position only when opened. Inspect dashboard score and editor label popovers, choose the smallest robust behavior (reposition or close), and define a focused regression test. Keep the card bounded to anchoring behavior.


## Validation result

Confirmed: teleported `AppPopover` instances detach after scroll or resize. It teleports to `body`, uses `position: fixed`, computes coordinates only when opening, and has no scroll/resize listeners. This affects dashboard score and editor label popovers.

Recommendation: promote to development. Smallest safe fix is a guarded reposition handler on captured document scroll and window resize, with cleanup on unmount and a geometry regression. Preserve keyboard focus, modal-layer behavior, and reduced-motion behavior.

Verification: AppPopover navigation and shared component checks passed; the combined focused run had one unrelated existing accessibility fixture failure.