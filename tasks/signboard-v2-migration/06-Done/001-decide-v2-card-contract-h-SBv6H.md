---
title: 'Decide V2 card contract: hardcoded attributes versus generic fields'
historical: true
labels:
  - discovery
  - data-model
  - agent
createdAt: 2026-08-03T12:54:56.699Z
activity:
  - type: created
    at: 2026-08-03T12:54:56.699Z
area: card-contract
depends_on:
  - 'Current architecture baseline: file-backed boards, snapshots, and views'
  - 'Framework baseline: gates, value dimensions, and execution policy'
discovery_value:
  uncertainty_reduction: 5
  decision_importance: 5
  cost_of_wrong_choice: 5
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 3
evidence:
  - tasks/V2-project-management.md
  - lib/cardFrontmatter.js
  - lib/cardLifecycle.js
execution:
  specification_clarity: 2
  verification_strength: 2
  boundedness: 3
  isolation: 2
  coordination_complexity: 3
  autonomous_execution_blocked: true
  do_not_autorun: true
framework_status: done
framework_version: 1
kind: discovery
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: -1
next_action: Use the accepted contract to define the shared V2 normalizer and migration fixtures.
priority_class: P2
status_summary: 'Decision accepted: V2 metadata is additive, namespaced, legacy-safe, and list-derived for status.'
work_type: product
signboard_v2:
  contract_version: 1
  kind: discovery
  priority_class: P2
  parent: null
  depends_on:
    - 'Current architecture baseline: file-backed boards, snapshots, and views'
    - 'Framework baseline: priority, value dimensions, and delivery risk'
  blocked_by: []
  estimate:
    effort_points: 3
  discovery_value:
    uncertainty_reduction: 5
    decision_importance: 5
    cost_of_wrong_choice: 5
  modifiers:
    confidence: 3
    urgency: 3
    maintenance_delta: -1
---
# Candidate first-class attributes

- kind: epic, task, discovery, incident.
- priority_class: P0-P3 as a gate.
- Optional stable `id`.
- List-derived stage/status.
- estimate.effort_points.
- Parent, dependency, and blocker relationships.
- Opportunity, risk-prevention, discovery-value, modifier, and delivery-risk groups.

# Accepted decision

Use an additive `signboard_v2` frontmatter namespace with `contract_version: 1` for opt-in runtime V2 cards. The namespace contains only the exact trimmed contract: optional `id`, `kind`, `priority_class`, `parent`, `depends_on`, `blocked_by`, `estimate.effort_points`, the three supported value groups, the three supported modifiers, and the three delivery-risk inputs. Narrative content stays in the Markdown body, and status/stage remains list-derived.

Do not infer V2 semantics from arbitrary unnamespaced frontmatter. Legacy cards remain valid and render normally. Computed scores and dashboard memberships are derived outputs; they are not additional stored card attributes.

# Deferred questions

Which score anchors should be calibrated after real board usage? Which dashboard section order is most useful across profiles?

# Acceptance criteria

- [x] Field matrix marks hardcoded, generic, derived, or deferred.
- [x] Chosen fields have a stable namespace and migration rule.
- [x] A legacy card with no V2 fields still renders normally.
- [x] Computed indexes are explicitly derived and are not part of the stored card contract.

# Objective

Choose the smallest stable V2 card metadata contract that supports product-development clarity without breaking arbitrary Markdown cards.

# Scope

Decide field ownership, namespace, legacy behavior, list-derived status, and deferred scoring; leave runtime normalization and migration implementation to the ready cards.

# Verification

Decision reviewed against the current frontmatter/lifecycle architecture and the compatibility requirements in the migration and framework documents.
