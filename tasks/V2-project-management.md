# Signboard V2 project-management framework

**Version:** 2.0 (trimmed card contract)

This document is the canonical specification for the V2 project-management model. It defines the small amount of structured metadata that supports classification, relationships, ranking, and delivery-risk review. Narrative project information remains in the Markdown body.

## 1. Operating principles

V2 keeps four concerns separate:

1. **Workflow state** — the card's list is the source of truth for its stage/status.
2. **Relationships** — parent, sequencing dependencies, and active blockers.
3. **Value and priority** — compact score inputs used to compare work.
4. **Delivery risk** — risk introduced by implementing the work.

The structured contract should answer only questions that benefit from consistent machine-readable comparison. The card body remains the source of truth for the outcome, context, boundaries, acceptance details, verification notes, decisions, progress, and follow-ups. Do not duplicate that narrative in `signboard_v2`.

V2 is a reviewable ranking aid, not a claim that subjective project judgments are mathematically precise. High scores require evidence and should be recalibrated when the facts change.

## 2. Card kinds and decomposition

The supported kinds are:

```yaml
kind: task       # task | discovery | epic | incident
```

- `task` is an executable piece of work.
- `discovery` reduces uncertainty or produces a decision, measurement, prototype result, or rejected hypothesis.
- `epic` groups related work and is not itself an implementation queue item.
- `incident` represents urgent response or remediation work.

Split a card when parts can ship independently, have different risk or review needs, have different rollback boundaries, or one part is implementation while another is a separate observation or follow-up. Do not split work that has no independently verifiable outcome or must change atomically.

Use labels for additional classification when useful. V2 does not store a separate work-category field.

## 3. Exact stored card contract

V2 metadata is additive and namespaced under `signboard_v2`. The namespace contains only the following fields:

```yaml
signboard_v2:
  contract_version: 1
  id: optional-stable-id
  kind: task
  priority_class: P2

  parent: null
  depends_on: []
  blocked_by: []
  blocked_on_decision: false

  estimate:
    effort_points: 3

  opportunity:
    reach: 3
    benefit: 4
    frequency: 2

  risk_prevented:
    likelihood: 2
    harm: 4
    blast_radius: 3

  modifiers:
    confidence: 3
    urgency: 4
    maintenance_delta: 0

  delivery:
    regression_likelihood: 2
    change_blast_radius: 2
    reversibility: 4
```

`id` is optional. Relationship values use the board's established card-reference convention; on current boards they are card-title strings. Preserve spelling and do not silently convert them to IDs.

All other narrative, policy, execution, health, enablement, and agent-selection concepts are outside the V2 card contract. They belong in the body, labels, board configuration, or future separately approved work—not in new `signboard_v2` keys.

### 3.1 Input ranges

- `contract_version` is `1`.
- `priority_class` is `P0`, `P1`, `P2`, or `P3`.
- `effort_points` uses the normal planning scale `1, 2, 3, 5, 8, 13`; 13 usually signals an epic or a card that needs decomposition.
- Score inputs use anchored `1–5` values. `0` is allowed only when a dimension genuinely does not apply.
- `maintenance_delta` uses `-2` through `+2`.
- `reversibility` is higher when the change is easier to undo or contain.

## 4. Workflow state

Status/stage is derived from the card's list directory. Do not write a competing lifecycle status into `signboard_v2`.

Recommended list meanings are:

| Stage | Meaning |
| --- | --- |
| `inbox` | Idea, problem, or observation not yet shaped |
| `shaping` | Body and evidence are being developed |
| `ready` | The body contains enough information to begin |
| `active` | Investigation or implementation is underway |
| `review` | Review, checks, or acceptance work is underway |
| `blocked` | An explicit dependency or external condition prevents progress |
| `done` | The agreed outcome and checks are complete |
| `dropped` | Intentionally abandoned, superseded, or no longer relevant |

Boards may use custom list names through their V2 stage mapping. The mapping changes presentation only; it does not add a stored status field.

## 5. Body-as-source-of-truth

The Markdown body should carry the human-readable record of the work. A practical body can include:

- the intended outcome and why it matters;
- boundaries, non-goals, assumptions, and relevant context;
- acceptance details and how completion will be checked;
- implementation notes, decisions, evidence, progress, and follow-ups;
- the current next step and any blocker explanation.

These are writing conventions, not additional frontmatter attributes. Keep them in the body so one readable document remains authoritative and can evolve without changing the metadata contract.

## 6. Relationships

- `parent` links a card to a broader epic or grouping card.
- `depends_on` identifies cards that must complete first.
- `blocked_by` identifies cards currently preventing progress. `blocked_on_decision` is a boolean marker for work waiting on a decision; the decision, options, owner, and context belong in the card body.

Parent-child structure does not automatically imply sequencing. Use `depends_on` only for real order constraints. A blocked card remains visible and may still have a useful score, but it should appear in the Blocked view until the blocker is resolved.

## 7. Value scoring

The evaluator computes scores from the stored value groups. It must not require narrative fields or execution-policy inputs.

### 7.1 Opportunity

Use for positive user, customer, operator, or business benefit.

