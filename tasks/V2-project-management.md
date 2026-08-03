# Markdown Card Prioritization and Autonomous Execution Framework

**Version:** 1.0  
**Purpose:** Manage executable project work as structured Markdown cards, rank work consistently, expose why work remains unfinished, and allow AI agents to select suitable tasks without taking inappropriate product or operational risks.

---

# 1. Core model

The framework has three independent axes:

1. **Priority class**
   - Must this work happen immediately, normally, or not yet?
   - Critical work bypasses ordinary scoring.

2. **Value and efficiency**
   - How valuable is the outcome relative to its cost?
   - This produces a general Priority Index and several specialized scores.

3. **Execution mode**
   - Can an autonomous agent safely perform the work?
   - Does it require review, close collaboration, or human product judgment?

These axes must remain separate.

A task can therefore be:

- Extremely high priority but unsuitable for autonomous execution.
- Low absolute impact but an excellent autonomous maintenance task.
- High-value and strategically important but expensive, risky, and human-led.
- A safe quick win with broad but modest value.
- Technically beneficial but intentionally deferred.

The selection order is:

```text
Priority gate
→ readiness and dependency eligibility
→ execution-policy eligibility
→ mode-specific score
```

A numerical score must never allow ordinary feature work to outrank an active security incident, data corruption, or other mandatory work.

---

# 2. Goals

The framework should:

1. Make the state of every card understandable without reading the entire file.
2. Prevent cards from remaining “90% complete” because of a small hidden tail.
3. Compare product work, security work, technical debt, reliability work, discovery, and foundational engineering.
4. Distinguish positive value creation from negative risk prevention.
5. Distinguish the risk being fixed from the risk introduced by the fix.
6. Identify:
   - Critical work.
   - Best overall investments.
   - Low-hanging fruit.
   - Safe autonomous-agent work.
   - Engineering-health work.
   - High-leverage work requiring human involvement.
   - High-potential work requiring validation.
   - Foundational work that unlocks other cards.
7. Give autonomous agents deterministic eligibility rules rather than relying only on subjective judgment.
8. Preserve strategic judgment instead of replacing it with false mathematical precision.
9. Keep all score changes visible and reviewable through Git.
10. Support future automated board generation from Markdown files.

---

# 3. Non-goals

The framework is not intended to:

- Produce objectively precise financial valuations from subjective estimates.
- Replace product strategy.
- Allow agents to perform unrestricted production work.
- Turn every minor judgment into another field.
- Reward score inflation.
- Force unrelated work types into a single simplistic formula.
- Use card age as evidence that a card has become valuable.
- Treat implementation completion and production validation as the same outcome when they are independently manageable.

Scores are ranking instruments, not measurements of absolute truth.

---

# 4. What is a card?

An executable card represents:

> One coherent outcome that can be completed, independently verified, and clearly marked done.

A card is not merely:

- A collection of implementation notes.
- A broad plan.
- A project area.
- A theme.
- A list of loosely related improvements.
- An indefinitely open checklist.
- A container for every follow-up discovered during implementation.

## 4.1 Executable card requirements

An executable card should normally have:

- One primary objective.
- One main reason for existing.
- One observable completion condition.
- A bounded implementation surface.
- Explicit acceptance criteria.
- A verification method.
- A known execution policy.
- No hidden optional tail.

## 4.2 Plans and epics

Broad plans should remain available, but they are not directly executable.

Use:

```text
Epic / plan
└── Executable card
    ├── Executable card
    └── Executable card
```

An epic:

- Preserves strategic and architectural context.
- Links related work.
- Can contain sequencing information.
- Is completed when its required children are complete.
- Is not directly selected by an autonomous implementation agent.
- Should not compete with its child cards in ranked execution views.

## 4.3 Card kinds

```yaml
kind:
  - epic
  - task
  - discovery
  - incident
```

These describe the shape of the work.

The separate `work_type` field describes its purpose.

---

# 5. Card splitting rules

A card should be split when any of the following is true:

1. Two parts can be completed or deployed independently.
2. Two parts have different acceptance criteria.
3. Two parts have different risk profiles.
4. Two parts have different autonomy suitability.
5. One part requires product or UX judgment while another is purely internal.
6. One part is waiting for an external event or observation period.
7. One part is required and another is optional.
8. One part fixes the immediate problem while another provides a permanent solution.
9. One part is implementation and another is production verification.
10. One part can be safely reverted independently.
11. One part would naturally be a separate pull request.
12. The only reason the card is not done is buried deep in a large checklist.
13. The card is estimated above 8 effort points without a strong reason to keep it atomic.
14. An agent could safely execute one portion but not the entire card.

## 5.1 Do not split merely because

Do not split a card when:

- The resulting pieces have no independently verifiable outcome.
- The split creates bookkeeping without improving visibility.
- Every piece must be changed atomically to preserve correctness.
- The child cards would merely restate implementation steps.

## 5.2 Common decomposition patterns

### Feature decomposition

```text
Feature epic
├── Internal data model or service
├── Public behavior or API
├── User interface
├── Migration or rollout
└── Production verification
```

The internal card may be highly autonomous. The UI and behavior cards may require human collaboration.

### Security or incident decomposition

```text
Security incident
├── Immediate containment
├── Exposure assessment
├── Permanent remediation
├── Regression tests
└── Post-deployment verification
```

A large permanent fix must not delay a small containment action.

### “Implemented but waiting” decomposition

Instead of:

```text
Card: Implement feature
Status: In progress
Reason: Code is finished, waiting seven days to observe production
```

Use:

```text
Card A: Implement and deploy feature
Status: Done

Card B: Verify feature over seven-day production window
Status: Ready or active
Depends on: Card A
```

This prevents implemented work from remaining artificially unfinished.

---

# 6. Work types

```yaml
work_type:
  - product
  - ux
  - security
  - correctness
  - data_integrity
  - reliability
  - performance
  - compliance
  - privacy
  - engineering_health
  - technical_debt
  - observability
  - operations
  - enablement
  - discovery
  - documentation
```

A card can have one primary work type and additional labels.

The primary work type indicates the card’s main justification. It does not dictate its score directly; the strongest value dimension normally becomes dominant automatically.

---

# 7. Status model

Recommended executable-card statuses:

```yaml
status:
  - inbox
  - shaping
  - ready
  - active
  - review
  - blocked
  - done
  - dropped
```

## 7.1 Status meanings

### `inbox`

The card records an idea, problem, or observation.

It is not ready for ranking or execution.

### `shaping`

The problem and possible outcome are being defined.

Scores can be provisional, but the card cannot be autonomously selected.

### `ready`

The card satisfies the Definition of Ready.

It can enter ranked execution views.

### `active`

Implementation or investigation is currently taking place.

### `review`

The proposed outcome exists and is undergoing code review, product review, QA, or acceptance verification.

### `blocked`

The card cannot proceed because of an explicit dependency or external condition.

`blocked` must include a visible reason and next action.

### `done`

The card’s acceptance criteria have been met and the agreed verification has passed.

For runtime work, this normally means deployed or otherwise delivered—not merely coded locally.

### `dropped`

The card is intentionally abandoned, superseded, or no longer relevant.

The reason should remain recorded.

## 7.2 Avoid ambiguous statuses

Avoid ambiguous states such as:

- Mostly done.
- Staging.
- Pending.
- Almost complete.
- Later.
- Ongoing.

Where they are unavoidable, add an exact `status_summary` and `next_action`.

## 7.3 Visible state fields

Every active, blocked, or review-stage card should expose:

```yaml
status_summary: "Implementation complete; integration test still fails on empty sessions."
next_action: "Correct empty-session handling and rerun the anchor-map test suite."
```

The reader should not need to inspect checklist item 28 to understand why the card is unfinished.

## 7.4 Source of truth

Do not manually maintain status in both:

- The card’s folder path.
- The card’s frontmatter.

Choose one source of truth, or enforce synchronization automatically.

Possible approach:

```text
/cards/inbox
/cards/shaping
/cards/ready
/cards/active
/cards/blocked
/cards/done
```

In that model, the folder is authoritative and tooling computes the status.

Alternatively, keep all cards together and use frontmatter as the authority.

---

# 8. Definition of Ready

A task is `ready` only when:

