---
title: Finalize shared Popover API and viewport-safe Modal geometry
statusChangedAt: 2026-08-05T06:20:03.711Z
createdAt: 2026-08-04T21:31:59.984Z
activity:
  - type: created
    at: 2026-08-04T21:31:59.984Z
  - type: moved-list
    at: 2026-08-04T21:32:29.824Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-05T05:05:40.934Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-05T06:20:03.711Z
    fromListDirectoryName: 04-Review
    fromListDisplayName: 04-Review
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: task
  work_type: correctness
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Apply the shared-component best-practice boundary for AppPopover and Modal geometry.
  scope: Keep anchoring and required dialog role semantics, remove unused focus/restore API expansion, and retain viewport-safe ModalInner geometry with focused tests.
  acceptance_criteria:
    - AppPopover keeps scroll/resize anchoring and the role needed by the Impact dialog.
    - Unused focusOnOpen and restoreFocus public props are removed or explicitly justified by a production caller.
    - ModalInner clamping/sizing remains covered by an anchored-modal regression.
    - Keyboard focus, restore-focus, modal-layer, and reduced-motion behavior remain intact.
  verification: Run shared component, Task 12 accessibility, Dashboard/Impact popover, Modal, build, and diff checks.
  status_summary: 'Best-practice scope was decided: narrow the AppPopover API and retain the bounded Modal geometry fix.'
  next_action: Assign a bounded shared-component cleanup, then review the isolated diff.
  estimate:
    effort_points: 3
---
Apply the shared-component boundary decision. Keep AppPopover scroll/resize anchoring and the explicit role prop required by the Impact breakdown dialog. Remove the unused focusOnOpen and restoreFocus public props and their test-only API expansion, preserving the existing focus/restore behavior for production popovers. Retain the viewport-safe ModalInner clamping/sizing behavior and its anchored-modal regression as separate, explicitly covered component scope. Do not alter evaluator formulas or unrelated board work.


## Development result: review

Shared-component cleanup changed AppPopover and Task12 tests only; AppPopover tests (3), Modal/Dashboard tests (10), Vue build/type-check, and diff checks passed. Existing ModalInner viewport-safe geometry/regression remains in the worktree. A full Task12 run still has one unrelated pre-existing fixture failure due to missing aria-modal.

Review that unused focus/restore API expansion is removed, the required dialog role remains, anchoring/focus/restore/modal-layer/reduced-motion behavior is preserved, and ModalInner geometry remains separately attributable.

## Review result: accept

Independent review accepted the shared-component cleanup. AppPopover retains scroll/resize anchoring, listener cleanup, required Impact dialog role, focus/restore behavior, modal-layer and reduced-motion behavior; unused focusOnOpen/restoreFocus props are absent. ModalInner viewport clamping is covered by the anchored-modal regression.

Focused tests: 15 passed with one unrelated pre-existing Task12 fixture failure; build/type-check and git diff check passed. The attributable scope is AppPopover, ModalInner, shared component tests, and Task12 regression coverage.