```text
Opportunity Score =
100 × (Reach / 5) × (Benefit / 5) × (0.5 + 0.1 × Frequency)
```

Reach is relative to the relevant target population, Benefit is magnitude, and Frequency is recurrence.

### 7.2 Risk prevented

Use for security, privacy, correctness, data integrity, reliability, compliance, operational risk, and destructive technical debt.

```text
Expected Risk =
100 × (Likelihood / 5) × (Harm / 5) × (Blast Radius / 5)

Risk Reduction Score =
Expected Risk
```

Do not add a catastrophic-tail field or a hidden tail floor. If a severe scenario matters, describe the evidence and time horizon in the body and score the three supported dimensions.

### 7.3 Core value and modifiers

```text
Dominant Value = max(Opportunity Score, Risk Reduction Score)
Secondary Value = sum(the other value scores)
Core Value = min(100, Dominant Value + min(20, 0.15 × Secondary Value))
```

When more than one value group is present, the evaluator keeps a small capped contribution from the non-dominant groups so a card with meaningful secondary value is not treated as identical to a card with only one value source. The dominant group still controls the result. The positive Impact view uses Opportunity only; Risk reduction is excluded from positive impact.

Apply the supported modifiers:

| Modifier | Anchors |
| --- | --- |
| Confidence | 1=.45, 2=.60, 3=.75, 4=.90, 5=1.00 |
| Urgency | 1=.90, 2=1.00, 3=1.10, 4=1.25, 5=1.45 |
| Maintenance delta | -2=.85, -1=.93, 0=1.00, +1=1.07, +2=1.15 |

The body should explain unusually high or low inputs. Do not count the same evidence twice across value groups.

## 8. Priority and impact indexes

Priority class is stronger than ordinary scoring. Within normal work, use:

```text
Priority Index =
(Core Value × Confidence × Urgency × Maintenance Modifier)
÷ Effort Points ^ 0.60
```

The positive-value view excludes risk-prevention value:

```text
Positive Impact = Opportunity Score

Impact Index =
(Positive Impact × Confidence)
÷ Effort Points ^ 0.20
```

These indexes are computed projections, not stored `signboard_v2` fields. They are ordering aids and should be accompanied by a concise explanation derived from the card body and inputs.

## 9. Priority classes

- **P0** — active outage, compromise, ongoing data loss/corruption, exposed secrets, system-wide critical failure, or similarly immediate emergency.
- **P1** — reachable critical vulnerability, severe reliability or integrity failure, time-bound compliance, or severe customer impact.
- **P2** — normal ranked work.
- **P3** — parked, superseded, premature, or deliberately deferred work.

P0 and P1 cards are shown ahead of ordinary ranking. A high ordinary score must not demote mandatory urgent work.

## 10. Delivery risk

Delivery risk describes the risk introduced by implementing the card, not the problem risk being addressed.

```text
Delivery Risk = clamp(
  4 × Regression Likelihood × Change Blast Radius
    × (1.2 - 0.2 × Reversibility),
  0, 100
)
```

Use the body for the verification and rollback/containment plan. `reversibility` is the single structured reversibility concept.

Suggested review levels are a presentation convention, not stored card fields:

- Q0: documentation, planning, or non-runtime work.
- Q1: routine low-risk change with targeted review/checks.
- Q2: moderate-risk change with regression coverage and human review.
- Q3: high-risk change with integration/E2E coverage, controlled rollout, and explicit containment.
- Q4: critical or sensitive change requiring specialist review and monitored deployment.

## 11. Dashboard sections

V2 may project cards into several lenses. A card can appear in more than one section.

1. **Priority** — non-terminal executable cards that pass the metadata/readiness gates, ordered by priority class and Priority Index.
2. **Impact** — unfinished work ordered by positive opportunity value; risk-prevention value remains in Priority and Risk reduction rather than this view.
3. **Low-hanging fruit** — useful, low-effort cards with acceptable delivery risk and adequate confidence.
4. **Blocked** — non-terminal executable cards whose mapped stage is blocked.

There is no agent/autonomy score or agent-loop dashboard section in the trimmed model. Cards remain ordinary project-management work; an agent can still use the board and body context, but V2 does not rank or authorize agent execution.

## 12. Board configuration and compatibility

Board-level V2 configuration remains in `settings.v2` in the root `.board.json`. It may enable V2, map lists to stages, configure dashboard section order, and provide defaults. That board configuration is separate from the card namespace and must not add removed card attributes.

Legacy cards with no `signboard_v2` namespace remain valid. V2-enabled boards should not infer V2 semantics from arbitrary unnamespaced frontmatter. When editing a V2 card, preserve unrelated legacy frontmatter and body content while keeping newly written `signboard_v2` data inside the exact contract above.

## 13. Evidence and calibration

Useful evidence includes analytics, customer reports, reproduced failures, benchmarks, logs, security analysis, dependency graphs, support volume, and implementation data. Keep the evidence and narrative in the body. Re-score when facts, effort, dependencies, deadlines, or delivery risk change—not merely to force a preferred order.

The evaluator should return computed scores and explanations from one shared implementation so desktop, CLI, and MCP consumers do not duplicate formulas. Those outputs are derived projections and are not additional stored V2 card attributes.