- The problem is understandable.
- The objective is concrete.
- Scope and meaningful non-goals are stated.
- Acceptance criteria are testable.
- Dependencies are identified.
- There are no unresolved product decisions required before starting.
- Effort has been estimated.
- Relevant scoring inputs are present.
- Verification is planned.
- Runtime changes have a rollback or containment strategy.
- The expected behavior surface is understood.
- The execution mode has been computed or assigned.
- An autonomous agent can understand what it may and may not change.

A discovery card can be ready without knowing the implementation. Its outcome must instead define the decision or uncertainty it should resolve.

---

# 9. Definition of Done

A card is done when:

- All required acceptance criteria are met.
- Required tests and checks pass.
- The result has been delivered to the intended environment.
- Required migrations have completed.
- Required documentation is updated.
- Required human reviews are complete.
- No unresolved work remains inside the card.
- Any newly discovered nonessential work has been extracted into follow-up cards.
- The final state and evidence are recorded.

A lengthy monitoring or observation period should normally be represented by a separate verification card.

---

# 10. Card structure

Recommended card frontmatter:

```yaml
---
framework_version: 1
score_version: 1

id: ORL-000
title: Replace this with a concrete outcome

kind: task
work_type: engineering_health
area: sessionization
labels: []

status: shaping
status_summary: ""
next_action: ""

parent: null
depends_on: []
blocks: []
blocked_by: []

priority_class: P2

created_at: 2026-08-03
deadline: null
not_before: null
review_after: null

outcome:
  problem: ""
  objective: ""
  beneficiary: ""
  behavior_change: none
  non_goals: []

estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 1

opportunity:
  reach: 0
  benefit: 0
  frequency: 0

risk_prevented:
  likelihood: 0
  harm: 0
  blast_radius: 0
  mitigation_effectiveness: 0
  credible_tail: false
  horizon: 12m

engineering_health:
  maintenance_reduction: 0
  complexity_reduction: 0
  reliability_testability: 0
  recurring_time_saved: 0

enablement:
  downstream_value: 0
  downstream_breadth: 0
  critical_path: 0

discovery_value:
  uncertainty_reduction: 0
  decision_importance: 0
  cost_of_wrong_choice: 0

modifiers:
  confidence: 3
  strategic_fit: 3
  urgency: 2
  maintenance_delta: 0

delivery:
  regression_likelihood: 2
  change_blast_radius: 2
  reversibility: 4
  behavior_surface: 1
  data_sensitivity: 1

execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 4
  isolation: 4

  autonomous_execution_blocked: false
  agent_execution_blocked: false
  do_not_autorun: false

  required_reviews: []

verification:
  plan: ""
  tests: []
  rollback: ""
  observation: ""

evidence: []

manual_override:
  priority_index: null
  execution_mode: null
  expires_at: null
  reason: ""

computed:
  opportunity_score: null
  risk_reduction_score: null
  engineering_health_score: null
  enablement_score: null
  discovery_score: null
  core_value: null

  delivery_risk: null
  qa_level: null

  priority_index: null
  priority_percentile: null

  autonomy_score: null
  autonomy_class: null
  agent_pick_index: null

  quick_win_index: null
  human_leverage_index: null
---

# Objective

Describe the outcome, not merely the code change.

# Context

Explain why the card exists and include relevant architectural or product context.

# Scope

## Included

- ...

## Not included

- ...

# Acceptance criteria

- [ ] ...
- [ ] ...

# Verification

- ...

# Implementation notes

Optional. These are guidance, not acceptance criteria.

# Decisions

Record material decisions made while shaping or implementing the card.

# Follow-ups

Link follow-up cards rather than leaving optional work inside this card.
```

The `computed` section should be generated by tooling and not manually edited.

---

# 11. Scoring architecture

The framework computes five independent value dimensions:

1. **Opportunity value**
2. **Risk-reduction value**
3. **Engineering-health value**
4. **Enablement value**
5. **Discovery value**

These are combined into one `core_value`.

The framework then applies:

- Confidence.
- Strategic fit.
- Urgency.
- Maintenance effect.
- Effort.

This produces the general `priority_index`.

Separately, the framework computes:

- Delivery risk.
- Required QA level.
- Autonomy suitability.
- Agent-pick score.
- Quick-win score.
- Human-leverage score.

---

# 12. Positive and negative value symmetry

Positive product value and negative risk prevention are conceptual analogues.

## Positive value

```text
Scope of benefit
× magnitude of benefit
× recurrence of benefit
```

## Negative risk

```text
Likelihood of failure
× magnitude of harm
× blast radius
```

Examples:

- Highly valuable to a small audience can be comparable to mildly valuable to a broad audience.
- A low-likelihood catastrophic event can be comparable to a likely moderate event.
- A feature useful to nearly everyone but only slightly useful can still be worthwhile.
- A severe security risk must not be ignored merely because exploitation is not observed every day.

---

# 13. General score scale

Most human inputs use an anchored `1–5` scale.

Use `0` only when a dimension is genuinely not applicable.

Scores of `4` or `5` should normally have a written rationale or evidence.

Avoid assigning `5` to mean merely “good.”

---

# 14. Opportunity value

Opportunity value represents positive benefit created for users, customers, operators, or the business.

Inputs:

- Reach.
- Benefit magnitude.
- Frequency or recurrence.

## 14.1 Reach

Reach should be measured relative to the relevant target population over a defined horizon, not necessarily against every registered account.

| Score | Meaning |
|---:|---|
| 1 | One user, one customer, or a very small edge segment |
| 2 | Small but meaningful segment |
| 3 | Material segment or common specialist workflow |
| 4 | Most active or relevant users |
| 5 | Nearly all relevant users or a core system-wide path |

A single strategically important customer should not artificially receive Reach 5. Its importance should instead appear through benefit, urgency, commercial evidence, or strategic fit.

## 14.2 Benefit magnitude

| Score | Meaning |
|---:|---|
| 1 | Cosmetic or very small convenience |
| 2 | Noticeable improvement |
| 3 | Meaningful workflow improvement |
| 4 | Major productivity, usability, or commercial improvement |
| 5 | Transformative outcome, critical blocker removal, or essential capability |

## 14.3 Frequency

| Score | Meaning |
|---:|---|
| 1 | Rare edge case or one-off event |
| 2 | Occasional |
| 3 | Regular, monthly, or meaningful lifecycle step |
| 4 | Weekly or frequently recurring |
| 5 | Daily, continuous, or central to the normal workflow |

A one-time event such as onboarding can still be important. Frequency only moderates the score; it does not reduce rare work to zero.

## 14.4 Formula

```text
Opportunity Score =
100
× (Reach / 5)
× (Benefit / 5)
× (0.5 + 0.1 × Frequency)
```

Range: `0–100`.

This intentionally makes the following broadly comparable:

```text
Reach 1 × Benefit 5
Reach 5 × Benefit 1
```

Both represent narrow/deep versus broad/shallow value.

---

# 15. Risk-reduction value

Risk-reduction value applies to:

- Security.
- Privacy.
- Correctness.
- Data integrity.
- Reliability.
- Compliance.
- Operational risk.
- Potentially destructive technical debt.

Inputs:

- Likelihood.
- Harm magnitude.
- Blast radius.
- Mitigation effectiveness.
- Whether a catastrophic tail scenario is credible.

The likelihood must be assessed over a stated horizon, normally the next 12 months for latent risks.

## 15.1 Likelihood

| Score | Meaning |
|---:|---|
| 1 | Rare; requires an unusual chain of conditions |
| 2 | Unlikely but credible |
| 3 | Plausible under realistic conditions |
| 4 | Likely or repeatedly approached |
| 5 | Observed, active, recurring, or expected |

## 15.2 Harm magnitude

This is the severity of harm for an affected unit.

| Score | Meaning |
|---:|---|
| 1 | Negligible |
| 2 | Minor and easily recoverable |
| 3 | Material loss, degradation, or customer impact |
| 4 | Severe customer, financial, operational, or data harm |
| 5 | Catastrophic, unrecoverable, security-critical, or regulatory harm |

## 15.3 Blast radius

