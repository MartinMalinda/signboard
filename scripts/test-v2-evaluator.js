const assert = require('assert');
const { evaluate, compareSectionItems } = require('../shared/v2Evaluator');

function completeCard(overrides = {}) {
  return {
    id: 'card-1',
    kind: 'task',
    status: 'ready',
    priority_class: 'P2',
    opportunity: { reach: 3, benefit: 3, frequency: 3 },
    risk_prevented: { likelihood: 1, harm: 1, blast_radius: 1 },
    modifiers: { confidence: 5, urgency: 3, maintenance_delta: 1 },
    estimate: { effort_points: 2 },
    delivery: { regression_likelihood: 1, change_blast_radius: 1, reversibility: 5 },
    ...overrides,
  };
}

const complete = evaluate(completeCard());
assert.strictEqual(complete.score_version, 2);
assert(complete.scores.priority_index > 0);
assert(complete.scores.risk_reduction_index > 0);
assert(complete.scores.impact_index > 0);
assert(!Object.hasOwn(complete.scores, 'discovery'));
assert.strictEqual(complete.scores.risk_reduction, 0.8);
assert.strictEqual(complete.score_ranges.impact_index.max, 100);
assert.strictEqual(complete.score_ranges.risk_reduction_index.max, 145);
assert.strictEqual(complete.explanations.impact_index.strategic_multiplier, undefined);
assert.strictEqual(complete.scores.impact_index, complete.explanations.impact_index.result);
assert(!Object.hasOwn(complete.scores, 'autonomy_score'));
assert(!Object.hasOwn(complete.scores, 'agent_pick_index'));
assert(!complete.sections.some((section) => section.name === 'agent_loops'));
assert(complete.sections.find((section) => section.name === 'priority').included);

const p3 = evaluate(completeCard({ priority_class: 'P3' }));
assert.strictEqual(p3.scores.priority_index, complete.scores.priority_index);
assert.strictEqual(p3.sections[0].tie_break_inputs.id, 'card-1');

const blocked = evaluate(completeCard({ status: 'blocked' }));
assert.strictEqual(blocked.gates.eligible, false);
assert(blocked.sections.find((section) => section.name === 'blocked').included);
assert(blocked.gates.reason_codes.includes('STATUS_BLOCKED'));

const sparse = evaluate({ id: 'sparse', kind: 'task', status: 'ready', priority_class: 'P2' });
assert.strictEqual(sparse.scores.priority_index, null);
assert.strictEqual(sparse.gates.eligible, true);
assert(sparse.missing_fields.length > 0);

const malformed = evaluate(completeCard({ kind: 'not-a-kind', priority_class: 'not-a-priority' }));
assert(malformed.warnings.includes('INVALID_PRIORITY'));
assert.strictEqual(malformed.gates.eligible, false);
assert(malformed.gates.reason_codes.includes('METADATA_GATE_FAILED'));

const riskHigh = evaluate(completeCard({
  id: 'risk-high',
  priority_class: 'P0',
  risk_prevented: { likelihood: 5, harm: 5, blast_radius: 5 },
}));
const riskLow = evaluate(completeCard({
  id: 'risk-low',
  priority_class: 'P0',
  risk_prevented: { likelihood: 1, harm: 1, blast_radius: 1 },
}));
assert(compareSectionItems(riskHigh, complete, 'priority') < 0);
assert(riskHigh.scores.risk_reduction_index > riskLow.scores.risk_reduction_index);

const impactSmall = evaluate(completeCard({ id: 'impact-small', estimate: { effort_points: 1 } }));
const impactLarge = evaluate(completeCard({ id: 'impact-large', estimate: { effort_points: 5 } }));
assert(impactSmall.scores.impact_index > impactLarge.scores.impact_index);
assert(impactSmall.scores.impact_index / impactLarge.scores.impact_index < impactSmall.scores.priority_index / impactLarge.scores.priority_index);

const lowHang = evaluate(completeCard({
  estimate: { effort_points: 3 },
  modifiers: { confidence: 4, urgency: 3, maintenance_delta: 0 },
  delivery: { regression_likelihood: 2, change_blast_radius: 2, reversibility: 4 },
}));
assert(lowHang.sections.find((section) => section.name === 'low_hanging_fruit').included);

console.log('V2 evaluator tests passed.');
