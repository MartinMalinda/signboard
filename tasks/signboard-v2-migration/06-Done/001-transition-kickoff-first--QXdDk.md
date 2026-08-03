---
title: 'Transition kickoff: first V2 implementation sequence is ready'
labels:
  - epic
  - migration
  - docs
createdAt: 2026-08-03T12:54:58.452Z
activity:
  - type: created
    at: 2026-08-03T12:54:58.452Z
area: transition
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
estimate:
  effort_points: 2
  implementation_complexity: 1
  coordination_complexity: 1
evidence:
  - tasks/signboard-v2-migration/.board.json
  - tasks/signboard-v2-migration/00-Context
  - tasks/signboard-v2-migration/01-Shaping
  - tasks/signboard-v2-migration/02-Ready
execution:
  specification_clarity: 5
  verification_strength: 4
  boundedness: 5
  isolation: 5
  coordination_complexity: 1
framework_status: done
framework_version: 1
kind: epic
modifiers:
  confidence: 5
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 1
next_action: Complete the opt-in snapshot projection, then expose the first dashboard seam.
priority_class: P2
status_summary: Shaping decisions and the Phase 1 implementation handoff are prepared; the board-profile seam is next.
work_type: enablement
signboard_v2:
  contract_version: 1
  kind: epic
  work_type: enablement
  priority_class: P2
  estimate:
    effort_points: 2
    implementation_complexity: 1
    coordination_complexity: 1
  status_summary: Shaping decisions and the Phase 1 implementation handoff are prepared; the board-profile seam is next.
  next_action: Complete the opt-in snapshot projection, then expose the first dashboard seam.
  enablement:
    downstream_value: 5
    downstream_breadth: 5
    critical_path: 5
  modifiers:
    confidence: 5
    strategic_fit: 5
    urgency: 3
    maintenance_delta: 1
  execution:
    specification_clarity: 5
    verification_strength: 4
    boundedness: 5
    isolation: 5
    coordination_complexity: 1
  eligibility:
    readiness: false
    dependencies: true
    date_window: false
    scope: false
    claim_available: false
    protected_surface_clear: false
    mode: general
---
# Recommended sequence

1. Resolve the V2 card contract.
2. Define the per-board profile and first dashboard sections.
3. Choose compatibility and migration behavior.
4. Specify the pure evaluator and fixture contract.
5. Implement the optional board profile.
6. Extend the snapshot projection.
7. Wire the first dashboard and agent-facing metadata paths.

# Handoff

The next active work should be a shaping decision, not an implementation card. Once the contract is accepted, move the board-profile seam to Active.

# Objective

Coordinate the handoff from V2 shaping into the first bounded implementation seam after the product, compatibility, evaluator, and UI contracts are accepted.

# Verification

- Confirm all shaping decisions are in Done with checked decision criteria.
- Confirm the first Ready card has bounded scope, acceptance criteria, and verification before moving it to Active.
- Keep downstream cards gated by explicit dependencies rather than starting them in parallel prematurely.

# Acceptance criteria

- [x] Shaping decisions are recorded and evidence-linked.
- [x] Ready cards describe bounded implementation slices.
- [x] The first board-profile implementation seam is moved to Active, reviewed, and completed.