| Score | Meaning |
|---:|---|
| 1 | Local development environment or isolated internal case |
| 2 | One record, user, job, or small workflow |
| 3 | Customer segment, base, subsystem, or meaningful data set |
| 4 | Multiple customers or a core production service |
| 5 | System-wide, cross-customer, externally propagating, or irreversible |

## 15.4 Mitigation effectiveness

| Score | Approximate reduction |
|---:|---:|
| 1 | 20% |
| 2 | 40% |
| 3 | 60% |
| 4 | 80% |
| 5 | Nearly complete mitigation |

## 15.5 Expected risk formula

```text
Expected Risk =
100
× (Likelihood / 5)
× (Harm / 5)
× (Blast Radius / 5)
```

## 15.6 Catastrophic tail-risk floor

Simple expected-risk multiplication can undervalue rare but catastrophic outcomes.

Apply a tail-risk floor only when:

- There is a concrete and technically credible failure or attack path.
- Its preconditions can realistically occur.
- The scenario is not merely theoretical speculation.

Recommended floor:

```text
If Harm = 5 and Blast Radius = 5:
    Tail Floor = 70

Else if one is 5 and the other is at least 4:
    Tail Floor = 55

Else if Harm >= 4 and Blast Radius >= 4:
    Tail Floor = 40

Else:
    Tail Floor = 0
```

## 15.7 Risk-reduction formula

```text
Risk Exposure =
max(Expected Risk, Tail Floor)

Risk Reduction Score =
Risk Exposure
× (Mitigation Effectiveness / 5)
```

Range: `0–100`.

Confidence is applied later as a general modifier.

## 15.8 Quantitative alternative

Where meaningful data exists, optionally record:

```text
Expected annual loss =
Annual probability
× Estimated financial or operational loss

Expected risk reduction =
Expected annual loss
× Mitigation effectiveness
```

The ordinal score should remain available for cross-category board ranking. Do not pretend to know precise probabilities where none exist.

---

# 16. Engineering-health value

Engineering-health value captures improvements that may not immediately change user-visible behavior but make the system easier, safer, or cheaper to operate.

Inputs:

- Maintenance reduction.
- Complexity reduction.
- Reliability and testability improvement.
- Recurring engineering or operational time saved.

## 16.1 Maintenance reduction

| Score | Meaning |
|---:|---|
| 0 | No maintenance reduction |
| 1 | Very small recurring reduction |
| 2 | Noticeable local reduction |
| 3 | Material reduction |
| 4 | Major recurring reduction |
| 5 | Eliminates a recurring burden, subsystem, or class of work |

## 16.2 Complexity reduction

| Score | Meaning |
|---:|---|
| 0 | No simplification |
| 1 | Minor cleanup |
| 2 | Local simplification |
| 3 | Meaningful reduction in concepts or branches |
| 4 | Major architectural simplification |
| 5 | Removes a subsystem, compatibility layer, or entire class of complexity |

## 16.3 Reliability and testability improvement

| Score | Meaning |
|---:|---|
| 0 | No improvement |
| 1 | Slightly easier to diagnose or test |
| 2 | Adds useful test or observability coverage |
| 3 | Materially reduces regression probability |
| 4 | Strong reliability or verification improvement |
| 5 | Eliminates a major blind spot or failure class |

## 16.4 Recurring time saved

| Score | Meaning |
|---:|---|
| 0 | No recurring savings |
| 1 | Occasional minor savings |
| 2 | Repeated local savings |
| 3 | Material monthly savings |
| 4 | Major recurring engineering or operational savings |
| 5 | Eliminates a substantial recurring process |

## 16.5 Formula

```text
Engineering Health Score =
20 × (
    0.35 × Maintenance Reduction
  + 0.25 × Complexity Reduction
  + 0.25 × Reliability/Testability
  + 0.15 × Recurring Time Saved
)
```

Range: `0–100`.

---

# 17. Enablement value

Enablement value represents work whose direct user value may be small but which unlocks valuable downstream work.

Inputs:

- Value of downstream work.
- Breadth of work unlocked.
- Critical-path significance.

## 17.1 Downstream value

| Score | Meaning |
|---:|---|
| 0 | Unlocks nothing |
| 1 | Supports a low-value follow-up |
| 2 | Enables one useful card |
| 3 | Enables meaningful planned work |
| 4 | Enables several high-value cards |
| 5 | Required foundation for a major product or architectural direction |

## 17.2 Downstream breadth

| Score | Meaning |
|---:|---|
| 0 | No downstream dependency |
| 1 | One minor dependent card |
| 2 | One or two cards |
| 3 | Several cards |
| 4 | Multiple workstreams |
| 5 | Broad platform-level enablement |

## 17.3 Critical path

| Score | Meaning |
|---:|---|
| 0 | Not on a critical path |
| 1 | Optional convenience |
| 2 | Helpful sequencing improvement |
| 3 | Blocks meaningful planned work |
| 4 | Blocks a major milestone |
| 5 | Blocks an essential launch, migration, or strategic direction |

## 17.4 Formula

```text
Enablement Score =
20 × (
    0.50 × Downstream Value
  + 0.20 × Downstream Breadth
  + 0.30 × Critical Path
)
```

Range: `0–100`.

Dependencies should be linked explicitly. High enablement scores without linked downstream cards require a written rationale.

---

# 18. Discovery value

High-potential but poorly understood work should not be prematurely converted into an implementation card.

A discovery card creates value by reducing uncertainty before a larger decision.

Inputs:

- Uncertainty reduced.
- Importance of the resulting decision.
- Cost of making the wrong decision.

## 18.1 Formula

```text
Discovery Score =
20 × (
    0.40 × Uncertainty Reduction
  + 0.35 × Decision Importance
  + 0.25 × Cost of Wrong Choice
)
```

Range: `0–100`.

## 18.2 Discovery rule

When all of the following are true:

- Potential core value is high.
- Confidence is 1 or 2.
- Implementation effort is material.
- The uncertainty can be reduced cheaply.

Create and prioritize a discovery card instead of implementing the full feature.

The discovery card’s acceptance criterion should be a decision, measurement, prototype result, or rejected hypothesis—not “research completed.”

---

# 19. Core value aggregation

A task may create several kinds of value simultaneously.

Simply summing every value dimension encourages double counting. Using only the largest dimension ignores genuine secondary benefits.

Use a dominant-value model with a limited supporting-value contribution.

```text
Scores =
[
  Opportunity Score,
  Risk Reduction Score,
  Engineering Health Score,
  Enablement Score,
  Discovery Score
]

Dominant Value =
max(Scores)

Supporting Value =
min(
    20,
    0.15 × (sum(Scores) - Dominant Value)
)

Core Value =
min(
    100,
    Dominant Value + Supporting Value
)
```

This means:

- A strong security card can dominate through risk reduction.
- A cleanup can dominate through engineering health.
- A foundational task can dominate through enablement.
- Secondary benefits matter, but cannot inflate a mediocre card into a top priority merely through overlapping descriptions.

---

# 20. General modifiers

## 20.1 Confidence

Confidence represents confidence in the problem, expected outcome, and score—not confidence that implementation will be easy.

| Score | Meaning | Multiplier |
|---:|---|---:|
| 1 | Speculative hypothesis | 0.45 |
| 2 | Weak evidence or anecdotal signal | 0.60 |
| 3 | Plausible and reasonably supported | 0.75 |
| 4 | Strong evidence | 0.90 |
| 5 | Measured, reproduced, confirmed, or contractually required | 1.00 |

Examples of evidence:

- Analytics.
- Customer reports.
- Reproduced failures.
- Benchmarks.
- Logs.
- Security analysis.
- Dependency graph.
- Support volume.
- Existing implementation data.

An AI-created card should normally begin with Confidence 1–3 unless it includes direct repository, production, or user evidence.

## 20.2 Strategic fit

| Score | Meaning | Multiplier |
|---:|---|---:|
| 1 | Distracting or contrary to strategy | 0.80 |
| 2 | Peripheral | 0.90 |
| 3 | Neutral or generally supportive | 1.00 |
| 4 | Strongly supports a strategic pillar | 1.10 |
| 5 | Central to product differentiation, commitment, or current strategy | 1.20 |

Mandatory security, compliance, and incident work should not be penalized for low strategic fit.

For P0 and P1 work, strategic fit is ignored.

## 20.3 Urgency and cost of delay

