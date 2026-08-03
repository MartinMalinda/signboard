---
title: 'V2 migration board charter: product-development mode for Signboard'
labels:
  - epic
  - migration
  - docs
status: Active
signboard_id: n6Wan
signboard_board: signboard-v2-migration
signboard_list: Active
signboard_uri: signboard://open-card?id=n6Wan
createdAt: 2026-08-03T12:54:56.333Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.333Z
area: v2-migration
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
estimate:
  effort_points: 5
  implementation_complexity: 2
  coordination_complexity: 3
evidence:
  - tasks/V2-project-management.md
  - docs/codex/PROJECT_CONTEXT.md
  - lib/boardSnapshot.js
  - lib/boardCreation.js
  - shared/v2BoardProfile.js
  - signboard-vue/src/stores/useBoardDataStore.ts
execution:
  specification_clarity: 4
  verification_strength: 3
  boundedness: 3
  isolation: 2
  coordination_complexity: 3
  autonomous_execution_blocked: true
  do_not_autorun: true
framework_status: active
framework_version: 1
kind: epic
modifiers:
  confidence: 4
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Phase 1 card-clarity gate is complete. Review the Phase 2 score/dashboard fixture task before broadening the pilot.
priority_class: P2
signboard_v2:
  contract_version: 1
  kind: epic
  work_type: enablement
  priority_class: P2
  estimate:
    effort_points: 5
    implementation_complexity: 2
    coordination_complexity: 3
  status_summary: 'First implementation phase complete: the migration board is enabled for the V2 pilot, new boards default to the product profile, and profile, evaluator, snapshot, and Dashboard seams are implemented and tested.'
  next_action: Phase 1 card-clarity gate is complete. Review the Phase 2 score/dashboard fixture task before broadening the pilot.
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 5
  modifiers:
    confidence: 4
    strategic_fit: 5
    urgency: 3
    maintenance_delta: -1
  execution:
    specification_clarity: 4
    verification_strength: 3
    boundedness: 3
    isolation: 2
    coordination_complexity: 3
    autonomous_execution_blocked: true
    do_not_autorun: true
  eligibility:
    readiness: true
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
status_summary: 'First implementation phase complete: the migration board is enabled for the V2 pilot, new boards default to the product profile, and profile, evaluator, snapshot, and Dashboard seams are implemented and tested.'
work_type: enablement
---
# Objective

**vcvxc**

Create the internal migration workspace for Signboard V2, where the product itself is the project being managed.

# Boundary

The framework in tasks/V2-project-management.md is a capability target, not a requirement to hardcode every concept immediately. Current Signboard remains the compatibility baseline. V2 should add product-development affordances incrementally, while boards can still use lists as customizable stages.

# Acceptance criteria

- [x] Shaping cards decide generic primitives versus V2-specific behavior.
- [x] Ready cards describe a bounded first implementation slice.
- [x] Every card states whether it changes runtime behavior or prepares a seam.
- [x] New framework detail becomes a follow-up card, not hidden scope.

# Technical starting point

Boards are folders, lists are subdirectories, and cards are Markdown files. .board.json already stores list order and board settings. Card frontmatter preserves unknown keys. Normal rendering already has a batched readBoardSnapshot path and a Vue board data store.

# Verification

- Review the migration board after each accepted contract change.
- Confirm runtime changes and documentation/seam preparation are explicit on every card.
- Confirm legacy compatibility remains the default before moving implementation cards to Active.
