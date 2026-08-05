# Signboard V2 operating framework

This is the operational companion to [`tasks/V2-project-management.md`](../../../tasks/V2-project-management.md), version 1.0. Read it when an agent must shape, rank, select, execute, review, or report on V2 work. The source document remains the canonical specification; this reference translates it into the decisions an agent must make while using a Signboard board.

## The model in one page

V2 keeps three axes separate:

1. **Priority class** — whether work is mandatory, normal, or deliberately deferred.
2. **Value and efficiency** — the expected value of the outcome relative to effort.
3. **Execution mode** — whether an agent can safely perform the work with limited human involvement.

Use this order:

```text
priority gate
→ readiness and dependency eligibility
→ execution-policy eligibility
→ mode-specific score
```

A high score must never demote a P0 incident, a P1 security/data-integrity risk, or work blocked by an execution-policy gate. A card can be high priority but human-led, low-value but an excellent maintenance task, or valuable but not ready because discovery is still needed.

V2 is a management framework, not a claim of mathematical truth. Scores are reviewable ranking instruments. High inputs need evidence; scores must not be inflated or duplicated to force an ordering.

## What an executable card represents

An executable card is one coherent outcome that can be completed, independently verified, and clearly marked done. It should have:

- one primary objective and reason for existing;
- a bounded implementation surface;
- observable acceptance criteria;
- a verification method;
- known dependencies and execution restrictions;
- no hidden optional tail.

Epics and plans preserve strategy, architecture, sequencing, and child links. They are not directly executable and should not compete with their child cards in implementation queues. A useful decomposition is:

```text
epic/plan
├── data model or service
├── user-facing behavior
├── migration or rollout
└── verification
```

Split a card when parts can ship independently, have different acceptance criteria or risk, require different autonomy levels, have different rollback boundaries, or one part is implementation while another is production observation. Do not split when the pieces have no independently verifiable outcome or must change atomically.

The supported card kinds are `epic`, `task`, `discovery`, and `incident`. `work_type` describes the main purpose: `product`, `ux`, `security`, `correctness`, `data_integrity`, `reliability`, `performance`, `compliance`, `privacy`, `engineering_health`, `technical_debt`, `observability`, `operations`, `enablement`, `discovery`, or `documentation`.

## Lifecycle and state

The recommended lifecycle is:

| Stage | Meaning | Execution implication |
| --- | --- | --- |
| `inbox` | Idea, problem, or observation | Not ready to rank or execute |
| `shaping` | Problem, outcome, scope, and evidence are being defined | Scores may be provisional; no autonomous claim |
| `ready` | Definition of Ready is satisfied | Eligible for ranking if unblocked and policy-allowed |
| `active` | Investigation or implementation is underway | Must show a visible status summary and next action |
| `review` | Code, product, QA, or acceptance review is underway | Not done until required review/verification passes |
| `blocked` | An explicit dependency or external condition prevents progress | Keep visible with blocker, delayed value, and next action |
| `done` | Acceptance, verification, delivery, migration, docs, and reviews are complete | Record evidence and follow-ups |
| `dropped` | Intentionally abandoned, superseded, or no longer relevant | Record why |

Avoid ambiguous labels such as “mostly done”, “pending”, or “later”. Use `status_summary` and `next_action` to expose the exact unfinished tail. In this Signboard implementation, the list directory is the source of stage/status. Move cards between lists; do not write a competing lifecycle status into `signboard_v2`.

### Definition of Ready

A card is ready when the problem and objective are understandable, scope and non-goals are stated, acceptance criteria are testable, dependencies are identified, product decisions are resolved, effort and relevant score inputs exist, verification is planned, rollback/containment is understood, behavior surface is known, and the execution mode is clear. Discovery cards can be ready without implementation details when their outcome is a decision, measurement, prototype result, or rejected hypothesis.

### Definition of Done

A card is done only when acceptance criteria, required checks, delivery, migrations, documentation, human reviews, and agreed verification are complete. Extract newly discovered nonessential work into follow-up cards. A long observation period should normally be its own verification card depending on the implementation/deployment card.

## V2 card data and ownership

The canonical additive namespace is:

```yaml
signboard_v2:
  contract_version: 1
  kind: task
  work_type: product
  priority_class: P2
  objective: "A concrete outcome"
  scope: "What is and is not changing"
  acceptance_criteria: []
  verification: "How completion is checked"
  parent: null
  depends_on: []
  blocked_by: []
  status_summary: ""
  next_action: ""
  estimate:
    effort_points: 3
```

The runtime also supports optional value groups (`opportunity`, `risk_prevented`, `engineering_health`, `enablement`, `discovery_value`), general modifiers (`confidence`, `strategic_fit`, `urgency`, `maintenance_delta`), delivery-risk inputs (`regression_likelihood`, `change_blast_radius`, `reversibility`), and execution inputs (`specification_clarity`, `verification_strength`, `boundedness`, `isolation`, `behavior_surface`, `data_sensitivity`, `coordination_complexity`, and policy blocks). Preserve unknown fields and existing companion top-level fields when they are present on migrated cards.

