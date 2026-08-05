(function initializeV2StageSemantics(root, factory) {
  const semantics = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = semantics;
  }
  if (root) {
    root.SignboardV2StageSemantics = semantics;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createV2StageSemanticsModule() {
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

  function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function listNamesForStage(profile, stage) {
    const stages = isObject(profile && profile.stages) ? profile.stages : {};
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

  function resolveV2StageSemanticsForLists(profile, listNames = []) {
    const names = Array.isArray(listNames) ? listNames : [];
    return Object.fromEntries(names.map((listName) => {
      const normalizedListName = normalizeListName(listName);
      return [normalizedListName, resolveV2StageSemantics(profile, normalizedListName)];
    }).filter(([listName]) => Boolean(listName)));
  }

  return {
    V2_STAGE_KEYS: [...V2_STAGE_KEYS],
    V2_TERMINAL_STAGES: [...V2_TERMINAL_STAGES],
    resolveV2StageSemantics,
    resolveV2StageSemanticsForLists,
  };
});