| Score | Meaning | Multiplier |
|---:|---|---:|
| 1 | No meaningful time sensitivity | 0.90 |
| 2 | Normal backlog timing | 1.00 |
| 3 | Value or safety decays if delayed | 1.10 |
| 4 | Material deadline or opportunity window | 1.25 |
| 5 | Imminent deadline, rapidly increasing risk, or current customer impact | 1.45 |

Urgency is not card age.

An old card is not urgent merely because it is old.

## 20.4 Maintenance delta

This estimates the ongoing burden of the resulting solution.

| Score | Meaning | Multiplier |
|---:|---|---:|
| -2 | Adds substantial permanent maintenance burden | 0.85 |
| -1 | Adds some ongoing burden or surface area | 0.93 |
| 0 | Approximately neutral | 1.00 |
| +1 | Reduces ongoing burden | 1.07 |
| +2 | Eliminates substantial burden or a maintained subsystem | 1.15 |

This modifier is intentionally modest.

A strategically necessary feature should not be automatically rejected merely because it adds a maintained surface. It should instead be identified as human-led, regression-prone, or debt-creating work.

---

# 21. Effort

Use effort points:

```text
1, 2, 3, 5, 8, 13
```

Effort should include:

- Implementation.
- Required tests.
- Review.
- Migration.
- Rollout.
- Documentation.
- Expected debugging.
- Required coordination.

Suggested interpretation:

| Points | Meaning |
|---:|---|
| 1 | Very small, bounded change |
| 2 | Small change |
| 3 | Normal small card |
| 5 | Material but still bounded |
| 8 | Large card; consider splitting |
| 13 | Very large; normally an epic or insufficiently decomposed |

Implementation complexity is recorded separately because:

- Complexity affects execution mode and regression risk.
- Effort already includes the expected cost.
- Applying complexity again directly to the denominator would frequently double count it.

---

# 22. General Priority Index

For normal ranked work:

```text
Priority Index =
(
  Core Value
  × Confidence Multiplier
  × Strategic Fit Multiplier
  × Urgency Multiplier
  × Maintenance Multiplier
)
÷ Effort Points ^ 0.60
```

The effort exponent is less than 1 so that:

- Small quick wins are rewarded.
- Large but important work is not completely starved.
- The framework does not become a pure “smallest ticket first” queue.

`Priority Index` is a ranking index, not a percentage.

For presentation, tooling may additionally calculate:

```text
Priority Percentile =
Percentile rank among currently eligible P2 cards
```

Do not interpret a Priority Index of 60 as “60% valuable.”

---

# 23. Priority classes and mandatory gates

Priority class is lexicographically stronger than every score.

```yaml
priority_class:
  - P0
  - P1
  - P2
  - P3
```

## P0 — Immediate emergency

Examples:

- Active production outage.
- Active or confirmed compromise.
- Ongoing data corruption or loss.
- Exposed credentials or secrets with active exposure.
- System-wide critical failure.
- Imminent legal or regulatory breach.
- Critical customer-wide blocker with no acceptable workaround.

P0 work interrupts ordinary prioritization.

## P1 — Mandatory urgent work

Examples:

- Reachable critical security vulnerability without known exploitation.
- Credible path to catastrophic or irreversible damage.
- High-probability severe reliability failure.
- Material data-integrity flaw.
- Time-bound compliance requirement.
- Severe customer impact that is not yet a full incident.

P1 work is handled before normal P2 work.

## P2 — Normal ranked work

The normal scored backlog.

P2 cards are ordered using the relevant board score.

## P3 — Parked or deliberately excluded

Examples:

- Not aligned with current strategy.
- Premature idea.
- Superseded direction.
- Work intentionally deferred until a future trigger.
- Interesting but currently unjustified.

P3 is not merely “low score.” It is an explicit scheduling decision.

## 23.1 Critical queue ordering

Within the same priority class:

```text
Critical Index =
Risk Reduction Score
× Urgency Multiplier
× Confidence Multiplier
÷ Effort Points ^ 0.15
```

Effort has only a weak effect because expensive critical work cannot be ignored.

Where possible, split:

- Immediate containment.
- Permanent remediation.

The containment card can then achieve a high risk reduction with low effort while the permanent fix follows.

---

# 24. Problem risk versus delivery risk

Every consequential card can have two different risks:

## Problem risk

The danger or cost that exists if the card is not completed.

This is represented by `risk_prevented`.

## Delivery risk

The danger introduced by implementing or deploying the card incorrectly.

This is represented by:

- Regression likelihood.
- Change blast radius.
- Reversibility.
- Behavior surface.
- Data sensitivity.

A security fix can therefore be:

```text
Very high problem-risk reduction
Very high delivery risk
Very low autonomous suitability
```

That combination means:

> Do this urgently, but do it with close human review.

It does not mean the card should receive a lower priority.

---

# 25. Delivery-risk score

Inputs:

## Regression likelihood

| Score | Meaning |
|---:|---|
| 1 | Highly local and well understood |
| 2 | Low regression probability |
| 3 | Moderate or nontrivial |
| 4 | Cross-cutting or difficult to predict |
| 5 | Highly coupled, novel, or poorly understood |

## Change blast radius

This is the blast radius of a bad implementation, not the original problem.

| Score | Meaning |
|---:|---|
| 1 | Local, test-only, or isolated internal behavior |
| 2 | One module or narrow workflow |
| 3 | Material subsystem or customer segment |
| 4 | Multiple customers or core system behavior |
| 5 | System-wide, cross-customer, or potentially destructive |

## Reversibility

| Score | Meaning |
|---:|---|
| 1 | Effectively irreversible |
| 2 | Expensive or risky rollback |
| 3 | Recoverable with material work |
| 4 | Straightforward rollback |
| 5 | Trivial revert, feature flag, or isolated deployment |

## Formula

```text
Delivery Risk =
4
× Regression Likelihood
× Change Blast Radius
× (1.2 - 0.2 × Reversibility)
```

Clamp to `0–100`.

This makes difficult-to-reverse changes materially riskier.

---

# 26. QA levels

QA rigor should be driven by delivery risk and sensitive surfaces.

```yaml
qa_level:
  - Q0
  - Q1
  - Q2
  - Q3
  - Q4
```

## Q0 — Non-runtime

Examples:

- Documentation.
- Comments.
- Planning files.
- Test fixtures that cannot affect production behavior.

Requirements:

- Formatting or lint checks where relevant.
- Basic review.

## Q1 — Routine

Typical Delivery Risk: `0–20`.

Requirements:

- Relevant unit or static tests.
- CI passes.
- Self-review or ordinary code review.
- Acceptance criteria checked.

## Q2 — Standard elevated verification

Typical Delivery Risk: `21–40`.

Requirements:

- Targeted unit and integration tests.
- Explicit regression cases.
- Human code review.
- Rollback note.
- Relevant local or staging verification.

## Q3 — High-risk change

Typical Delivery Risk: `41–65`.

Requirements:

- Integration or end-to-end coverage.
- Staging, canary, or controlled rollout.
- Explicit rollback procedure.
- Human approval before deployment.
- Post-deployment monitoring.
- Verification of affected data and behavior.

## Q4 — Critical change

Typical Delivery Risk: `66–100`, or automatic escalation due to sensitive surface.

Examples:

- Authentication and authorization.
- Cross-customer data access.
- Destructive migrations.
- Billing.
- Secrets and cryptography.
- Critical production infrastructure.
- High-impact privacy or compliance work.

Requirements:

- Specialist review where relevant.
- At least two independent reviews for highly sensitive changes.
- Explicit threat, failure, or migration analysis.
- Backup or containment plan.
- Tested rollback where possible.
- Controlled deployment.
- Defined post-deployment observation.
- Human sign-off.

An emergency containment change may use an abbreviated test process, but only with explicit approval, narrow scope, rollback capability, and active observation.

---

# 27. Behavior surface and sensitivity

## 27.1 Behavior surface

| Score | Meaning |
|---:|---|
| 1 | Internal implementation; no intended observable behavior change |
| 2 | Diagnostics, tooling, or narrow administrative behavior |
| 3 | Small change to existing behavior |
| 4 | Material user-facing workflow, public API, or product behavior |
| 5 | Core semantics, pricing, permissions, authentication, or contractual behavior |