The core enum anchors are:

- `kind`: `task`, `discovery`, `epic`, `incident`.
- `priority_class`: `P0`, `P1`, `P2`, `P3`.
- `effort_points`: normally `1, 2, 3, 5, 8, 13`; 13 usually indicates an epic or insufficient decomposition.

Related-task arrays currently contain card-title strings. Dependencies must be genuine sequencing constraints, not loose relationships. Preserve title spelling and do not convert titles to IDs unless the board already uses a different established convention.

Board-level V2 configuration is stored under `settings.v2` in the root `.board.json`. It contains the enabled flag, profile identity/version, stage mappings, dashboard sections, `cardDefaults`, and validation policy. New boards use the default product profile; older boards may be V2-disabled or have no V2 profile. Read the profile before interpreting Dashboard results or applying defaults.

## Value dimensions and scoring

Most human inputs use anchored `1–5` scales. Use `0` only when genuinely not applicable. A score of 4 or 5 needs a written rationale or evidence. Do not describe one benefit repeatedly as high opportunity, high strategic fit, high enablement, and high engineering health unless each is distinct.

### Opportunity value

Use for positive user, customer, operator, or business benefit. Inputs are Reach, Benefit, and Frequency:

```text
Opportunity Score =
100 × (Reach / 5) × (Benefit / 5) × (0.5 + 0.1 × Frequency)
```

Reach is relative to the relevant target population; Benefit is magnitude; Frequency is recurrence. A rare onboarding event can still matter, while a strategically important single customer should not automatically receive Reach 5.

### Risk-reduction value

Use for security, privacy, correctness, data integrity, reliability, compliance, operational risk, and destructive technical debt. Inputs are Likelihood, Harm, Blast Radius, Mitigation Effectiveness, and a credible catastrophic-tail flag:

```text
Expected Risk = 100 × (Likelihood / 5) × (Harm / 5) × (Blast Radius / 5)
Risk Exposure = max(Expected Risk, Tail Floor)
Risk Reduction Score = Risk Exposure × (Mitigation Effectiveness / 5)
```

Tail floors are 70 when Harm=5 and Blast Radius=5, 55 when one is 5 and the other is at least 4, 40 when both are at least 4, otherwise 0—but only for a concrete, technically credible path. State the time horizon for likelihood, normally the next 12 months for latent risks.

### Engineering-health value

Use for maintainability, complexity, reliability, testability, observability, and recurring time saved:

```text
Engineering Health = 20 × (
    0.35 × Maintenance Reduction
  + 0.25 × Complexity Reduction
  + 0.25 × Reliability/Testability
  + 0.15 × Recurring Time Saved
)
```

### Enablement value

Use for foundations that unlock concrete downstream work:

```text
Enablement = 20 × (
    0.50 × Downstream Value
  + 0.20 × Downstream Breadth
  + 0.30 × Critical Path
)
```

Link the downstream cards where possible. An enablement score without identifiable dependents needs a written rationale.

### Discovery value

When potential value is high, confidence is low, effort is material, and uncertainty can be reduced cheaply, create a discovery card rather than implementing the feature. Its acceptance criterion is a decision, measurement, prototype result, or rejected hypothesis:

```text
Discovery = 20 × (
    0.40 × Uncertainty Reduction
  + 0.35 × Decision Importance
  + 0.25 × Cost of Wrong Choice
)
```

### Core value, modifiers, and Priority Index

Avoid double counting with a dominant-value model:

```text
Dominant Value = max(opportunity, risk, engineering, enablement, discovery)
Supporting Value = min(20, 0.15 × (sum(scores) - Dominant Value))
Core Value = min(100, Dominant Value + Supporting Value)
```

Apply these multipliers:

| Modifier | Anchors |
| --- | --- |
| Confidence | 1=.45, 2=.60, 3=.75, 4=.90, 5=1.00 |
| Strategic fit | 1=.80, 2=.90, 3=1.00, 4=1.10, 5=1.20 |
| Urgency | 1=.90, 2=1.00, 3=1.10, 4=1.25, 5=1.45 |
| Maintenance delta | -2=.85, -1=.93, 0=1.00, +1=1.07, +2=1.15 |

For normal ranked P2 work:

```text
Priority Index =
(Core Value × Confidence × Strategic Fit × Urgency × Maintenance)
÷ Effort Points ^ 0.60
```

Priority Index is an ordering index, not a percentage. Risk reduction, urgency, and confidence contribute to Priority, so security and safety work can rise in the same queue without requiring a separate Critical queue.

The positive-value queue intentionally excludes risk-prevention value:

