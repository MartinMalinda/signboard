# Signboard V2 operating framework

This is the operational companion to [`tasks/V2-project-management.md`](../../../tasks/V2-project-management.md). Read it when an agent is inspecting, shaping, ranking, moving, or reporting on a V2 board. The project-management document is canonical; this reference explains how to apply its trimmed contract safely.

## The model in one page

V2 keeps four axes separate:

1. workflow stage, derived from the card's list;
2. relationships, represented by parent, dependencies, and blockers;
3. value and priority, computed from compact score inputs;
4. delivery risk, computed from implementation-risk inputs.

Use this order when reading a board:

```text
list-derived stage
→ parent/dependency/blocker relationships
→ priority class
→ value and delivery-risk projections
```

The body is the source of truth for narrative project information. Structured metadata should not duplicate the outcome, boundaries, acceptance details, verification notes, progress, decisions, or next step.

## What a V2 card represents

An executable card is one coherent outcome that can be completed and clearly marked done. Put the outcome, rationale, boundaries, checks, evidence, decisions, and follow-ups in the Markdown body. Use `kind` to identify the shape of work and labels for additional classification.

Supported kinds are `task`, `discovery`, `epic`, and `incident`. An epic groups related cards; a discovery produces a decision, measurement, prototype result, or rejected hypothesis; an incident covers urgent response or remediation.

Split a card when work can ship independently, has a different risk or rollback boundary, or is a separate observation/follow-up. Keep atomic work together when a split would create bookkeeping without an independently verifiable outcome.

## Lifecycle and state

The list directory is the source of stage/status. Move cards between lists; do not write a competing lifecycle status into `signboard_v2`.

| Stage | Meaning |
| --- | --- |
| `inbox` | Idea, problem, or observation |
| `shaping` | Body and evidence are being developed |
| `ready` | Enough information exists to begin |
| `active` | Investigation or implementation is underway |
| `review` | Review or completion checks are underway |
| `blocked` | A dependency or external condition prevents progress |
| `done` | The agreed outcome and checks are complete |
| `dropped` | Intentionally abandoned or superseded |

Boards may map custom list names to these roles. The mapping is board configuration, not card metadata.

## Exact V2 card data

New V2 metadata must use exactly this additive namespace:

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
    mitigation_effectiveness: 4
  discovery_value:
    uncertainty_reduction: 4
    decision_importance: 5
    cost_of_wrong_choice: 3
  modifiers:
    confidence: 3
    urgency: 4
    maintenance_delta: 0
  delivery:
    regression_likelihood: 2
    change_blast_radius: 2
    reversibility: 4
```

Do not add work categories, narrative attributes, separate health or enablement groups, policy controls, or agent-selection fields to this namespace. Use labels, the body, board settings, or a separately approved future contract when appropriate.

Input conventions:

- `contract_version` is `1`; `id` is optional.
- `priority_class` is `P0`–`P3`.
- `effort_points` normally uses `1, 2, 3, 5, 8, 13`.
- Score inputs use anchored `1–5` values, with `0` only when genuinely not applicable.
- `maintenance_delta` is `-2` through `+2`.

V2 relationships currently use card-title strings. Preserve spelling and do not convert titles to IDs silently. `parent` is grouping, `depends_on` is real sequencing, and `blocked_by` identifies current card blockers. `blocked_on_decision` is a boolean marker; keep the actual decision context in the body.

## Value and priority scoring

Most human inputs use a 1–5 scale. A high input should be supported by evidence in the body.

### Opportunity

```text
Opportunity Score =
100 × (Reach / 5) × (Benefit / 5) × (0.5 + 0.1 × Frequency)
```

### Risk prevented

```text
Expected Risk =
100 × (Likelihood / 5) × (Harm / 5) × (Blast Radius / 5)

Risk Reduction Score =
Expected Risk × (Mitigation Effectiveness / 5)
```

There is no catastrophic-tail input or hidden tail floor. Put the supporting scenario and time horizon in the body.

### Discovery value

```text
Discovery Score = 20 × (
    0.40 × Uncertainty Reduction
  + 0.35 × Decision Importance
  + 0.25 × Cost of Wrong Choice
)
```

### Core value and indexes

```text
Core Value = max(Opportunity Score, Risk Reduction Score, Discovery Score)

Priority Index =
(Core Value × Confidence × Urgency × Maintenance Modifier)
÷ Effort Points ^ 0.60

Positive Impact = max(Opportunity Score, Discovery Score)

Impact Index =
(Positive Impact × Confidence)
÷ Effort Points ^ 0.20
```

Modifier anchors are:

| Modifier | Anchors |
| --- | --- |
| Confidence | 1=.45, 2=.60, 3=.75, 4=.90, 5=1.00 |
| Urgency | 1=.90, 2=1.00, 3=1.10, 4=1.25, 5=1.45 |
| Maintenance delta | -2=.85, -1=.93, 0=1.00, +1=1.07, +2=1.15 |

Indexes are derived outputs, not stored V2 attributes.

## Priority classes

- P0: immediate emergency such as active outage, compromise, ongoing data loss/corruption, or exposed secrets.
- P1: severe vulnerability, reliability/integrity failure, time-bound compliance, or severe customer impact.
- P2: normal ranked work.
- P3: parked, superseded, premature, or deliberately deferred.

P0/P1 work is presented ahead of ordinary ranking. A normal score must not demote mandatory work.

## Delivery risk

Delivery risk is distinct from the problem risk being addressed:

```text
Delivery Risk = clamp(
  4 × Regression Likelihood × Change Blast Radius
    × (1.2 - 0.2 × Reversibility),
  0, 100
)
```

Use the body for checks, containment, rollback notes, and review evidence. `reversibility` is the one structured reversibility input.

## Dashboard queues

The initial dashboard may use four profile-controlled sections:

| Section | Selection question |
| --- | --- |
| Critical | Which P0/P1 cards need attention first? |
| Next best work | Which available P2 cards rank highest? |
| Low-hanging fruit | Which useful cards are low effort and low delivery risk? |
| Blocked | Which cards cannot progress because of blockers? |

A card may appear in multiple sections. Keep each section compact and explain why a card appears using derived scores plus the card body. There is no agent-loop section in the trimmed model.

## Safe board operations

1. Confirm the board root and read its root `.board.json`.
2. Check `settings.v2` before applying V2 semantics.
3. Read the list manifest and target card before editing.
4. Preserve unrelated frontmatter and body content.
5. Use the MCP or CLI operation that matches the requested change when available.
6. If direct editing is required, write atomically and validate the result.
7. Move cards to change stage; do not edit a status field.

Legacy cards without V2 metadata remain valid. Do not infer V2 semantics from arbitrary unnamespaced frontmatter.

## Agent-facing guidance

Agents may use V2 metadata to inspect relationships, understand ranking, and report project state. V2 does not compute autonomy, authorize execution, maintain an agent queue, or select work for unattended loops. An agent must follow the user's task, repository policy, and ordinary review practices; no V2 card field grants permission to act.

When an agent creates or updates a card, keep narrative information in the body and keep `signboard_v2` inside the exact contract. Preserve the board's established relationship-reference convention and avoid adding speculative metadata.
