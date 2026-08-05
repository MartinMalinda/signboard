---
title: Decide ownership of Modal geometry and AppPopover accessibility API changes
statusChangedAt: 2026-08-04T21:31:59.591Z
createdAt: 2026-08-04T20:58:12.047Z
activity:
  - type: created
    at: 2026-08-04T20:58:12.047Z
  - type: moved-list
    at: 2026-08-04T21:31:59.591Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: decision
  work_type: product
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Assign and bound shared Modal/AppPopover geometry and accessibility API changes before acceptance.
  scope: Decide ownership of focusOnOpen, restoreFocus, role semantics, ModalInner geometry changes, and the anchored Modal regression separately from AppPopover anchoring.
  acceptance_criteria:
    - The anchoring card contains only scroll/resize repositioning, cleanup, and its focused regressions.
    - Modal geometry and public API changes have an explicit owner card or are removed from the accepted scope.
    - Role semantics and keyboard/focus behavior are verified under the chosen ownership.
  verification: Review the shared component diff and run focused AppPopover, Modal, and accessibility tests after attribution.
  status_summary: Shared component API and Modal geometry changes are mixed into a technically valid anchoring patch.
  next_action: Obtain scope ownership or create a separate Modal/accessibility implementation card before final review.
  estimate:
    effort_points: 3
---
The AppPopover isolation audit found additional changes mixed into the anchoring implementation: `focusOnOpen`, `restoreFocus`, and `role` public props; role-semantic changes for the Impact popover; `ModalInner` transform clamping/sizing; and an anchored Modal regression. Decide ownership and scope before accepting them. The validated scroll/resize AppPopover behavior can stand alone; Modal geometry and accessibility/API changes need separate attribution or explicit approval.

This card is human-gated because the changes alter shared component contracts and modal semantics.


## Best-practice scope decision

Retain the explicit AppPopover role prop because ImpactScorePopover is a dialog rather than a menu. Remove focusOnOpen and restoreFocus because no production caller uses them and they broaden the shared API for test-only control; preserve the existing focus-on-open and restore-focus behavior. Retain the ModalInner viewport clamping/sizing fix as a separate bounded shared-component change with its anchored-modal regression.