## 27.2 Data sensitivity

| Score | Meaning |
|---:|---|
| 1 | No production data or only fixtures |
| 2 | Ordinary nonsensitive internal data |
| 3 | Production customer data |
| 4 | Personal, confidential, or security-adjacent data |
| 5 | Authentication, authorization, secrets, financial, regulated, or cross-customer data |

These dimensions heavily affect autonomy even when the card is clearly specified.

---

# 28. Autonomy suitability

Autonomy suitability asks:

> How safely can an agent execute this card with limited human involvement?

It is not a measure of business priority.

Inputs:

Positive factors:

- Specification clarity.
- Verification strength.
- Boundedness.
- Isolation.
- Reversibility.

Risk penalties:

- Regression likelihood.
- Behavior surface.
- Data sensitivity.
- Coordination complexity.

## 28.1 Specification clarity

| Score | Meaning |
|---:|---|
| 1 | Desired outcome is subjective or unresolved |
| 2 | Broad direction exists but major decisions remain |
| 3 | Mostly clear with some interpretation required |
| 4 | Clear objective, scope, and acceptance criteria |
| 5 | Mechanically precise and difficult to misinterpret |

## 28.2 Verification strength

| Score | Meaning |
|---:|---|
| 1 | Success is mostly subjective |
| 2 | Manual inspection can provide weak evidence |
| 3 | Targeted automated tests are possible |
| 4 | Strong deterministic integration verification exists |
| 5 | Comprehensive deterministic tests plus runtime or invariant checks |

## 28.3 Boundedness

| Score | Meaning |
|---:|---|
| 1 | Open-ended or exploratory implementation |
| 2 | Broad surface with unclear stopping point |
| 3 | Reasonably bounded |
| 4 | Clear modules and limits |
| 5 | Very small, explicit, and mechanically bounded |

## 28.4 Isolation

| Score | Meaning |
|---:|---|
| 1 | Highly cross-cutting |
| 2 | Many coupled systems |
| 3 | Some meaningful coupling |
| 4 | Mostly isolated |
| 5 | Fully local or independently deployable |

## 28.5 Autonomy formula

```text
Autonomy Base =
100 × geometric_mean(
    Specification Clarity / 5,
    Verification Strength / 5,
    Reversibility / 5,
    Boundedness / 5,
    Isolation / 5
)
```

The geometric mean is intentional. One weak essential dimension cannot be completely hidden by several strong dimensions.

```text
Autonomy Penalty =
    6 × (Regression Likelihood - 1)
  + 6 × (Behavior Surface - 1)
  + 8 × (Data Sensitivity - 1)
  + 4 × (Coordination Complexity - 1)
```

```text
Autonomy Score =
clamp(
    Autonomy Base - Autonomy Penalty,
    0,
    100
)
```

---

# 29. Autonomy classes

```yaml
autonomy_class:
  - A0
  - A1
  - A2
  - A3
  - A4
```

## A0 — Agent execution prohibited

The agent may not modify the implementation.

It may potentially summarize existing information if permitted.

Common reasons:

- Explicit policy prohibition.
- Inaccessible or restricted systems.
- Legal or contractual restriction.
- Unresolvable ambiguity.
- Human-only decision.

## A1 — Analysis or shaping only

Typical score: `< 55`, depending on policy.

The agent may:

- Investigate.
- Gather repository evidence.
- Propose decomposition.
- Draft acceptance criteria.
- Produce a test plan.
- Identify risks.

The agent should not implement without a new decision.

## A2 — Human-led or paired execution

Typical score: `55–74`.

The agent may:

- Implement under active human direction.
- Prepare a draft patch.
- Stop at explicit checkpoints.
- Request review before consequential decisions.

Human review is mandatory.

## A3 — Autonomous implementation and pull request

Typical score: `75–89`.

The agent may:

- Claim the card.
- Implement within scope.
- Run tests.
- Update documentation.
- Open a pull request.
- Update card status.

Human review is still required before merge.

## A4 — Policy-authorized autonomous merge

Typical score: `90–100`.

A4 should require all of the following:

- Explicit repository policy permits autonomous merge.
- Effort is normally 1–3.
- Behavior surface is at most 2.
- Data sensitivity is at most 2.
- Delivery Risk is at most 20.
- CI is deterministic and comprehensive.
- Rollback is straightforward.
- No manual override blocks execution.
- No sensitive category is involved.

A4 should be opt-in rather than the default.

---

# 30. Autonomous-execution hard gates

The following normally cap execution at A2, regardless of the calculated score:

- P0 or P1 work.
- Authentication or authorization.
- Permission systems or row-level access.
- Cross-customer data boundaries.
- Secrets, encryption, or key handling.
- Billing, pricing, invoicing, or payments.
- Destructive or irreversible migrations.
- Production data deletion.
- Public API or persistent contract changes.
- Major user-facing behavior.
- Major UX or product semantics.
- Privacy or compliance decisions.
- Production networking or security infrastructure.
- External communication made in the user’s name.
- Financial expenditure.
- Changes without adequate rollback.
- Changes whose correctness depends primarily on subjective judgment.

An agent can still investigate or prepare a patch, but it cannot run unattended through completion.

Use:

```yaml
execution:
  autonomous_execution_blocked: true
```

For circumstances where no agent implementation is permitted:

```yaml
execution:
  agent_execution_blocked: true
```

A manual override may tighten restrictions freely. Loosening a restriction requires a written reason and should have an expiration date.

---

# 31. Agent Pick Index

An autonomous agent should not simply pick the card with the highest Priority Index.

The card must first be:

- `ready`.
- Unblocked.
- Within its allowed date window.
- A3 or A4.
- Free of unattended-execution gates.
- Within the agent’s current scope and access.
- Not already claimed by another actor.
- Compatible with the configured execution mode.

Then calculate:

```text
Agent Pick Index =
Priority Index
× (Autonomy Score / 100) ^ 2
× (1 + 0.30 × Engineering Health Score / 100)
```

This:

- Strongly favors safely autonomous work.
- Gives a modest preference to technical-debt and maintenance reduction.
- Still preserves actual project value.
- Prevents a high-value but unsafe task from entering the autonomous queue.

The squared autonomy term intentionally penalizes borderline tasks.

---

# 32. Specialized board views

A single score is useful, but no single ordering answers every management question.

The board should expose multiple views using the same source data.

## 32.1 Critical

Filter:

```text
priority_class in [P0, P1]
status not in [done, dropped]
```

Sort:

```text
priority_class
then Critical Index descending
```

Question answered:

> What must be handled before normal planning?

## 32.2 Best overall investments

Filter:

```text
priority_class = P2
status = ready
unblocked
```

Sort:

```text
Priority Index descending
```

Question answered:

> What produces the strongest expected return on effort?

## 32.3 Safe quick wins

Recommended filter:

```text
priority_class = P2
status = ready
Effort Points <= 3
Confidence >= 4
Specification Clarity >= 4
Verification Strength >= 4
Delivery Risk <= 25
Maintenance Delta >= 0
unblocked
```

Formula:

```text
Quick Win Index =
Priority Index
× (Verification Strength / 5)
× (Reversibility / 5)
```

Question answered:

> What useful work can be finished quickly with little downside?

A “quick win” is not merely a small task. It must also have enough value and confidence.

## 32.4 Autonomous agent queue

Filter:

```text
status = ready
priority_class = P2
Autonomy Class in [A3, A4]
autonomous_execution_blocked = false
do_not_autorun = false
unblocked
```

Sort:

```text
Agent Pick Index descending
```

Question answered:

> What should an autonomous development agent safely work on next?

## 32.5 Autonomous maintenance queue

Filter:

```text
Autonomous agent queue
and (
    Engineering Health Score >= 40
    or Maintenance Delta >= 1
)
```

Sort:

```text
Agent Pick Index
× (1 + 0.50 × Engineering Health Score / 100)
```

Question answered:

> What safe autonomous work most improves the codebase and reduces maintenance?

## 32.6 Human-led high-leverage work

Filter:

```text
status = ready
Core Value >= 65
and (
    Autonomy Score < 75
    or Behavior Surface >= 4
    or Data Sensitivity >= 4
    or Delivery Risk >= 40
    or Maintenance Delta < 0
)
```

