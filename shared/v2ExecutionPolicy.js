const EXECUTION_CEILINGS = Object.freeze([
  Object.freeze({ value: 'human_only', label: 'Human only', rank: 0 }),
  Object.freeze({ value: 'analysis_planning', label: 'Analysis and planning only', rank: 1 }),
  Object.freeze({ value: 'supervised_implementation', label: 'Supervised implementation', rank: 2 }),
  Object.freeze({ value: 'autonomous_pull_request', label: 'Autonomous pull request', rank: 3 }),
  Object.freeze({ value: 'autonomous_merge', label: 'Policy-permitted autonomous merge', rank: 4 }),
]);

const EXECUTION_CEILING_VALUES = new Set(EXECUTION_CEILINGS.map((option) => option.value));
const DEFAULT_EXECUTION_CEILING = 'human_only';
const DEFAULT_BACKGROUND_SELECTION = false;

function normalizeExecutionCeiling(value) {
  const candidate = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return EXECUTION_CEILING_VALUES.has(candidate) ? candidate : DEFAULT_EXECUTION_CEILING;
}

function isExecutionCeiling(value) {
  return typeof value === 'string' && EXECUTION_CEILING_VALUES.has(value.trim().toLowerCase());
}

function executionCeilingRank(value) {
  return EXECUTION_CEILINGS.find((option) => option.value === value)?.rank ?? 0;
}

module.exports = {
  EXECUTION_CEILINGS,
  EXECUTION_CEILING_VALUES,
  DEFAULT_EXECUTION_CEILING,
  DEFAULT_BACKGROUND_SELECTION,
  normalizeExecutionCeiling,
  isExecutionCeiling,
  executionCeilingRank,
};
