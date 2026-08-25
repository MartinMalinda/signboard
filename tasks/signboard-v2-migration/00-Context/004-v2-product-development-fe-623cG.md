---
title: V2 product-development feedback specification (source of truth)
historical: true
labels:
  - epic
  - discovery
  - dashboard
  - data-model
  - agent
  - ux
  - docs
createdAt: 2026-08-04T17:58:50.638Z
activity:
  - type: created
    at: 2026-08-04T17:58:50.638Z
signboard_v2:
  contract_version: 1
  kind: epic
  work_type: product
  priority_class: P2
  objective: Preserve the complete product-development feedback as the durable source of truth for V2 shaping, implementation, and review.
  scope: Keep the pasted feedback body verbatim; link all derived discovery, decision, implementation, and review cards to this epic without treating every observation as automatic implementation scope.
  acceptance_criteria:
    - The original feedback text remains intact in this epic body.
    - Derived cards reference this epic through signboard_v2.parent.
    - Product-policy decisions remain explicit and human-gated where the feedback is ambiguous or significant.
    - Implementation cards preserve evidence, verification, and follow-up context when they move between stages.
  verification: Audit the board for parent links, compare derived cards against this source body, and confirm review/Ready holds retain their rationale.
  status_summary: Source-of-truth epic created from the user-provided feedback attachment.
  next_action: Link feedback-derived cards and use this epic as the context anchor for future work.
  estimate:
    effort_points: 13
---
This already feels like a real product-development layer rather than “Kanban with extra metadata.” The strongest idea is visible in the dashboard: the same cards become different decision views rather than belonging to only one category. A card appearing in Priority, Impact, and potentially Agent-ready is correct—the sections are lenses, not buckets.

The score-breakdown popover is especially valuable. It makes the ranking inspectable instead of presenting an unexplained AI-generated number.

I would pause adding more dashboard sections briefly and tighten the following conceptual seams first.

1. “Impact” is currently not really impact

The current Impact score appears to be something approximately like:

Core Value
× Confidence
× Strategic Fit
÷ Effort ^ 0.20

For the throughput card:

67.2 × 1.00 × 1.10 ÷ 8^0.20 ≈ 48.8

That is a reasonable score, but it is an effort-adjusted leverage score, not pure impact.

The distinctions should ideally be:

Core value
    Raw combined opportunity / risk reduction / engineering health /
    enablement.

Expected strategic impact
    Core value × confidence × strategic fit.

Priority index
    Expected strategic impact
    × urgency
    × maintenance modifier
    ÷ effort^0.60.

Quick-win index
    Priority index combined with low effort, confidence,
    reversibility, and verification.

Agent-pick index
    Priority index combined with autonomy suitability.

That gives each dashboard section a distinct question:

High impact: Which outcomes matter most, regardless of size?
Priority / Next up: What should we work on next?
Low-hanging fruit: What valuable work is unusually cheap and safe?
Agent-ready: What can an autonomous agent execute safely?
Engineering health: What most improves the codebase?

There are two coherent options for the existing Impact section:

Keep the name Impact and remove the effort factor.
Keep the existing formula and rename it to Leverage, Best investments, or Value efficiency.

I slightly prefer keeping a true High Impact section. Large strategically important work should remain visible somewhere even when it is not a quick or efficient investment.

2. There is a concrete score-breakdown bug

The first popover displays:

67.2 × 1.00 × 1.00 ÷ 1.52

but reports:

48.8

The displayed expression evaluates to approximately 44.2, not 48.8.

The 48.8 result makes sense when Strategic Fit is actually ×1.10, which matches the card’s strategic_fit: 4:

67.2 × 1.00 × 1.10 ÷ 1.52 ≈ 48.6–48.8

The Raw-Event card shows the same pattern:

66.5 × 1.10 ÷ 1.52 ≈ 48.2

The five-point example is internally consistent because its strategic-fit multiplier appears to be 1.00:

64.3 ÷ 1.38 ≈ 46.6

So the computation is probably correct and the explanation is stale or using the wrong multiplier lookup.

The durable technical solution is to have the score engine return both:

result
explanation terms

The UI should render the exact expression returned by the calculator rather than independently reconstructing the explanation. The same structured explanation can later power:

