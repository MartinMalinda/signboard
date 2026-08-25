(function initializeV2Evaluator(root, factory) {
  const evaluator = factory();
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) {
    module.exports = evaluator;
  }
  if (root) root.SignboardV2Evaluator = evaluator;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createV2Evaluator() {
  const SCORE_FIELDS = Object.freeze({
    opportunity: ['reach', 'benefit', 'frequency'],
    risk_prevented: ['likelihood', 'harm', 'blast_radius'],
  });
  const STATUS_VALUES = new Set(['inbox', 'shaping', 'ready', 'active', 'review', 'blocked', 'done', 'dropped']);
  const PRIORITY_VALUES = new Set(['P0', 'P1', 'P2', 'P3']);
  const KIND_VALUES = new Set(['epic', 'task', 'discovery', 'incident']);
  const SECTION_NAMES = Object.freeze(['priority', 'impact', 'low_hanging_fruit', 'blocked']);
  const CONFIDENCE_MULTIPLIER = Object.freeze({ 1: 0.45, 2: 0.60, 3: 0.75, 4: 0.90, 5: 1.00 });
  const URGENCY_MULTIPLIER = Object.freeze({ 1: 0.90, 2: 1.00, 3: 1.10, 4: 1.25, 5: 1.45 });
  const MAINTENANCE_MULTIPLIER = Object.freeze({ '-2': 0.85, '-1': 0.93, 0: 1.00, 1: 1.07, 2: 1.15 });
  const MAX_PRIORITY_INDEX = 100 * Math.max(...Object.values(CONFIDENCE_MULTIPLIER)) * Math.max(...Object.values(URGENCY_MULTIPLIER)) * Math.max(...Object.values(MAINTENANCE_MULTIPLIER));
  const SCORE_RANGES = Object.freeze({
    priority_index: Object.freeze({ min: 0, max: MAX_PRIORITY_INDEX }),
    impact_index: Object.freeze({ min: 0, max: 100 }),
    risk_reduction_index: Object.freeze({ min: 0, max: 145 }),
  });

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeScore(value, path, missingFields, defaultsApplied, warnings) {
    if (typeof value === 'undefined') {
      missingFields.push(path);
      defaultsApplied[path] = 0;
      return 0;
    }
    if (Number.isInteger(value) && value >= 0 && value <= 5) return value;
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
    if (valid) return value;
    warnings.push(`INVALID_MODIFIER:modifiers.${field}`);
    defaultsApplied[`modifiers.${field}`] = fallback;
    return fallback;
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
    const kind = typeof source.kind === 'string' ? source.kind.trim().toLowerCase() : '';
    if (!kind) {
      missingFields.push('kind');
      defaultsApplied.kind = '';
      warnings.push('MISSING_KIND');
    }
    const priority = typeof source.priority_class === 'string' && PRIORITY_VALUES.has(source.priority_class.trim().toUpperCase())
      ? source.priority_class.trim().toUpperCase()
      : null;
    const status = typeof source.status === 'string' && STATUS_VALUES.has(source.status.trim().toLowerCase())
      ? source.status.trim().toLowerCase()
      : null;
    if (!priority) warnings.push('INVALID_PRIORITY');
    if (!status) warnings.push('INVALID_STATUS');

    const effort = source.estimate && source.estimate.effort_points;
    const effortPoints = Number.isFinite(effort) && effort > 0 ? Number(effort) : null;
    if (effortPoints === null) {
      missingFields.push('estimate.effort_points');
      defaultsApplied['estimate.effort_points'] = null;
    }

    const delivery = isObject(source.delivery) ? source.delivery : {};
    const normalized = {
      id,
      kind,
      status,
      priority_class: priority,
      opportunity: normalizeGroup(source, 'opportunity', missingFields, defaultsApplied, warnings),
      risk_prevented: normalizeGroup(source, 'risk_prevented', missingFields, defaultsApplied, warnings),
      modifiers: {
        confidence: normalizeModifier(source, 'confidence', 1, missingFields, defaultsApplied, warnings),
        urgency: normalizeModifier(source, 'urgency', 1, missingFields, defaultsApplied, warnings),
        maintenance_delta: normalizeModifier(source, 'maintenance_delta', 0, missingFields, defaultsApplied, warnings),
      },
      estimate: {
        effort_points: effortPoints,
      },
      delivery: {
        regression_likelihood: normalizeScore(delivery.regression_likelihood, 'delivery.regression_likelihood', missingFields, defaultsApplied, warnings),
        change_blast_radius: normalizeScore(delivery.change_blast_radius, 'delivery.change_blast_radius', missingFields, defaultsApplied, warnings),
        reversibility: normalizeScore(delivery.reversibility, 'delivery.reversibility', missingFields, defaultsApplied, warnings),
      },
    };
    return { normalized, missingFields, defaultsApplied, warnings };
  }

  function opportunityScore(card) {
    const values = card.opportunity;
    return 20 * (0.35 * values.reach + 0.40 * values.benefit + 0.25 * values.frequency);
  }

  function riskReductionScore(card) {
    const { likelihood, harm, blast_radius: blastRadius } = card.risk_prevented;
    if (!likelihood || !harm || !blastRadius) return 0;
    const expectedRisk = 100 * (likelihood / 5) * (harm / 5) * (blastRadius / 5);
    return expectedRisk;
  }

  function coreValue(scores) {
    const dominant = Math.max(...scores);
    const remaining = scores.reduce((sum, score) => sum + score, 0) - dominant;
    return Math.min(100, dominant + Math.min(20, 0.15 * remaining));
  }

  function positiveImpactScore(values) {
    return values.opportunity;
  }

  function deliveryRisk(card) {
    const { regression_likelihood: regression, change_blast_radius: blastRadius, reversibility } = card.delivery;
    if (!regression || !blastRadius || !reversibility) return null;
    return Math.min(100, 4 * regression * blastRadius * (1.2 - 0.2 * reversibility));
  }

  function priorityIndex(card, core) {
    if (!card.priority_class || !card.estimate.effort_points) return null;
    const confidence = CONFIDENCE_MULTIPLIER[card.modifiers.confidence];
    const urgency = URGENCY_MULTIPLIER[card.modifiers.urgency];
    const maintenance = card.priority_class === 'P0' || card.priority_class === 'P1'
      ? 1
      : MAINTENANCE_MULTIPLIER[card.modifiers.maintenance_delta];
    return (core * confidence * urgency * maintenance) / Math.pow(card.estimate.effort_points, 0.60);
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
    const effortFactor = Math.pow(effortPoints, 0.20);
    return {
      positive_impact: positiveImpact,
      confidence_multiplier: confidenceMultiplier,
      effort_points: effortPoints,
      effort_factor: effortFactor,
      result: (positiveImpact * confidenceMultiplier) / effortFactor,
    };
  }

  function reasonSet(card, gates) {
    const reasons = [];
    if (!card.priority_class) reasons.push('PRIORITY_INVALID');
    if (!KIND_VALUES.has(card.kind)) reasons.push('METADATA_INVALID');
    if (gates.metadata !== 'pass') reasons.push('METADATA_GATE_FAILED');
    if (!card.status) reasons.push('STATUS_INVALID');
    if (gates.readiness !== 'pass') reasons.push('READINESS_FAILED');
    if (card.status === 'blocked') reasons.push('STATUS_BLOCKED');
    return [...new Set(reasons)];
  }

  function sectionScore(name, values) {
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
      if (gates.eligible !== true) reasons.push(...gates.reason_codes);
      if (!['ready', 'active', 'review'].includes(card.status)) reasons.push('STATUS_NOT_PLANNABLE');
    }
    if (name === 'low_hanging_fruit') {
      if (card.estimate.effort_points === null || card.estimate.effort_points > 3) reasons.push('EFFORT_TOO_LARGE');
      if (card.modifiers.confidence < 4) reasons.push('CONFIDENCE_LOW');
      if (card.delivery.reversibility < 4) reasons.push('REVERSIBILITY_LOW');
      if (card.delivery.regression_likelihood > 3 || card.delivery.change_blast_radius > 3) reasons.push('CHANGE_RISK_HIGH');
    }
    if (name === 'blocked' && card.status !== 'blocked') reasons.push('STATUS_NOT_BLOCKED');
    return [...new Set(reasons.length ? reasons : ['SECTION_INELIGIBLE'])];
  }

  function evaluate(input = {}) {
    const normalizedResult = normalizeInput(input);
    const card = normalizedResult.normalized;
    const values = {
      opportunity: opportunityScore(card),
      risk_reduction: riskReductionScore(card),
    };
    values.core_value = coreValue(Object.values(values));
    values.delivery_risk = deliveryRisk(card);
    values.positive_impact = positiveImpactScore(values);
    values.priority_index = priorityIndex(card, values.core_value);
    values.risk_reduction_index = riskReductionIndex(card, values.risk_reduction);
    const impactScoreExplanation = impactExplanation(card, values.positive_impact);
    values.impact_index = impactScoreExplanation ? impactScoreExplanation.result : null;

    const gates = {
      priority: card.priority_class !== null ? 'pass' : 'fail',
      metadata: KIND_VALUES.has(card.kind) ? 'pass' : 'fail',
      readiness: ['ready', 'active', 'review'].includes(card.status) ? 'pass' : 'fail',
    };
    gates.eligible = [gates.priority, gates.metadata, gates.readiness].every((value) => value === 'pass');
    gates.reason_codes = reasonSet(card, gates);

    const nonTerminal = !['done', 'dropped'].includes(card.status);
    const executableKind = card.kind !== 'epic';
    const sections = SECTION_NAMES.map((name) => {
      let included = false;
      if (name === 'priority') included = nonTerminal && executableKind && gates.eligible && ['ready', 'active', 'review'].includes(card.status);
      if (name === 'impact') included = nonTerminal;
      if (name === 'low_hanging_fruit') included = nonTerminal && executableKind && gates.eligible && card.estimate.effort_points !== null && card.estimate.effort_points <= 3 && card.modifiers.confidence >= 4 && card.delivery.reversibility >= 4 && card.delivery.regression_likelihood <= 3 && card.delivery.change_blast_radius <= 3;
      if (name === 'blocked') included = nonTerminal && executableKind && card.status === 'blocked';
      return {
        name,
        included,
        reason_codes: sectionReasonCodes(name, included, card, gates, values),
        tie_break_inputs: sectionTieBreakInputs(card, name, values),
      };
    });

    return {
      score_version: 2,
      normalized: card,
      missing_fields: normalizedResult.missingFields,
      defaults_applied: normalizedResult.defaultsApplied,
      warnings: normalizedResult.warnings,
      scores: values,
      score_ranges: SCORE_RANGES,
      explanations: { impact_index: impactScoreExplanation },
      gates,
      classes: {},
      sections,
    };
  }

  return { evaluate, compareSectionItems, SECTION_NAMES: [...SECTION_NAMES], SCORE_RANGES };
});
