(function initializeV2Evaluator(root, factory) {
  const evaluator = factory();
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) {
    module.exports = evaluator;
  }
  if (root) {
    root.SignboardV2Evaluator = evaluator;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createV2Evaluator() {
  const SCORE_FIELDS = Object.freeze({
    opportunity: ['reach', 'benefit', 'frequency'],
    risk_prevented: ['likelihood', 'harm', 'blast_radius', 'mitigation_effectiveness'],
    engineering_health: ['maintenance_reduction', 'complexity_reduction', 'reliability_testability', 'recurring_time_saved'],
    enablement: ['downstream_value', 'downstream_breadth', 'critical_path'],
    discovery_value: ['uncertainty_reduction', 'decision_importance', 'cost_of_wrong_choice'],
  });
  const STATUS_VALUES = new Set(['inbox', 'shaping', 'ready', 'active', 'review', 'blocked', 'done', 'dropped']);
  const PRIORITY_VALUES = new Set(['P0', 'P1', 'P2', 'P3']);
  const KIND_VALUES = new Set(['epic', 'task', 'discovery', 'incident']);
  const SECTION_NAMES = Object.freeze(['priority', 'impact', 'low_hanging_fruit', 'agent_loops', 'blocked']);
  const CONFIDENCE_MULTIPLIER = Object.freeze({ 1: 0.45, 2: 0.60, 3: 0.75, 4: 0.90, 5: 1.00 });
  const STRATEGIC_MULTIPLIER = Object.freeze({ 1: 0.80, 2: 0.90, 3: 1.00, 4: 1.10, 5: 1.20 });
  const URGENCY_MULTIPLIER = Object.freeze({ 1: 0.90, 2: 1.00, 3: 1.10, 4: 1.25, 5: 1.45 });
  const MAINTENANCE_MULTIPLIER = Object.freeze({ '-2': 0.85, '-1': 0.93, 0: 1.00, 1: 1.07, 2: 1.15 });
  const AUTONOMY_HARD_GATE_WORK_TYPES = new Set([
    'security', 'privacy', 'compliance', 'billing', 'payments', 'authentication', 'authorization',
    'destructive_migration', 'production_data_deletion', 'public_api', 'api_contract',
    'major_ux', 'product_semantics', 'production_networking', 'security_infrastructure',
    'external_communication', 'financial_expenditure', 'permission_system', 'row_level_access',
    'cross_customer_data', 'secrets', 'encryption', 'key_handling', 'subjective_judgment', 'human_only',
  ]);
  const AGENT_EXECUTION_MODES = new Set(['general', 'autonomous']);
  const {
    DEFAULT_EXECUTION_CEILING,
    DEFAULT_BACKGROUND_SELECTION,
    EXECUTION_CEILING_VALUES,
    executionCeilingRank,
  } = typeof require === 'function'
    ? require('./v2ExecutionPolicy')
    : root.SignboardV2ExecutionPolicy;

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function getPath(source, path) {
    return path.reduce((value, key) => (isObject(value) ? value[key] : undefined), source);
  }

  function normalizeScore(value, path, missingFields, defaultsApplied, warnings) {
    if (typeof value === 'undefined') {
      missingFields.push(path);
      defaultsApplied[path] = 0;
      return 0;
    }
    if (Number.isInteger(value) && value >= 0 && value <= 5) {
      return value;
    }
    warnings.push(`INVALID_SCORE:${path}`);
    defaultsApplied[path] = 0;
    return 0;
  }

  function normalizeGroup(source, groupName, missingFields, defaultsApplied, warnings) {
    const group = isObject(source[groupName]) ? source[groupName] : {};
    const normalized = {};
    for (const field of SCORE_FIELDS[groupName]) {
      normalized[field] = normalizeScore(group[field], `${groupName}.${field}`, missingFields, defaultsApplied, warnings);
    }
    return normalized;
  }

  function normalizeModifier(source, field, fallback, missingFields, defaultsApplied, warnings) {
    const value = source.modifiers && source.modifiers[field];
    if (typeof value === 'undefined') {
      missingFields.push(`modifiers.${field}`);
      defaultsApplied[`modifiers.${field}`] = fallback;
      return fallback;
    }
    const valid = field === 'maintenance_delta'
      ? Number.isInteger(value) && value >= -2 && value <= 2
      : Number.isInteger(value) && value >= 1 && value <= 5;
    if (valid) {
      return value;
    }
    warnings.push(`INVALID_MODIFIER:modifiers.${field}`);
    defaultsApplied[`modifiers.${field}`] = fallback;
    return fallback;
  }

  function normalizeBoolean(source, groupName, field, fallback, missingFields, defaultsApplied, warnings) {
    const group = isObject(source[groupName]) ? source[groupName] : {};
    const value = group[field];
    if (typeof value === 'undefined') {
      missingFields.push(`${groupName}.${field}`);
      defaultsApplied[`${groupName}.${field}`] = fallback;
      return fallback;
    }
    if (typeof value !== 'boolean') {
      warnings.push(`INVALID_BOOLEAN:${groupName}.${field}`);
      defaultsApplied[`${groupName}.${field}`] = fallback;
      return fallback;
    }
    return value;
  }

  function normalizeExecutionPolicy(execution, missingFields, defaultsApplied, warnings) {
    const ceiling = execution.ceiling;
    let normalizedCeiling = DEFAULT_EXECUTION_CEILING;
    if (typeof ceiling === 'undefined') {
      missingFields.push('execution.ceiling');
      defaultsApplied['execution.ceiling'] = DEFAULT_EXECUTION_CEILING;
    } else if (typeof ceiling !== 'string' || !EXECUTION_CEILING_VALUES.has(ceiling.trim().toLowerCase())) {
      warnings.push('INVALID_EXECUTION_CEILING:execution.ceiling');
      defaultsApplied['execution.ceiling'] = DEFAULT_EXECUTION_CEILING;
    } else {
      normalizedCeiling = ceiling.trim().toLowerCase();
    }

    const backgroundSelection = execution.background_selection;
    let normalizedBackgroundSelection = DEFAULT_BACKGROUND_SELECTION;
    if (typeof backgroundSelection === 'undefined') {
      missingFields.push('execution.background_selection');
      defaultsApplied['execution.background_selection'] = DEFAULT_BACKGROUND_SELECTION;
    } else if (typeof backgroundSelection !== 'boolean') {
      warnings.push('INVALID_BOOLEAN:execution.background_selection');
      defaultsApplied['execution.background_selection'] = DEFAULT_BACKGROUND_SELECTION;
    } else {
      normalizedBackgroundSelection = backgroundSelection;
    }

    return { ceiling: normalizedCeiling, background_selection: normalizedBackgroundSelection };
  }

  function normalizeInput(input = {}) {
    const source = isObject(input) ? input : {};
    const missingFields = [];
    const defaultsApplied = {};
    const warnings = [];
    const id = typeof source.id === 'string' ? source.id : '';
    if (!id) {
      missingFields.push('id');
      defaultsApplied.id = '';
      warnings.push('MISSING_ID');
    }
    const workType = typeof source.work_type === 'string' ? source.work_type.trim().toLowerCase() : '';
    if (!workType) {
      missingFields.push('work_type');
      defaultsApplied.work_type = '';
      warnings.push('MISSING_WORK_TYPE');
    }
    const priority = typeof source.priority_class === 'string' && PRIORITY_VALUES.has(source.priority_class)
      ? source.priority_class
      : null;
    const status = typeof source.status === 'string' && STATUS_VALUES.has(source.status) ? source.status : null;

    if (!priority) warnings.push('INVALID_PRIORITY');
    if (!status) warnings.push('INVALID_STATUS');

    const effort = source.estimate && source.estimate.effort_points;
    const effortPoints = Number.isFinite(effort) && effort > 0 ? Number(effort) : null;
    if (effortPoints === null) {
      missingFields.push('estimate.effort_points');
      defaultsApplied['estimate.effort_points'] = null;
    }

    const delivery = isObject(source.delivery) ? source.delivery : {};
    const execution = isObject(source.execution) ? source.execution : {};
    const manualOverride = isObject(source.manual_override)
      ? Object.values(source.manual_override).some((value) => value !== null && value !== '' && !(Array.isArray(value) && value.length === 0))
      : source.manual_override === true;
    const normalized = {
      id,
      work_type: workType,
      kind: typeof source.kind === 'string' ? source.kind : '',
      status,
      priority_class: priority,
      opportunity: normalizeGroup(source, 'opportunity', missingFields, defaultsApplied, warnings),
      risk_prevented: normalizeGroup(source, 'risk_prevented', missingFields, defaultsApplied, warnings),
      engineering_health: normalizeGroup(source, 'engineering_health', missingFields, defaultsApplied, warnings),
      enablement: normalizeGroup(source, 'enablement', missingFields, defaultsApplied, warnings),
      discovery_value: normalizeGroup(source, 'discovery_value', missingFields, defaultsApplied, warnings),
      credible_tail: source.risk_prevented && source.risk_prevented.credible_tail === true,
      modifiers: {
        confidence: normalizeModifier(source, 'confidence', 1, missingFields, defaultsApplied, warnings),
        strategic_fit: normalizeModifier(source, 'strategic_fit', 1, missingFields, defaultsApplied, warnings),
        urgency: normalizeModifier(source, 'urgency', 1, missingFields, defaultsApplied, warnings),
        maintenance_delta: normalizeModifier(source, 'maintenance_delta', -2, missingFields, defaultsApplied, warnings),
      },
      estimate: {
        effort_points: effortPoints,
        coordination_complexity: normalizeScore(source.estimate && source.estimate.coordination_complexity, 'estimate.coordination_complexity', missingFields, defaultsApplied, warnings),
      },
      delivery: {
        regression_likelihood: normalizeScore(delivery.regression_likelihood, 'delivery.regression_likelihood', missingFields, defaultsApplied, warnings),
        change_blast_radius: normalizeScore(delivery.change_blast_radius, 'delivery.change_blast_radius', missingFields, defaultsApplied, warnings),
        reversibility: normalizeScore(delivery.reversibility, 'delivery.reversibility', missingFields, defaultsApplied, warnings),
        behavior_surface: normalizeScore(delivery.behavior_surface, 'delivery.behavior_surface', missingFields, defaultsApplied, warnings),
        data_sensitivity: normalizeScore(delivery.data_sensitivity, 'delivery.data_sensitivity', missingFields, defaultsApplied, warnings),
      },
      execution: {
        specification_clarity: normalizeScore(execution.specification_clarity, 'execution.specification_clarity', missingFields, defaultsApplied, warnings),
        verification_strength: normalizeScore(execution.verification_strength, 'execution.verification_strength', missingFields, defaultsApplied, warnings),
        boundedness: normalizeScore(execution.boundedness, 'execution.boundedness', missingFields, defaultsApplied, warnings),
        isolation: normalizeScore(execution.isolation, 'execution.isolation', missingFields, defaultsApplied, warnings),
        ...normalizeExecutionPolicy(execution, missingFields, defaultsApplied, warnings),
        rollback_straightforward: normalizeBoolean(source, 'execution', 'rollback_straightforward', false, missingFields, defaultsApplied, warnings),
        ci_deterministic: normalizeBoolean(source, 'execution', 'ci_deterministic', false, missingFields, defaultsApplied, warnings),
        ci_comprehensive: normalizeBoolean(source, 'execution', 'ci_comprehensive', false, missingFields, defaultsApplied, warnings),
        manual_override: manualOverride,
      },
      eligibility: {},
    };

    const eligibility = isObject(source.eligibility) ? source.eligibility : {};
    for (const field of ['readiness', 'dependencies', 'date_window', 'scope', 'claim_available', 'protected_surface_clear']) {
      if (typeof eligibility[field] === 'undefined') {
        normalized.eligibility[field] = false;
        missingFields.push(`eligibility.${field}`);
        defaultsApplied[`eligibility.${field}`] = false;
      } else if (typeof eligibility[field] !== 'boolean') {
        normalized.eligibility[field] = false;
        warnings.push(`INVALID_BOOLEAN:eligibility.${field}`);
        defaultsApplied[`eligibility.${field}`] = false;
      } else {
        normalized.eligibility[field] = eligibility[field];
      }
    }
    normalized.eligibility.mode = typeof eligibility.mode === 'string' ? eligibility.mode : 'general';
    return { normalized, missingFields, defaultsApplied, warnings };
  }

  function opportunityScore(card) {
    const { reach, benefit, frequency } = card.opportunity;
    if (!reach || !benefit || !frequency) return 0;
    return 100 * (reach / 5) * (benefit / 5) * (0.5 + 0.1 * frequency);
  }

  function riskReductionScore(card) {
    const { likelihood, harm, blast_radius: blastRadius, mitigation_effectiveness: mitigation } = card.risk_prevented;
    if (!likelihood || !harm || !blastRadius || !mitigation) return 0;
    const expectedRisk = 100 * (likelihood / 5) * (harm / 5) * (blastRadius / 5);
    let tailFloor = 0;
    if (card.credible_tail) {
      if (harm === 5 && blastRadius === 5) tailFloor = 70;
      else if (Math.max(harm, blastRadius) === 5 && Math.min(harm, blastRadius) >= 4) tailFloor = 55;
      else if (harm >= 4 && blastRadius >= 4) tailFloor = 40;
    }
    return Math.max(expectedRisk, tailFloor) * (mitigation / 5);
  }

  function engineeringHealthScore(card) {
    const values = card.engineering_health;
    return 20 * (0.35 * values.maintenance_reduction + 0.25 * values.complexity_reduction + 0.25 * values.reliability_testability + 0.15 * values.recurring_time_saved);
  }

  function enablementScore(card) {
    const values = card.enablement;
    return 20 * (0.50 * values.downstream_value + 0.20 * values.downstream_breadth + 0.30 * values.critical_path);
  }

  function discoveryScore(card) {
    const values = card.discovery_value;
    return 20 * (0.40 * values.uncertainty_reduction + 0.35 * values.decision_importance + 0.25 * values.cost_of_wrong_choice);
  }

  function positiveImpactScore(values) {
    return coreValue([
      values.opportunity,
      values.engineering_health,
      values.enablement,
      values.discovery,
    ]);
  }

  function coreValue(scores) {
    const dominant = Math.max(...scores);
    const remaining = scores.reduce((sum, score) => sum + score, 0) - dominant;
    return Math.min(100, dominant + Math.min(20, 0.15 * remaining));
  }

  function deliveryRisk(card) {
    const { regression_likelihood: regression, change_blast_radius: blastRadius, reversibility } = card.delivery;
    if (!regression || !blastRadius || !reversibility) return null;
    return Math.min(100, 4 * regression * blastRadius * (1.2 - 0.2 * reversibility));
  }

  function geometricMean(values) {
    return Math.pow(values.reduce((result, value) => result * value, 1), 1 / values.length);
  }

  function autonomyScore(card) {
    const ceilingRank = executionCeilingRank(card.execution.ceiling);
    if (ceilingRank === 0) return 0;
    const required = [
      card.execution.specification_clarity,
      card.execution.verification_strength,
      card.delivery.reversibility,
      card.execution.boundedness,
      card.execution.isolation,
    ];
    if (required.some((value) => value === 0)) return 0;
    const base = 100 * geometricMean(required.map((value) => value / 5));
    const penalty = 6 * (card.delivery.regression_likelihood - 1) + 6 * (card.delivery.behavior_surface - 1) + 8 * (card.delivery.data_sensitivity - 1) + 4 * (card.estimate.coordination_complexity - 1);
    const calculated = Math.max(0, Math.min(100, base - penalty));
    const hardGate = ceilingRank < 3 ||
      card.priority_class === 'P0' || card.priority_class === 'P1' ||
      card.delivery.behavior_surface >= 4 || card.delivery.data_sensitivity >= 4 ||
      card.delivery.reversibility < 3 || AUTONOMY_HARD_GATE_WORK_TYPES.has(card.work_type) ||
      card.execution.manual_override;
    const ceilingCap = [0, 54, 74, 89, 100][ceilingRank] ?? 0;
    return Math.min(calculated, hardGate ? Math.min(ceilingCap, 74) : ceilingCap);
  }

  function priorityIndex(card, core) {
    if (!card.priority_class || !card.estimate.effort_points) return null;
    const confidence = CONFIDENCE_MULTIPLIER[card.modifiers.confidence];
    const strategic = card.priority_class === 'P0' || card.priority_class === 'P1' ? 1 : STRATEGIC_MULTIPLIER[card.modifiers.strategic_fit];
    const urgency = URGENCY_MULTIPLIER[card.modifiers.urgency];
    const maintenance = card.priority_class === 'P0' || card.priority_class === 'P1' ? 1 : MAINTENANCE_MULTIPLIER[card.modifiers.maintenance_delta];
    return (core * confidence * strategic * urgency * maintenance) / Math.pow(card.estimate.effort_points, 0.60);
  }

  function riskReductionIndex(card, riskReduction) {
    if (!card.estimate.effort_points) return null;
    return (riskReduction * URGENCY_MULTIPLIER[card.modifiers.urgency] * CONFIDENCE_MULTIPLIER[card.modifiers.confidence]) /
      Math.pow(card.estimate.effort_points, 0.15);
  }

  function impactExplanation(card, positiveImpact) {
    const effortPoints = card.estimate.effort_points;
    if (!effortPoints || positiveImpact <= 0) return null;
    const confidenceMultiplier = CONFIDENCE_MULTIPLIER[card.modifiers.confidence];
    const strategicMultiplier = card.priority_class === 'P0' || card.priority_class === 'P1'
      ? 1
      : STRATEGIC_MULTIPLIER[card.modifiers.strategic_fit];
    const effortFactor = Math.pow(effortPoints, 0.20);
    return {
      positive_impact: positiveImpact,
      confidence_multiplier: confidenceMultiplier,
      strategic_multiplier: strategicMultiplier,
      effort_points: effortPoints,
      effort_factor: effortFactor,
      result: (positiveImpact * strategicMultiplier * confidenceMultiplier) / effortFactor,
    };
  }

  function reasonSet(card, autonomy, gates) {
    const reasons = [];
    if (!card.priority_class) reasons.push('PRIORITY_INVALID');
    if (!KIND_VALUES.has(card.kind) || !card.work_type) reasons.push('METADATA_INVALID');
    if (gates.metadata !== 'pass') reasons.push('METADATA_GATE_FAILED');
    if (!card.status) reasons.push('STATUS_INVALID');
    if (gates.readiness !== 'pass') reasons.push('READINESS_FAILED');
    if (gates.dependencies !== 'pass') reasons.push('DEPENDENCY_UNRESOLVED');
    if (gates.execution_policy !== 'pass') reasons.push('EXECUTION_POLICY_FAILED');
    if (executionCeilingRank(card.execution.ceiling) < 3) reasons.push('EXECUTION_CEILING_RESTRICTED');
    if (!card.execution.background_selection) reasons.push('BACKGROUND_SELECTION_DISABLED');
    if (card.status === 'blocked') reasons.push('STATUS_BLOCKED');
    if (autonomy < 60) reasons.push('AUTONOMY_LOW');
    if (card.priority_class === 'P0' || card.priority_class === 'P1') reasons.push('PRIORITY_AUTONOMY_CAP');
    return [...new Set(reasons)];
  }

  function sectionScore(name, values) {
    if (name === 'agent_loops') return values.agent_pick_index;
    if (name === 'impact') return values.impact_index;
    return values.priority_index;
  }

  function sectionTieBreakInputs(card, name, values) {
    const priorityRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const statusRank = { ready: 0, active: 1, review: 2, shaping: 3, inbox: 4, blocked: 5, done: 6, dropped: 7 };
    return {
      priority_rank: priorityRank[card.priority_class] ?? 4,
      status_rank: statusRank[card.status] ?? 8,
      score: sectionScore(name, values),
      id: card.id,
    };
  }

  function compareSectionItems(left, right, name = 'priority') {
    const leftSection = left.sections.find((section) => section.name === name);
    const rightSection = right.sections.find((section) => section.name === name);
    if (leftSection.included !== rightSection.included) return leftSection.included ? -1 : 1;
    const leftKey = leftSection.tie_break_inputs;
    const rightKey = rightSection.tie_break_inputs;
    const leftScore = leftKey.score ?? -Infinity;
    const rightScore = rightKey.score ?? -Infinity;
    if (name === 'impact') {
      if (leftScore !== rightScore) return rightScore - leftScore;
      if (leftKey.status_rank !== rightKey.status_rank) return leftKey.status_rank - rightKey.status_rank;
      if (leftKey.priority_rank !== rightKey.priority_rank) return leftKey.priority_rank - rightKey.priority_rank;
    } else {
      if (leftKey.priority_rank !== rightKey.priority_rank) return leftKey.priority_rank - rightKey.priority_rank;
      if (leftScore !== rightScore) return rightScore - leftScore;
      if (leftKey.status_rank !== rightKey.status_rank) return leftKey.status_rank - rightKey.status_rank;
    }
    return String(leftKey.id).localeCompare(String(rightKey.id));
  }

  function sectionReasonCodes(name, included, card, gates, values) {
    if (included) return [`SECTION_${name.toUpperCase()}`];
    const reasons = [];
    const nonTerminal = !['done', 'dropped'].includes(card.status);
    const executableKind = card.kind !== 'epic';
    if (!nonTerminal) reasons.push('STATUS_TERMINAL');
    if (!executableKind) reasons.push('KIND_NOT_EXECUTABLE');
    if (name === 'priority' || name === 'low_hanging_fruit') {
      if (gates.eligible !== true) reasons.push(...gates.reason_codes.filter((reason) => reason !== 'AUTONOMY_LOW'));
      if (!['ready', 'active', 'review'].includes(card.status)) reasons.push('STATUS_NOT_PLANNABLE');
    }
    if (name === 'low_hanging_fruit') {
      if (card.estimate.effort_points === null || card.estimate.effort_points > 3) reasons.push('EFFORT_TOO_LARGE');
      if (card.modifiers.confidence < 4) reasons.push('CONFIDENCE_LOW');
      if (card.execution.verification_strength < 4) reasons.push('VERIFICATION_WEAK');
      if (card.delivery.reversibility < 4) reasons.push('REVERSIBILITY_LOW');
    }
    if (name === 'agent_loops') {
      if (card.status !== 'ready') reasons.push('STATUS_NOT_READY');
      if (card.priority_class !== 'P2') reasons.push('PRIORITY_NOT_AGENT_QUEUE');
      if (values.autonomy_score < 75) reasons.push('AUTONOMY_BELOW_A3');
      if (!gates.agent_eligible) reasons.push('AGENT_POLICY_FAILED');
    }
    if (name === 'blocked' && card.status !== 'blocked') reasons.push('STATUS_NOT_BLOCKED');
    return [...new Set(reasons.length ? reasons : ['SECTION_INELIGIBLE'])];
  }

  function autonomyClass(score, a4Eligible) {
    if (score >= 90 && a4Eligible) return 'A4';
    if (score >= 75) return 'A3';
    if (score >= 55) return 'A2';
    if (score > 0) return 'A1';
    return 'A0';
  }

  function evaluate(input = {}) {
    const normalizedResult = normalizeInput(input);
    const card = normalizedResult.normalized;
    const values = {
      opportunity: opportunityScore(card),
      risk_reduction: riskReductionScore(card),
      engineering_health: engineeringHealthScore(card),
      enablement: enablementScore(card),
      discovery: discoveryScore(card),
    };
    values.core_value = coreValue(Object.values(values));
    values.delivery_risk = deliveryRisk(card);
    values.positive_impact = positiveImpactScore(values);
    values.priority_index = priorityIndex(card, values.core_value);
    values.risk_reduction_index = riskReductionIndex(card, values.risk_reduction);
    const impactScoreExplanation = impactExplanation(card, values.positive_impact);
    values.impact_index = impactScoreExplanation ? impactScoreExplanation.result : null;
    values.autonomy_score = autonomyScore(card);
    values.agent_pick_index = values.priority_index === null ? null : values.priority_index * Math.pow(values.autonomy_score / 100, 2) * (1 + 0.30 * values.engineering_health / 100);
    values.quick_win_index = null;
    values.human_leverage_index = null;

    const gates = {
      priority: card.priority_class !== null ? 'pass' : 'fail',
      metadata: KIND_VALUES.has(card.kind) && typeof card.work_type === 'string' && card.work_type.trim() ? 'pass' : 'fail',
      readiness: card.eligibility.readiness && card.status !== 'blocked' && card.status !== 'done' && card.status !== 'dropped' ? 'pass' : 'fail',
      dependencies: card.eligibility.dependencies ? 'pass' : 'fail',
      execution_policy: card.execution.background_selection && executionCeilingRank(card.execution.ceiling) >= 3 && card.status !== 'blocked' ? 'pass' : 'fail',
    };
    gates.eligible = [gates.priority, gates.metadata, gates.readiness, gates.dependencies, gates.execution_policy]
      .every((value) => value === 'pass');
    gates.reason_codes = reasonSet(card, values.autonomy_score, gates);
    const a4Eligible = values.autonomy_score >= 90 &&
      executionCeilingRank(card.execution.ceiling) >= 4 &&
      card.estimate.effort_points !== null && card.estimate.effort_points <= 3 &&
      card.delivery.behavior_surface <= 2 && card.delivery.data_sensitivity <= 2 &&
      values.delivery_risk !== null && values.delivery_risk <= 20 &&
      card.execution.rollback_straightforward && card.execution.ci_deterministic &&
      card.execution.ci_comprehensive && card.eligibility.protected_surface_clear &&
      !card.execution.manual_override && AGENT_EXECUTION_MODES.has(card.eligibility.mode);
    gates.agent_eligible = gates.eligible &&
      card.status === 'ready' && card.priority_class === 'P2' &&
      card.eligibility.date_window && card.eligibility.scope &&
      card.eligibility.claim_available && card.eligibility.protected_surface_clear &&
      values.autonomy_score >= 75 &&
      executionCeilingRank(card.execution.ceiling) >= 3 &&
      card.execution.background_selection &&
      card.delivery.behavior_surface <= 3 && card.delivery.data_sensitivity <= 3 &&
      card.delivery.reversibility >= 3 && !AUTONOMY_HARD_GATE_WORK_TYPES.has(card.work_type) &&
      Boolean(card.work_type) && AGENT_EXECUTION_MODES.has(card.eligibility.mode) &&
      !card.execution.manual_override;
    if (values.autonomy_score >= 90 && !a4Eligible) gates.reason_codes.push('A4_POLICY_NOT_SATISFIED');
    const nonTerminal = !['done', 'dropped'].includes(card.status);
    const executableKind = card.kind !== 'epic';
    const sections = SECTION_NAMES.map((name) => {
      let included = false;
      if (name === 'priority') included = nonTerminal && executableKind && gates.eligible && ['ready', 'active', 'review'].includes(card.status);
      if (name === 'impact') included = nonTerminal;
      if (name === 'low_hanging_fruit') included = nonTerminal && executableKind && gates.eligible && card.estimate.effort_points !== null && card.estimate.effort_points <= 3 && card.modifiers.confidence >= 4 && card.execution.verification_strength >= 4 && card.delivery.reversibility >= 4;
      if (name === 'agent_loops') included = gates.agent_eligible && executableKind;
      if (name === 'blocked') included = nonTerminal && executableKind && card.status === 'blocked';
      return {
        name,
        included,
        reason_codes: sectionReasonCodes(name, included, card, gates, values),
        tie_break_inputs: sectionTieBreakInputs(card, name, values),
      };
    });

    return {
      score_version: 1,
      normalized: card,
      missing_fields: normalizedResult.missingFields,
      defaults_applied: normalizedResult.defaultsApplied,
      warnings: [...normalizedResult.warnings, 'FORMULA_DEFERRED:quick_win_index', 'FORMULA_DEFERRED:qa_class', 'FORMULA_DEFERRED:human_leverage_index'],
      scores: values,
      explanations: {
        impact_index: impactScoreExplanation,
      },
      gates,
      classes: {
        autonomy: autonomyClass(values.autonomy_score, a4Eligible),
        qa: null,
      },
      sections,
    };
  }

  return { evaluate, compareSectionItems, SECTION_NAMES: [...SECTION_NAMES] };
});