Score popovers.
“Why this card appears here.”
Agent eligibility explanations.
Audit logs.
Formula-version debugging.
3. Stage names can remain configurable, but they need semantic roles

The screenshots reveal the exact boundary needed between generic boards and product-development behavior.

The project uses custom stages:

Exploration
Backlog
To do
Ongoing
Staging
Done

That is good. They should not be globally hardcoded.

However, the score engine and autonomous queue need to know things such as:

Is this card ready to start?
Is it already in progress?
Is it under review?
Is it terminal?
Does it count toward WIP?
May an agent claim it?

Therefore, each list should have a configurable semantic role:

Exploration → shaping
Backlog     → backlog
To do       → ready
Ongoing     → active
Staging     → review
Done        → terminal

Other projects could map different names to the same roles.

The same card currently appears as Review on the dashboard but Staging in the editor. That may already be this distinction, but the relationship is not obvious. Either consistently show the stage name, or show both deliberately:

Review · Staging

The important implementation rule is:

Never infer semantics by comparing the list name to literal strings such as "To do" or "Staging".

Dashboard filters, status tie-breakers, WIP statistics, and agent eligibility should use the configured semantic role.

blocked is probably better treated as an orthogonal condition rather than necessarily requiring a dedicated stage. A card can be blocked while conceptually remaining in shaping, ready, or active.

4. Decide whether P1 means “important” or “mandatory” now

The framework defined:

P0 — immediate emergency
P1 — mandatory urgent work
P2 — normal ranked work
P3 — deliberately parked

The current board appears to use P1 more like conventional “high priority.” Several performance and metric-computation plans are P1 alongside authorization and security work.

That will weaken the entire gating model. If most important work is P1:

The Critical view becomes noisy.
Ordinary prioritization is bypassed.
P1 no longer communicates mandatory intervention.
Risk-sensitive work competes with normal work through generic tie-breakers.

I would reserve P0/P1 quite aggressively and make their meanings visible in the UI:

P0 · Emergency
P1 · Mandatory
P2 · Ranked
P3 · Parked

Ordinary valuable work—including major features—should generally remain P2 and rise through its index.

The current Priority tooltip says ranking uses priority, score, and status tie-breakers. That is fine for P2. For P0/P1, ordering should use the dedicated critical/risk index rather than allowing a generic status tie-breaker to push a severe authorization problem below routine active work.

A conditional Critical section should be first on the dashboard whenever it contains cards. It can disappear completely when empty.

5. Replace the three agent booleans with one understandable policy

These controls are logically hierarchical:

Do not auto-run
Block autonomous execution
Block agent execution

Showing all three checkboxes simultaneously creates combinations that are technically possible but difficult to reason about. When all three are checked, only the strongest restriction matters.

The stored fields can remain separate if useful, but the UI should expose a single execution ceiling:

Agent execution

- Human only
- Analysis and planning only
- Supervised implementation
- Autonomous pull request
- Autonomous merge where repository policy permits

Then have a separate queue control:

Allow automatic background selection

This maps much more cleanly:

Human only implies agent execution blocked.
Analysis only allows investigation but not implementation.
Supervised implementation blocks autonomous execution.
Autonomous pull request allows A3 behavior.
Autonomous merge allows A4 only under repository policy.
Background selection determines whether an otherwise eligible card may be picked automatically.

The UI should also display:

Computed recommendation: A1 — analysis only

Limiting reasons:
- Specification clarity: 2
- Behavior surface: 3
- Data sensitivity: 4
- Explicit human-only override

That is more actionable than three checkboxes.

6. The scoring editor needs applicability and calibration states

The full form currently presents many raw numeric inputs at once. Structurally it works, but it will become tiring and error-prone.

The biggest data-model issue is distinguishing:

Unscored
Not applicable
Scored as zero

Blank Risk Prevented fields on a performance card probably mean “not applicable.” Blank Risk Prevented fields on a security card should mean “incomplete card.” Those cannot safely be treated as the same state.

Each scoring group should have an explicit state:

Opportunity
- Unscored
- Not applicable
- Scored

Risk prevented
- Unscored
- Not applicable
- Scored

Work type can drive validation without automatically inventing values:

