const V2_KINDS = new Set(['task', 'discovery', 'epic', 'incident']);
const V2_WORK_TYPES = new Set([
  'product', 'ux', 'security', 'correctness', 'data_integrity', 'reliability',
  'performance', 'compliance', 'privacy', 'engineering_health', 'technical_debt',
  'observability', 'operations', 'enablement', 'discovery', 'documentation',
]);
const V2_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const { isExecutionCeiling } = require('./v2ExecutionPolicy');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanList(value) {
  if (!Array.isArray(value)) return undefined;
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

function normalizeV2CardMetadata(value) {
  if (!isObject(value)) return undefined;
  const next = { ...value, contract_version: 1 };

  if (typeof next.kind !== 'string' || !V2_KINDS.has(next.kind.trim())) delete next.kind;
  else next.kind = next.kind.trim();
  if (typeof next.work_type !== 'string' || !V2_WORK_TYPES.has(next.work_type.trim())) delete next.work_type;
  else next.work_type = next.work_type.trim();
  if (typeof next.priority_class !== 'string' || !V2_PRIORITIES.has(next.priority_class.trim().toUpperCase())) delete next.priority_class;
  else next.priority_class = next.priority_class.trim().toUpperCase();

  if (isObject(next.estimate)) {
    const estimate = { ...next.estimate };
    if (Number.isFinite(Number(estimate.effort_points)) && Number(estimate.effort_points) > 0) estimate.effort_points = Math.min(99, Math.round(Number(estimate.effort_points)));
    else delete estimate.effort_points;
    if (Object.keys(estimate).length) next.estimate = estimate;
    else delete next.estimate;
  }
  for (const field of ['depends_on', 'blocked_by']) {
    if (field in next) {
      const normalized = cleanList(next[field]);
      if (normalized?.length) next[field] = normalized;
      else delete next[field];
    }
  }
  if (isObject(next.execution)) {
    const execution = { ...next.execution };
    if (Object.prototype.hasOwnProperty.call(execution, 'ceiling') && isExecutionCeiling(execution.ceiling)) {
      execution.ceiling = execution.ceiling.trim().toLowerCase();
    }
    for (const field of ['agent_execution_blocked', 'autonomous_execution_blocked', 'do_not_autorun', 'policy_autonomous_merge_allowed']) delete execution[field];
    if (Object.keys(execution).length) next.execution = execution;
    else delete next.execution;
  }
  return next;
}

module.exports = { normalizeV2CardMetadata };
