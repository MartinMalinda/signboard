const assert = require('assert');
const { evaluate, compareSectionItems } = require('../shared/v2Evaluator');

function completeCard(overrides = {}) {
  return {
    id: 'card-1',
    kind: 'task',
    work_type: 'product',
    status: 'ready',
    priority_class: 'P2',
    opportunity: { reach: 3, benefit: 3, frequency: 3 },
    risk_prevented: { likelihood: 1, harm: 1, blast_radius: 1, mitigation_effectiveness: 1, credible_tail: false },
    engineering_health: { maintenance_reduction: 4, complexity_reduction: 4, reliability_testability: 4, recurring_time_saved: 4 },
    enablement: { downstream_value: 2, downstream_breadth: 2, critical_path: 2 },
    discovery_value: { uncertainty_reduction: 2, decision_importance: 2, cost_of_wrong_choice: 2 },
    modifiers: { confidence: 5, strategic_fit: 4, urgency: 3, maintenance_delta: 1 },
    estimate: { effort_points: 2, coordination_complexity: 1 },
    delivery: { regression_likelihood: 1, change_blast_radius: 1, reversibility: 5, behavior_surface: 1, data_sensitivity: 1 },
    execution: { specification_clarity: 5, verification_strength: 5, boundedness: 5, isolation: 5, agent_execution_blocked: false, autonomous_execution_blocked: false, do_not_autorun: false },
    eligibility: { readiness: true, dependencies: true, date_window: true, scope: true, claim_available: true, protected_surface_clear: true, mode: 'general' },
    ...overrides,
  };
}

const complete = evaluate(completeCard());
assert.strictEqual(complete.score_version, 1);
assert(complete.scores.priority_index > 0);
assert(complete.scores.critical_index > 0);
assert(complete.scores.autonomy_score > 0);
assert(complete.sections.find((section) => section.name === 'agent_loops').included);
assert.strictEqual(complete.scores.quick_win_index, null);
assert(complete.warnings.includes('FORMULA_DEFERRED:quick_win_index'));
assert.strictEqual(complete.scores.human_leverage_index, null);
assert(complete.warnings.includes('FORMULA_DEFERRED:human_leverage_index'));
assert.strictEqual(complete.classes.autonomy, 'A3');

const critical = evaluate(completeCard({ priority_class: 'P1' }));
assert(critical.sections.find((section) => section.name === 'critical').included);
assert(critical.scores.autonomy_score <= 74);
assert(critical.gates.reason_codes.includes('PRIORITY_AUTONOMY_CAP'));
assert.strictEqual(critical.sections[0].tie_break_inputs.id, 'card-1');

const blocked = evaluate(completeCard({ status: 'blocked', eligibility: { readiness: false, dependencies: false } }));
assert.strictEqual(blocked.gates.eligible, false);
assert(blocked.sections.find((section) => section.name === 'blocked').included);
assert(blocked.gates.reason_codes.includes('STATUS_BLOCKED'));

const sparse = evaluate({ id: 'sparse', status: 'ready', priority_class: 'P2' });
assert.strictEqual(sparse.scores.priority_index, null);
assert.strictEqual(sparse.scores.autonomy_score, 0);
assert.strictEqual(sparse.gates.eligible, false);
assert(sparse.missing_fields.length > 0);
assert(sparse.gates.reason_codes.includes('READINESS_FAILED'));
assert(sparse.gates.reason_codes.includes('DEPENDENCY_UNRESOLVED'));
assert(sparse.gates.reason_codes.includes('EXECUTION_POLICY_FAILED'));
assert(sparse.sections.find((section) => section.name === 'agent_loops').reason_codes.includes('AGENT_POLICY_FAILED'));

const agentBlocked = evaluate(completeCard({ execution: { ...completeCard().execution, agent_execution_blocked: true } }));
assert.strictEqual(agentBlocked.scores.autonomy_score, 0);

const autonomousCap = evaluate(completeCard({ execution: { ...completeCard().execution, autonomous_execution_blocked: true } }));
assert(autonomousCap.scores.autonomy_score <= 74);
assert(complete.sections.every((section) => section.tie_break_inputs.id === 'card-1'));

const malformedPolicy = evaluate(completeCard({ execution: { ...completeCard().execution, autonomous_execution_blocked: 'false' } }));
assert(malformedPolicy.warnings.includes('INVALID_BOOLEAN:execution.autonomous_execution_blocked'));
assert.strictEqual(malformedPolicy.gates.agent_eligible, false);

const malformedEligibility = evaluate(completeCard({ eligibility: { ...completeCard().eligibility, scope: 'true' } }));
assert(malformedEligibility.warnings.includes('INVALID_BOOLEAN:eligibility.scope'));
assert.strictEqual(malformedEligibility.gates.agent_eligible, false);

const unsafeSurface = evaluate(completeCard({ delivery: { ...completeCard().delivery, behavior_surface: 5 } }));
assert(unsafeSurface.scores.autonomy_score <= 74);
assert.strictEqual(unsafeSurface.sections.find((section) => section.name === 'agent_loops').included, false);

const criticalHigh = evaluate(completeCard({ id: 'critical-high', priority_class: 'P0', risk_prevented: { likelihood: 5, harm: 5, blast_radius: 5, mitigation_effectiveness: 5, credible_tail: true } }));
assert(compareSectionItems(criticalHigh, critical, 'critical') < 0);
const criticalSamePriority = evaluate(completeCard({ id: 'critical-low', priority_class: 'P0', risk_prevented: { likelihood: 1, harm: 1, blast_radius: 1, mitigation_effectiveness: 1, credible_tail: false } }));
assert(compareSectionItems(criticalHigh, criticalSamePriority, 'critical') < 0);

const incompatibleMode = evaluate(completeCard({ eligibility: { ...completeCard().eligibility, mode: 'human' } }));
assert.strictEqual(incompatibleMode.gates.agent_eligible, false);

const manualOverride = evaluate(completeCard({ manual_override: { execution_mode: 'human', reason: 'needs review' } }));
assert.strictEqual(manualOverride.gates.agent_eligible, false);
assert(manualOverride.scores.autonomy_score <= 74);

const sensitiveWork = evaluate(completeCard({ work_type: 'row_level_access' }));
assert.strictEqual(sensitiveWork.gates.agent_eligible, false);
assert(sensitiveWork.scores.autonomy_score <= 74);

const a4 = evaluate(completeCard({
  estimate: { effort_points: 2, coordination_complexity: 1 },
  delivery: { regression_likelihood: 1, change_blast_radius: 1, reversibility: 5, behavior_surface: 1, data_sensitivity: 1 },
  execution: { ...completeCard().execution, policy_autonomous_merge_allowed: true, rollback_straightforward: true, ci_deterministic: true, ci_comprehensive: true },
}));
assert.strictEqual(a4.classes.autonomy, 'A4');

console.log('V2 evaluator tests passed.');