```text
Positive Impact = Core Value of Opportunity, Engineering Health, Enablement, and Discovery

Impact Index =
(Positive Impact × Confidence × Strategic Fit)
÷ Effort Points ^ 0.20
```

Impact is a value-sorting view, not a quick-win filter: all unfinished work remains visible, while effort matters less than substantially higher positive impact.

## Priority classes and policy gates

Priority class is lexicographically stronger than every score:

- **P0**: active outage, compromise, ongoing data loss/corruption, exposed secrets, system-wide critical failure, imminent legal breach, or critical customer-wide blocker.
- **P1**: reachable critical vulnerability, credible catastrophic path, severe reliability failure, material integrity flaw, time-bound compliance, or severe customer impact.
- **P2**: normal ranked work.
- **P3**: parked, superseded, premature, or deliberately deferred work—not merely a low score.

Problem risk and delivery risk are independent. A security fix may be urgent because it reduces severe problem risk while still requiring cautious human execution because delivery risk is high.

### Delivery risk and QA

Delivery Risk is based on Regression Likelihood, Change Blast Radius, and Reversibility:

```text
Delivery Risk = clamp(
  4 × Regression Likelihood × Change Blast Radius
    × (1.2 - 0.2 × Reversibility),
  0, 100
)
```

Bad-implementation blast radius is not the same as the problem being fixed. QA levels are:

- **Q0**: docs, planning, or non-runtime fixtures; formatting/review.
- **Q1**: routine change, roughly risk 0–20; targeted tests and ordinary review.
- **Q2**: risk 21–40; unit/integration regression tests, human review, rollback note, local/staging verification.
- **Q3**: risk 41–65; integration/E2E, controlled rollout, explicit rollback, human approval, monitoring.
- **Q4**: risk 66–100 or sensitive-surface escalation; specialist review, migration/threat analysis, containment, controlled deployment, and post-deployment observation.

Behavior Surface ranges from 1 (internal) to 5 (core semantics, pricing, permissions, authentication, or contractual behavior). Data Sensitivity ranges from 1 (fixtures) to 5 (auth, secrets, financial, regulated, or cross-customer data).

## Autonomy and agent execution

Autonomy asks whether an agent can safely execute the card, not whether the card matters. Score Specification Clarity, Verification Strength, Reversibility, Boundedness, and Isolation from 1–5:

```text
Autonomy Base = 100 × geometric_mean(
  clarity/5, verification/5, reversibility/5, boundedness/5, isolation/5
)

Autonomy Penalty =
  6 × (Regression Likelihood - 1)
  + 6 × (Behavior Surface - 1)
  + 8 × (Data Sensitivity - 1)
  + 4 × (Coordination Complexity - 1)

Autonomy Score = clamp(Base - Penalty, 0, 100)
```

Classes:

- **A0**: no agent modification; analysis may be allowed.
- **A1**: analysis/shaping only; typical score below 55.
- **A2**: human-led or paired execution; typical score 55–74 and human review mandatory.
- **A3**: autonomous implementation and pull request; typical score 75–89, human review before merge.
- **A4**: policy-authorized autonomous merge; opt-in only, normally effort 1–3, behavior surface ≤2, data sensitivity ≤2, delivery risk ≤20, deterministic CI, easy rollback, and no sensitive surface.

Regardless of score, normally cap at A2 when work involves P0/P1, authentication/authorization, cross-customer boundaries, secrets/cryptography, billing, destructive migrations/deletion, public contracts, major UX/product semantics, privacy/compliance decisions, production security/networking, external communication, financial expenditure, inadequate rollback, or subjective correctness.

Execution policy uses `execution.ceiling` plus `execution.background_selection`; legacy execution booleans are not supported V2 fields. Supported ceilings are `human_only`, `analysis_planning`, `supervised_implementation`, `autonomous_pull_request`, and `autonomous_merge` (policy-permitted). Missing or invalid ceiling values default to `human_only`; missing or invalid background selection defaults to `false`. Background selection controls automatic candidate selection and never raises the ceiling.

P0/P1 work and restricted or high-risk work normally cap at A2, regardless of score. A ceiling below `autonomous_pull_request` caps the computed autonomy class; A4 additionally requires explicit repository policy and the safeguards listed above. Signboard has no real agent runner, unattended execution loop, pull-request executor, or merge executor, so these fields describe planning/eligibility only. Agents may tighten restrictions but must not raise the ceiling, enable background selection, or self-authorize A4.

## Dashboard queues and how to interpret them

The Dashboard is a set of decision-specific views over the same card snapshot, not one universal ranking:

