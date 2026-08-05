---
title: Isolate AppPopover anchoring from unrelated Modal/API changes
createdAt: 2026-08-04T20:28:45.155Z
activity:
  - type: created
    at: 2026-08-04T20:28:45.155Z
signboard_v2:
  contract_version: 1
  kind: decision
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Make the validated AppPopover anchoring fix attributable and reviewable without accepting unrelated API or Modal changes.
  scope: Attribute, isolate, or explicitly justify the additional AppPopover props, role changes, and anchored Modal test alongside the scroll/resize fix.
  acceptance_criteria:
    - The accepted diff contains only the anchoring behavior and its focused regressions, or has explicit scope attribution for every additional change.
    - Focus, modal-layer, role, and reduced-motion behavior are covered by the chosen scope.
    - No destructive rollback is performed against unrelated user worktree changes.
  verification: Review the implementation diff against card 010 and run focused AppPopover/component tests after scope is resolved.
  status_summary: Implementation behavior passed review, but mixed AppPopover/Modal scope requires attribution before acceptance.
  next_action: Resolve scope ownership, then request a second review of the isolated patch.
  estimate:
    effort_points: 2
---
Review found the anchoring behavior correct but the shared worktree does not isolate it. The AppPopover diff also adds public props (`focusOnOpen`, `restoreFocus`, `role`) and role-semantic changes, while `components.spec.ts` adds an unrelated anchored Modal test. Decide whether those changes belong to another card, are required by the popover fix, or must be removed in a cleanly attributable patch. Preserve the validated scroll/resize geometry behavior and focus/modal/reduced-motion guarantees.


## Attribution audit result

Keep only captured document-scroll/window-resize repositioning, listener cleanup, and the two focused Task 12 regressions under the AppPopover anchoring card.

Separate or hold: `focusOnOpen`/`restoreFocus` public props, the `role` prop and menu-to-dialog semantics, `ModalInner` transform clamping/sizing, and the anchored Modal test in `components.spec.ts`. Do not roll back unrelated dirty-worktree changes.

Minimal plan: isolate the anchoring patch, assign Modal geometry/API changes separately or obtain owner approval, then rerun focused AppPopover/component tests.