Sort:

```text
Priority Index descending
```

Question answered:

> Where is focused human and AI collaboration most valuable?

This view should contain:

- Major product features.
- Architecture decisions.
- UX and workflow changes.
- High-impact migrations.
- Security-sensitive changes.
- Valuable features that introduce new technical burden.

## 32.7 Engineering-health investments

Filter:

```text
Engineering Health Score >= 40
status = ready
unblocked
```

Sort:

```text
Engineering Health Score
× Confidence Multiplier
÷ Effort Points ^ 0.60
```

Question answered:

> Which tasks most improve maintainability, reliability, and system simplicity?

## 32.8 Unlockers

Filter:

```text
Enablement Score >= 40
status = ready
unblocked
```

Sort:

```text
Enablement Score
× Confidence Multiplier
÷ Effort Points ^ 0.60
```

Question answered:

> Which foundational cards unlock the most valuable downstream work?

## 32.9 Validate before building

Filter:

```text
Confidence <= 2
and potential Core Value >= 50
```

Sort:

```text
Discovery Score descending
```

Question answered:

> Which promising ideas should be validated before substantial implementation?

## 32.10 Debt-creating high-impact work

Filter:

```text
Core Value >= 50
and (
    Maintenance Delta < 0
    or Delivery Risk >= 40
    or Implementation Complexity >= 4
)
```

Question answered:

> Which valuable changes deserve extra architectural scrutiny and explicit follow-up planning?

## 32.11 Blocked

Display:

- Card.
- Blocked reason.
- Blocking card or condition.
- Next action.
- Value being delayed.
- Date last reviewed.

Do not hide blocked high-value work merely because it cannot currently be executed.

## 32.12 Stale assumptions

Filter:

```text
review_after < today
and status not in [done, dropped]
```

Question answered:

> Which scores, assumptions, or requirements may no longer be trustworthy?

---

# 33. Human Leverage Index

For optional sorting within the human-led view:

```text
Human Leverage Index =
Priority Index
× (
    1 + 0.50 × (1 - Autonomy Score / 100)
)
```

This slightly raises tasks where human attention is unusually necessary.

It should only be used after filtering for meaningful Core Value. Otherwise, vague and unsafe low-value tasks would rise merely because they are unsuitable for agents.

---

# 34. Strategic product leverage extension

A project can optionally define one product-specific leverage dimension.

For Orloi, this could be:

## Observatory Leverage

> How strongly does this work improve Orloi’s ability to capture, preserve, understand, explain, or act on operational history?

| Score | Meaning |
|---:|---|
| 1 | Unrelated to the core product thesis |
| 2 | Peripheral product support |
| 3 | Generally supports the product |
| 4 | Strengthens operational observability or memory |
| 5 | Deepens the core differentiator or enables new reasoning capabilities |

This can use a deliberately small multiplier:

| Score | Multiplier |
|---:|---:|
| 1 | 0.95 |
| 2 | 0.975 |
| 3 | 1.00 |
| 4 | 1.05 |
| 5 | 1.10 |

Then:

```text
Priority Index =
existing Priority Index
× Product Leverage Multiplier
```

Only enable this dimension if it is meaningfully different from `strategic_fit`. Otherwise, it adds complexity without new information.

A generic project might call this:

```yaml
core_product_leverage: 4
```

---

# 35. Maintenance burden and deliberate debt

Some high-value work legitimately introduces maintenance burden.

The framework should not automatically reject it.

Instead, when:

```text
Maintenance Delta < 0
```

the card should state:

- What new long-lived surface is introduced.
- Why the added burden is justified.
- What regressions become possible.
- Who or what will maintain it.
- Whether a simpler alternative was considered.
- Whether a linked cleanup or hardening card is required.
- Whether the debt is temporary or permanent.
- A review or sunset date where appropriate.

Example:

```yaml
maintenance:
  delta: -1
  new_surface: "Additional compatibility path for legacy webhook payloads."
  justification: "Required to complete customer migration without downtime."
  follow_up: ORL-218
  review_after: 2026-11-01
```

An autonomous agent should not silently introduce architectural debt outside the card’s explicit scope.

---

# 36. Dependency and unlock rules

Dependencies should be machine-readable.

```yaml
depends_on:
  - ORL-101

blocks:
  - ORL-103
  - ORL-104
```

Rules:

1. A blocked card remains scored but is not execution-eligible.
2. Dependencies should represent genuine sequencing constraints, not loose relationships.
3. Avoid circular dependencies.
4. Parent-child relationships do not automatically imply execution dependency.
5. Enablement scores should reference concrete downstream cards where possible.
6. Parent epics and child tasks should not both consume execution capacity.
7. When one prerequisite blocks several high-value cards, it should receive meaningful enablement value.
8. When a dependency is only preferred rather than required, record that distinction instead of blocking the card.

Optional dependency strength:

```yaml
dependency_type:
  - hard
  - partial
  - preferred
```

---

# 37. Agent selection procedure

An autonomous coding loop should follow this sequence.

## 37.1 Load candidates

Select cards where:

```text
status = ready
not blocked
not_before is null or in the past
priority_class = P2
do_not_autorun = false
```

## 37.2 Apply policy gates

Exclude or cap cards involving restricted surfaces.

Do not use the numerical score to bypass policy.

## 37.3 Select execution mode

Examples:

```yaml
agent_mode:
  - general
  - maintenance
  - tests
  - observability
  - safe_product
```

Each mode can add filters.

### General mode

Sort eligible A3/A4 cards by Agent Pick Index.

### Maintenance mode

Require meaningful engineering-health value and sort by the maintenance-agent score.

### Test mode

Prefer:

- Missing regression coverage.
- Deterministic verification.
- No behavior change.
- High reliability/testability improvement.

### Safe product mode

Require:

- Behavior Surface <= 2 or explicitly approved 3.
- Delivery Risk <= 25.
- Strong acceptance criteria.
- Strong automated verification.

## 37.4 Revalidate before claiming

The agent should inspect the current repository and verify:

- The problem still exists.
- The referenced files and assumptions remain current.
- Dependencies are complete.
- The card remains bounded.
- The score has not been invalidated by recent changes.
- No other agent or developer has claimed the card.

## 37.5 Claim the card

Use an atomic claim or lock.

```yaml
claimed_by: agent-name
claimed_at: 2026-08-03T12:00:00Z
claim_expires_at: 2026-08-03T14:00:00Z
```

This avoids duplicate autonomous work.

## 37.6 Execute within scope

The agent should:

- Implement only the defined outcome.
- Avoid opportunistic unrelated refactors.
- Run required tests.
- Preserve or improve rollback capability.
- Create follow-up cards for newly discovered optional work.
- Stop if the required scope or behavior materially changes.

## 37.7 Escalate rather than improvise

The agent should stop or downgrade the card to A2 when it discovers:

- An unresolved product decision.
- Unexpected public behavior change.
- A destructive migration.
- A security-sensitive condition.
- A much larger blast radius.
- Inadequate verification.
- A new external dependency.
- Significantly larger effort.
- A contradiction in the acceptance criteria.

## 37.8 Complete or submit

Depending on autonomy class:

- A3: open a pull request and move to `review`.
- A4: merge only when explicit repository policy permits it.
- Record tests, resulting behavior, and follow-ups.
- Recalculate downstream dependencies and scores.

---

# 38. Agent-created cards

Agents may create new cards, but they should not freely authorize their own work.

Recommended rules:

1. Agent-created cards enter `inbox` or `shaping`.
2. An agent may propose scores and evidence.
3. P0 and P1 classification requires:
   - Direct incident evidence, or
   - Human ratification.
4. A4 authorization requires human or repository policy approval.
5. An agent cannot remove a human-set `do_not_autorun`.
6. An agent can tighten execution restrictions without approval.
7. An agent should not inflate the score of its own follow-up card merely to continue working.
8. Newly discovered optional work must not silently expand the active card.

---

# 39. Portfolio lanes

Pure score sorting can still starve certain categories.

Use capacity lanes in addition to scoring.

Suggested initial model:

## Mandatory lane

- P0 and P1.
- Consumes whatever capacity is required.

## Human leverage lane

- High-impact product work.
- Architecture.
- UX and behavior.
- Risky migrations.
- Sensitive security work.

