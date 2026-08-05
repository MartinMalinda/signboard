---
title: Implement anchored AppPopover repositioning
statusChangedAt: 2026-08-05T06:20:04.070Z
createdAt: 2026-08-04T19:26:43.095Z
activity:
  - type: created
    at: 2026-08-04T19:26:43.095Z
  - type: moved-list
    at: 2026-08-04T19:28:25.759Z
    fromListDirectoryName: 02-Ready
    fromListDisplayName: 02-Ready
    toListDirectoryName: 03-Active
    toListDisplayName: 03-Active
  - type: moved-list
    at: 2026-08-04T19:30:29.728Z
    fromListDirectoryName: 03-Active
    fromListDisplayName: 03-Active
    toListDirectoryName: 04-Review
    toListDisplayName: 04-Review
  - type: moved-list
    at: 2026-08-05T06:20:04.070Z
    fromListDirectoryName: 04-Review
    fromListDisplayName: 04-Review
    toListDirectoryName: 06-Done
    toListDisplayName: 06-Done
signboard_v2:
  contract_version: 1
  kind: task
  work_type: ux
  priority_class: P2
  parent: V2 product-development feedback specification (source of truth)
  objective: Keep open teleported AppPopover instances aligned with their trigger during viewport movement.
  scope: Reposition AppPopover on captured document scroll and window resize with cleanup; cover dashboard score and editor label popovers through the shared component.
  acceptance_criteria:
    - An open popover follows updated trigger coordinates after scroll.
    - An open popover follows updated trigger coordinates after resize.
    - Listeners are removed on unmount and keyboard focus/modal-layer behavior remains intact.
    - A focused geometry regression test covers the shared behavior.
  verification: Run the AppPopover component tests and the affected Dashboard/editor focused tests.
  status_summary: Discovery reproduced anchor drift and recommended a small shared-component fix.
  next_action: Assign bounded implementation, then review the diff and focused regression.
  estimate:
    effort_points: 3
---
Implement the bounded AppPopover anchoring fix validated by discovery card 008. Reposition the teleported popover on captured document scroll and window resize while it is open, remove listeners on unmount, and preserve keyboard focus, modal-layer behavior, and reduced-motion behavior. Add a focused geometry regression that changes the opener rect and asserts top/left follow it. Do not redesign AppPopover.


## Validation result

Confirmed: teleported `AppPopover` instances detach after scroll or resize. It teleports to `body`, uses `position: fixed`, computes coordinates only when opening, and has no scroll/resize listeners. This affects dashboard score and editor label popovers.

Recommendation: promote to development. Smallest safe fix is a guarded reposition handler on captured document scroll and window resize, with cleanup on unmount and a geometry regression. Preserve keyboard focus, modal-layer behavior, and reduced-motion behavior.

Verification: AppPopover navigation and shared component checks passed; the combined focused run had one unrelated existing accessibility fixture failure.
## Development result\n\nImplemented captured document-scroll and window-resize repositioning with listener cleanup in AppPopover; added geometry and cleanup regressions. Focused AppPopover tests (3) and shared component tests (4) passed; ESLint and git diff --check passed. Broader Dashboard test was blocked by an unrelated missing lib/impactScore import; the full accessibility file has a pre-existing aria-modal fixture failure and type-check has an unrelated v2StageSemantics error.\n\nReview request: inspect only the AppPopover/test diff and verify no unrelated dirty-worktree changes are included.

## Review result: revise

The scroll/resize anchoring behavior is sound: captured document scroll and window resize reposition the open teleported popover, listeners clean up, and geometry tests pass. Existing focus/navigation, modal-layer, and reduced-motion behavior remain intact.

Scope hold: `components.spec.ts` adds an unrelated anchored Modal test, and AppPopover also includes unrelated public props (`focusOnOpen`, `restoreFocus`, `role`) and role-semantic changes. Keep this card in Review until those changes are attributed or isolated; do not accept mixed worktree scope silently.

Focused results: popover tests 3 passed (3 skipped), shared component tests 4 passed, Task 12 had 9 passes plus one pre-existing modal-discovery fixture failure, and `git diff --check` passed.
Attribution audit confirms the anchoring listener/reposition code and two Task 12 regressions belong here. ModalInner geometry, anchored Modal test, focusOnOpen/restoreFocus props, and role/menu-to-dialog semantics are separate or human-gated; keep this Review card unreleased until scope is isolated.
Shared-component cleanup card mpHd7 supersedes this earlier anchoring review; the independent acceptance covers the anchoring behavior and its scope. Closed as completed implementation evidence.