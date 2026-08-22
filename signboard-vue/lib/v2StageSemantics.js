const V2_STAGE_KEYS = Object.freeze([
  'inbox',
  'shaping',
  'ready',
  'active',
  'review',
  'blocked',
  'done',
  'dropped',
]);
const V2_TERMINAL_STAGES = new Set(['done', 'dropped']);

function normalizeListName(value) {
  return String(value || '').trim();
}

function listNamesForStage(profile, stage) {
  const stages = profile && typeof profile.stages === 'object' && !Array.isArray(profile.stages)
    ? profile.stages
    : {};
  return Array.isArray(stages[stage])
    ? stages[stage].map(normalizeListName).filter(Boolean)
    : [];
}

function resolveV2StageSemantics(profile, listName) {
  const normalizedListName = normalizeListName(listName);
  const matches = normalizedListName
    ? V2_STAGE_KEYS.filter((stage) => listNamesForStage(profile, stage).includes(normalizedListName))
    : [];
  const mapped = matches.length > 0;
  const ambiguous = matches.length > 1;
  const stage = matches.length === 1 ? matches[0] : null;

  return {
    stage,
    mapped,
    ambiguous,
    terminal: stage ? V2_TERMINAL_STAGES.has(stage) : false,
  };
}

export { V2_STAGE_KEYS, V2_TERMINAL_STAGES, resolveV2StageSemantics };