## Autonomous maintenance lane

- Technical debt reduction.
- Test coverage.
- Observability.
- Internal reliability.
- Dead-code and compatibility cleanup.
- Low-risk performance improvements.

## Discovery lane

- Experiments.
- Benchmarks.
- Prototypes.
- Requirements validation.
- Architecture spikes.

A reasonable initial autonomous-agent capacity policy could be:

```text
60% engineering health and maintenance
25% tests, reliability, and observability
15% safe bounded product improvements
```

These are starting values, not universal requirements.

The score ranks work within a lane. The portfolio policy determines how much capacity each lane receives.

---

# 40. Scoring governance

## 40.1 Evidence for high scores

Require a rationale for most inputs scored 4 or 5.

Example:

```yaml
evidence:
  - "Four of six production incidents this quarter involved this retry path."
  - "The affected flow runs for every base synchronization."
  - "ORL-182, ORL-184, and ORL-190 are hard-blocked by this card."
```

## 40.2 Avoid score duplication

Do not describe the same value as:

- Benefit 5.
- Strategic fit 5.
- Enablement 5.
- Engineering health 5.

unless each represents genuinely distinct value.

## 40.3 Re-score on changed facts

Re-score when:

- New evidence appears.
- Scope changes.
- Dependencies change.
- A customer becomes blocked or unblocked.
- A deadline appears or disappears.
- Implementation risk changes.
- The repository architecture changes.
- Another card delivers part of the value.
- The task becomes substantially easier or harder.

Do not re-score merely to force a preferred ordering.

## 40.4 Formula versioning

Store:

```yaml
score_version: 1
```

When formulas or anchors change:

- Increment the version.
- Recalculate all active cards.
- Do not compare scores generated by materially different formula versions without recalculation.

## 40.5 Manual overrides

Manual priority overrides are legitimate, but must be explicit.

```yaml
manual_override:
  priority_index: 120
  expires_at: 2026-08-15
  reason: "Required for committed customer pilot."
```

Rules:

- Overrides must have a reason.
- Temporary overrides should expire.
- The original computed value remains visible.
- An override does not automatically loosen autonomy or QA requirements.
- Criticality overrides should be reviewed separately from execution-policy overrides.

---

# 41. “Quality” as a field

Avoid using a vague planned-work field named only:

```yaml
quality: high
```

It is ambiguous whether this means:

- Quality of the idea.
- Expected implementation quality.
- Importance.
- Specification quality.
- Architectural fit.
- Confidence.
- User impact.

Replace it with explicit dimensions:

- Confidence.
- Specification clarity.
- Verification strength.
- Reliability/testability improvement.
- Strategic fit.
- Delivery risk.
- Acceptance criteria.

Post-delivery implementation quality can be evaluated separately during review.

---

# 42. Worked examples

## 42.1 Reachable critical authorization flaw

Inputs:

```yaml
priority_class: P1

risk_prevented:
  likelihood: 3
  harm: 5
  blast_radius: 5
  mitigation_effectiveness: 5
  credible_tail: true

modifiers:
  confidence: 4
  strategic_fit: 3
  urgency: 5
  maintenance_delta: 0

estimate:
  effort_points: 3

delivery:
  regression_likelihood: 3
  change_blast_radius: 5
  reversibility: 3
  behavior_surface: 5
  data_sensitivity: 5

execution:
  autonomous_execution_blocked: true
```

Interpretation:

- The catastrophic tail floor produces high risk-reduction value.
- P1 makes the task mandatory regardless of its ordinary Priority Index.
- Authentication and broad data impact make it unsuitable for unattended execution.
- The correct response is urgent human-led work, potentially with an agent preparing analysis, tests, and a patch.

Recommended decomposition:

```text
Contain vulnerable path
Implement permanent authorization correction
Add cross-tenant regression coverage
Verify production access boundaries
```

## 42.2 Remove an obsolete synchronization subsystem

Inputs:

```yaml
priority_class: P2

engineering_health:
  maintenance_reduction: 5
  complexity_reduction: 4
  reliability_testability: 3
  recurring_time_saved: 3

enablement:
  downstream_value: 2
  downstream_breadth: 2
  critical_path: 2

modifiers:
  confidence: 5
  strategic_fit: 4
  urgency: 2
  maintenance_delta: 2

estimate:
  effort_points: 2

delivery:
  regression_likelihood: 1
  change_blast_radius: 2
  reversibility: 5
  behavior_surface: 1
  data_sensitivity: 1

execution:
  specification_clarity: 5
  verification_strength: 5
  boundedness: 5
  isolation: 5
```

Approximate result:

```text
Engineering Health Score: 79
Enablement Score: 40
Core Value: 85
Priority Index: approximately 71
Autonomy Score: very high
```

Interpretation:

- Strong overall investment.
- Excellent low-hanging fruit.
- Excellent autonomous maintenance candidate.
- It should appear near the top of both the general and maintenance-agent views.

## 42.3 Redesign the onboarding experience

Inputs:

```yaml
opportunity:
  reach: 5
  benefit: 4
  frequency: 2

engineering_health:
  maintenance_reduction: 0
  complexity_reduction: 0
  reliability_testability: 1
  recurring_time_saved: 0

enablement:
  downstream_value: 2
  downstream_breadth: 3
  critical_path: 2

modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 2
  maintenance_delta: -1

estimate:
  effort_points: 8

delivery:
  regression_likelihood: 4
  change_blast_radius: 4
  reversibility: 3
  behavior_surface: 5
  data_sensitivity: 2

execution:
  specification_clarity: 3
  verification_strength: 2
  boundedness: 2
  isolation: 2
```

Approximate result:

```text
Opportunity Score: 56
Core Value: approximately 63
Priority Index: approximately 15
Autonomy Score: low
```

Interpretation:

- Strategically meaningful.
- Not a low-hanging fruit.
- Not appropriate for autonomous execution.
- Should appear in the human-led product view.
- It may benefit from decomposition and a discovery or prototype card before full implementation.

## 42.4 Tiny improvement useful to nearly every user

```yaml
opportunity:
  reach: 5
  benefit: 1
  frequency: 5

estimate:
  effort_points: 1

modifiers:
  confidence: 5
  strategic_fit: 3
  urgency: 2
  maintenance_delta: 0
```

Opportunity Score:

```text
20
```

This can still be a good quick win due to tiny effort, but it should not be described as a major-impact feature.

---

# 43. Suggested generated views

Tooling can generate Markdown files such as:

```text
/_views/critical.md
/_views/ready-by-priority.md
/_views/quick-wins.md
/_views/autonomous.md
/_views/autonomous-maintenance.md
/_views/human-leverage.md
/_views/engineering-health.md
/_views/unlockers.md
/_views/discovery-needed.md
/_views/blocked.md
/_views/stale.md
```

Each entry should show enough information to make the ordering understandable:

```markdown
## ORL-218 — Remove legacy session reconstruction path

- Status: Ready
- Priority: P2
- Priority Index: 70.9
- Priority Percentile: 97
- Core Value: 85
- Effort: 2
- Autonomy: A4 / 100
- Engineering Health: 79
- Maintenance Delta: +2
- Why now: Removes obsolete subsystem and unblocks session-query cleanup.
```

Do not generate a board containing only titles and opaque numbers.

---

# 44. Recommended linter and scoring tool

A project-management script should:

1. Parse card frontmatter.
2. Validate required fields.
3. Check that score inputs are within allowed ranges.
4. Validate parent and dependency references.
5. Detect circular dependencies.
6. Detect folder/status disagreement.
7. Calculate all scores.
8. Apply priority and autonomy gates.
9. Warn when a score of 4 or 5 lacks evidence.
10. Warn when an 8- or 13-point card could be split.
11. Warn when a `ready` card lacks verification.
12. Warn when an active card has no visible `status_summary`.
13. Warn when a blocked card lacks `next_action`.
14. Warn when an autonomous card touches a protected surface.
15. Generate board views.
16. Recalculate downstream eligibility when a card is completed.
17. Preserve manual overrides separately from computed values.
18. Include the score version in generated output.

---

# 45. Reference computation pseudocode