Security, privacy, correctness, data integrity → normally require Risk Prevented.
Product and UX → normally require Opportunity.
Engineering health and technical debt → normally require Engineering Health.
Enablement → normally require linked downstream cards.

The work type should suggest the relevant groups, not auto-populate generic midpoint values.

For the actual 1–5 controls, small segmented selectors would be more usable than unrestricted number fields:

Reach
[1] [2] [3] [4] [5]

4 — Most active or relevant users

The anchor definition should appear directly below or on hover. Otherwise 4 becomes arbitrary very quickly.

I would also collapse groups that are not applicable. A performance task might initially show:

Opportunity
Engineering health
Delivery
Execution

with an “Add value dimension” action for Enablement, Risk Prevented, or Discovery.

7. The dashboard should be generic lenses over hardcoded signals

The product boundary is now fairly clear.

Hardcoded product-development primitives

These are worth implementing as first-class behavior:

Card kind.
Work type.
Priority class.
Effort.
Dependencies.
Value-dimension inputs.
Delivery-risk inputs.
Execution/autonomy inputs.
Formula versions.
Computed indexes.
Eligibility explanations.
Board-configurable behavior

These should remain generic:

Stage names and order.
Stage semantic-role mapping.
Dashboard section order.
Section visibility.
Thresholds.
Number of visible cards.
Empty-section behavior.
Labels and custom metadata.
Which computed signals appear on card previews.

A dashboard section can conceptually be:

Filter
+ ranking signal
+ sort rules
+ card projection
+ limit
+ explanation

The built-in product-development profile can create:

Critical
In flight
Next up
High impact
Low-hanging fruit
Agent-ready
Engineering health
Blocked
Needs shaping

But they should ideally all use one generic section renderer and query mechanism.

The current reuse of the same card component across Priority and Impact is exactly the right direction.

8. Improve the computed-signals area

The current bottom section:

Computed signals
Impact
section impact
View in Dashboard

does not yet communicate much.

It could become one of the strongest parts of the card:

Dashboard membership

Priority
#2 · P1 gate · Priority index 24.7

High impact
#1 · Impact score 73.9

Low-hanging fruit
Excluded · Effort is 8 points

Agent-ready
Excluded · Agent execution is blocked

Engineering health
#4 · Engineering-health score 60

This directly answers:

Why am I seeing—or not seeing—this card in each section?

It would also make the formula framework much easier to trust.

9. Smaller UI observations

The broad visual direction is good: strong hierarchy, restrained colors, and the cards read as decision objects rather than generic notes.

A few refinements:

The dashboard cards could be more compact. At the current density, only a few cards fit in each section.
Show section-specific score labels such as Impact 49 or Priority 25; the unlabeled bar-chart number is too opaque.
Rename High Damage to Severe Harm, and Wide Impact to Wide Blast Radius. “Impact” is already overloaded.
Anchor the score popover directly to the score badge. Its current placement can cover adjacent sections.
Put section-definition help on an info icon in the section header. The black Priority tooltip currently obscures the card title.
The floating bottom navigation overlaps content; reserve bottom padding equal to its height.
The card header duplicates metadata in the “V2 WORK” summary and editable property toolbar. One compact sticky property row should probably replace both.
The structured fields would work better in a right-hand inspector, with the Markdown body remaining visible on the left.
Depends on and Blocked by need exact semantics. Prefer deriving unresolved blockers from hard dependencies and reserving explicit blocker input for external conditions.
Native browser select menus are visually inconsistent with the rest of the UI, though that is low priority.
Disable spellcheck on card titles or otherwise avoid the red underline under “Changelog.”
Recommended immediate order
Fix the score explanation discrepancy and generate explanations from the score engine.
Define the exact meanings of Impact, Priority, and P0–P3.
Formalize configurable stage roles.
Replace the three agent booleans with an execution-policy control.
Add unscored versus not applicable handling.
Turn dashboard sections into configurable lenses.
Improve the editor density and computed-membership explanation.
Then add more dashboard sections and statistics.

The core concept is working. The main risk now is not visual—it is allowing similar-sounding concepts such as impact, priority, stage, status, blocking, and autonomy to remain slightly ambiguous until they become difficult to change.