| View | Eligibility and ordering | Question |
| --- | --- | --- |
| Priority | Eligible, ready/active/review; Priority Index desc | What should be considered next, including risk and security value? |
| Impact | Unfinished cards; Impact Index desc, cards without a score last | Which unfinished work creates the most positive value, with effort weighted lightly? |
| Low-hanging fruit | P2, ready, effort ≤3, confidence/clarity/verification ≥4, delivery risk ≤25, maintenance delta ≥0 | What useful work is fast and safe? |
| Agent loops | Ready P2, unblocked, A3/A4, no auto-run block; Agent Pick Index desc | What can an autonomous agent safely do? |
| Blocked | Explicit dependency/condition, shown with reason and next action | What valuable work is waiting and why? |

Additional framework views include autonomous maintenance, human-led high leverage, engineering-health investments, unlockers, validate-before-building, debt-creating high-impact work, and stale assumptions. A card being absent from a queue does not mean it is invalid: it may be unshaped, incomplete, blocked, policy-ineligible, or missing required evidence.

Agent Pick Index is not Priority Index alone:

```text
Agent Pick Index =
Priority Index × (Autonomy Score / 100)^2
× (1 + 0.30 × Engineering Health Score / 100)
```

This strongly favors safe autonomous work and modestly favors maintenance. Human-leverage work filters for meaningful Core Value first, then prefers cards with low autonomy or high behavior/data/delivery risk; unsuitable-for-agents is not itself a reason to prioritize low-value work.

## Dependencies, lanes, and capacity

Dependencies must be machine-readable and real. A blocked card remains scored but is not execution-eligible. Avoid circular dependencies. Parent-child relationships do not automatically mean a hard execution dependency. If a prerequisite unlocks several high-value cards, record that as enablement and link the downstream cards.

Use portfolio lanes in addition to score sorting so one category cannot starve the others:

- **Mandatory**: P0/P1 and other required work.
- **Human leverage**: high-impact product, UX, architecture, sensitive security, and risky migrations.
- **Autonomous maintenance**: tests, observability, reliability, technical debt, cleanup, and safe performance work.
- **Discovery**: experiments, benchmarks, prototypes, requirement validation, and architecture spikes.

The framework suggests an initial autonomous capacity split of 60% engineering health/maintenance, 25% tests/reliability/observability, and 15% safe bounded product work. Treat this as a starting policy, not a universal rule.

Negative maintenance delta is allowed but must state the new long-lived surface, justification, possible regressions, owner, simpler alternatives, follow-up/hardening card, and review/sunset date when applicable. Agents must not introduce architectural debt outside the card’s scope.

## Agent selection loop

An eventual autonomous loop should:

1. Load `ready`, unblocked, in-window P2 candidates whose ceiling is `autonomous_pull_request` or `autonomous_merge` and whose `background_selection` is true.
2. Apply hard policy gates and the P0/P1/A2 caps before numerical sorting.
3. Select the configured mode: general, maintenance, tests, observability, or safe product.
4. Revalidate the repository, referenced files, problem, dependencies, scope, evidence, and competing claims.
5. Atomically claim/lock the card with owner and expiration where supported.
6. Implement only the defined outcome; run required checks; preserve rollback.
7. Stop and downgrade/escalate to A2 if product decisions, destructive work, security issues, larger blast radius, missing verification, external dependencies, major scope growth, or contradictory acceptance criteria appear.
8. For A3, submit for review. For A4, merge only when explicit repository policy permits it and a real merge executor exists. Record tests, resulting behavior, follow-ups, and downstream score/dependency changes.

Agent-created cards enter `inbox` or `shaping`. Agents may propose evidence and scores but cannot self-authorize their own implementation, P0/P1 classification, A4, a higher execution ceiling, or background selection.

## Evidence, governance, and calibration

Require evidence for most 4/5 inputs. Useful evidence includes analytics, customer reports, reproduced failures, benchmarks, logs, security analysis, dependency graphs, support volume, and implementation data. Re-score when facts, scope, dependencies, deadlines, architecture, or risk change—not merely to force a preferred order.

Record `score_version: 1`. If formulas or anchors change, increment the version and recalculate active cards before comparing scores. Manual overrides are valid only with a reason, preserved computed value, and expiration where temporary; they do not loosen autonomy or QA gates.

Adopt progressively:

1. **Card clarity**: kinds, work types, statuses, summaries, next action, parent/dependencies, objective, scope, acceptance, verification, effort, splitting.
2. **Core prioritization**: value dimensions, modifiers, Priority Index, critical gates, and Dashboard views.
3. **Autonomous execution**: delivery risk, QA, behavior/data sensitivity, autonomy, execution gates, Agent Pick Index, claim locking, maintenance view.
4. **Calibration**: compare estimates to actuals, review delivered value and agent eligibility, add project-specific anchors, and version formula changes.

The governing principles are: lane first and score second; criticality is a gate; value and autonomy are independent; problem risk and delivery risk are independent; small bounded cards improve visibility and autonomy; and every score or restriction should remain explainable from the card and Git history.