```ts
const confidenceMultiplier = {
  1: 0.45,
  2: 0.60,
  3: 0.75,
  4: 0.90,
  5: 1.00,
};

const strategicMultiplier = {
  1: 0.80,
  2: 0.90,
  3: 1.00,
  4: 1.10,
  5: 1.20,
};

const urgencyMultiplier = {
  1: 0.90,
  2: 1.00,
  3: 1.10,
  4: 1.25,
  5: 1.45,
};

const maintenanceMultiplier = {
  [-2]: 0.85,
  [-1]: 0.93,
  [0]: 1.00,
  [1]: 1.07,
  [2]: 1.15,
};

function opportunityScore(card) {
  const { reach, benefit, frequency } = card.opportunity;

  if (!reach || !benefit || !frequency) return 0;

  return (
    100 *
    (reach / 5) *
    (benefit / 5) *
    (0.5 + 0.1 * frequency)
  );
}

function riskReductionScore(card) {
  const {
    likelihood,
    harm,
    blast_radius: blastRadius,
    mitigation_effectiveness: mitigation,
    credible_tail: credibleTail,
  } = card.risk_prevented;

  if (!likelihood || !harm || !blastRadius || !mitigation) return 0;

  const expectedRisk =
    100 *
    (likelihood / 5) *
    (harm / 5) *
    (blastRadius / 5);

  let tailFloor = 0;

  if (credibleTail) {
    if (harm === 5 && blastRadius === 5) {
      tailFloor = 70;
    } else if (
      Math.max(harm, blastRadius) === 5 &&
      Math.min(harm, blastRadius) >= 4
    ) {
      tailFloor = 55;
    } else if (harm >= 4 && blastRadius >= 4) {
      tailFloor = 40;
    }
  }

  return Math.max(expectedRisk, tailFloor) * (mitigation / 5);
}

function engineeringHealthScore(card) {
  const {
    maintenance_reduction: maintenance,
    complexity_reduction: complexity,
    reliability_testability: reliability,
    recurring_time_saved: timeSaved,
  } = card.engineering_health;

  return (
    20 *
    (
      0.35 * maintenance +
      0.25 * complexity +
      0.25 * reliability +
      0.15 * timeSaved
    )
  );
}

function enablementScore(card) {
  const {
    downstream_value: downstreamValue,
    downstream_breadth: downstreamBreadth,
    critical_path: criticalPath,
  } = card.enablement;

  return (
    20 *
    (
      0.50 * downstreamValue +
      0.20 * downstreamBreadth +
      0.30 * criticalPath
    )
  );
}

function discoveryScore(card) {
  const {
    uncertainty_reduction: uncertainty,
    decision_importance: importance,
    cost_of_wrong_choice: wrongChoiceCost,
  } = card.discovery_value;

  return (
    20 *
    (
      0.40 * uncertainty +
      0.35 * importance +
      0.25 * wrongChoiceCost
    )
  );
}

function coreValue(scores) {
  const dominant = Math.max(...scores);
  const remaining = scores.reduce((sum, score) => sum + score, 0) - dominant;
  const supporting = Math.min(20, 0.15 * remaining);

  return Math.min(100, dominant + supporting);
}

function priorityIndex(card, core) {
  const confidence =
    confidenceMultiplier[card.modifiers.confidence];

  const strategic =
    card.priority_class === "P0" || card.priority_class === "P1"
      ? 1
      : strategicMultiplier[card.modifiers.strategic_fit];

  const urgency =
    urgencyMultiplier[card.modifiers.urgency];

  const maintenance =
    card.priority_class === "P0" || card.priority_class === "P1"
      ? 1
      : maintenanceMultiplier[card.modifiers.maintenance_delta];

  return (
    core *
    confidence *
    strategic *
    urgency *
    maintenance
  ) / Math.pow(card.estimate.effort_points, 0.60);
}

function deliveryRisk(card) {
  const regression = card.delivery.regression_likelihood;
  const blastRadius = card.delivery.change_blast_radius;
  const reversibility = card.delivery.reversibility;

  return Math.min(
    100,
    4 *
      regression *
      blastRadius *
      (1.2 - 0.2 * reversibility),
  );
}

function geometricMean(values) {
  const product = values.reduce(
    (result, value) => result * value,
    1,
  );

  return Math.pow(product, 1 / values.length);
}

function autonomyScore(card) {
  if (card.execution.agent_execution_blocked) return 0;

  const base =
    100 *
    geometricMean([
      card.execution.specification_clarity / 5,
      card.execution.verification_strength / 5,
      card.delivery.reversibility / 5,
      card.execution.boundedness / 5,
      card.execution.isolation / 5,
    ]);

  const penalty =
    6 * (card.delivery.regression_likelihood - 1) +
    6 * (card.delivery.behavior_surface - 1) +
    8 * (card.delivery.data_sensitivity - 1) +
    4 * (card.estimate.coordination_complexity - 1);

  const calculated = Math.max(
    0,
    Math.min(100, base - penalty),
  );

  if (card.execution.autonomous_execution_blocked) {
    return Math.min(calculated, 74);
  }

  return calculated;
}

function agentPickIndex(priority, autonomy, health) {
  return (
    priority *
    Math.pow(autonomy / 100, 2) *
    (1 + 0.30 * health / 100)
  );
}
```

The code should be treated as a reference implementation of the specification, not as the only valid implementation.

---

# 46. Initial adoption plan

The entire framework does not need to be introduced at once.

## Phase 1 — Card clarity

Introduce:

- Card kinds.
- Work types.
- Standard statuses.
- Visible `status_summary`.
- `next_action`.
- Parent and dependencies.
- Objective.
- Scope.
- Acceptance criteria.
- Verification.
- Effort.
- Card-splitting rules.

This alone solves much of the “90% complete but visually opaque” problem.

## Phase 2 — Core prioritization

Introduce:

- Opportunity value.
- Risk-reduction value.
- Engineering-health value.
- Enablement value.
- Confidence.
- Strategic fit.
- Urgency.
- Maintenance delta.
- Priority Index.
- Critical gates.
- General and quick-win views.

## Phase 3 — Autonomous execution

Introduce:

- Delivery risk.
- Behavior surface.
- Data sensitivity.
- Specification clarity.
- Verification strength.
- Boundedness.
- Isolation.
- Autonomy Score.
- Execution gates.
- Agent Pick Index.
- Claim locking.
- Autonomous maintenance view.

## Phase 4 — Calibration

After enough cards are completed:

- Compare effort estimates to actual work.
- Review which high-scoring cards delivered value.
- Adjust formula constants only from observed patterns.
- Create project-specific examples for every score anchor.
- Add product-specific leverage only if strategic fit is insufficient.
- Review false positives and false negatives in autonomous eligibility.
- Version formula changes.

---

# 47. Final operating principles

1. **Lane first, score second.**  
   Emergency, normal, autonomous, maintenance, and human-led work are different operating modes.

2. **Criticality is a gate, not a weight.**  
   A critical security or data-integrity issue cannot be mathematically demoted below ordinary features.

3. **Value and autonomy are independent.**  
   The most important card may be the least suitable for autonomous execution.

4. **Problem risk and delivery risk are independent.**  
   Urgent work can still require cautious implementation.

5. **Small cards improve both visibility and autonomy.**  
   Different behavior, risk, verification, or execution profiles usually justify separate cards.

6. **A card is an outcome, not an implementation diary.**

7. **Nothing important should remain hidden at checklist item 28.**  
   The current reason a card is unfinished belongs at the top.

8. **Verification is part of the card, not an afterthought.**

9. **Long observation periods should normally become separate cards.**

10. **Scores rank eligible work; they do not make work eligible.**

11. **Confidence prevents hypotheses from masquerading as validated opportunities.**

12. **Maintenance reduction deserves explicit value.**  
    It should not have to impersonate user-facing impact to compete for attention.

13. **Foundational work deserves explicit unlock value.**

14. **Agents should optimize inside policy boundaries, not optimize around them.**

15. **Human judgment should concentrate on product semantics, architecture, irreversible changes, and sensitive surfaces.**

16. **Autonomous capacity should preferentially consume bounded, testable, reversible, debt-reducing work.**

17. **Manual overrides are legitimate but must remain explicit, reasoned, and preferably temporary.**

18. **The framework should remain simpler than the project it manages.**  
    Remove dimensions that fail to change real decisions.
