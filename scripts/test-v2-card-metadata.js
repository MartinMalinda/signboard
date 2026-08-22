const assert = require('assert');
const { normalizeV2CardMetadata } = require('../shared/v2CardMetadata');
const { normalizeFrontmatter } = require('../lib/cardFrontmatter');

const normalized = normalizeV2CardMetadata({
  contract_version: 99,
  kind: 'task',
  work_type: 'product',
  priority_class: 'p1',
  objective: 'Move this into the body',
  estimate: { effort_points: 140, coordination_complexity: 5 },
  depends_on: ['  One ', '', 'One'],
  blocked_by: ['Decision', 'Decision'],
  blocked_on_decision: true,
  engineering_health: { maintenance_reduction: 4 },
  execution: { ceiling: 'autonomous_merge', background_selection: true },
  eligibility: { readiness: true },
  modifiers: { confidence: 4, strategic_fit: 5 },
});
assert.deepStrictEqual(normalized, {
  contract_version: 1,
  kind: 'task',
  priority_class: 'P1',
  estimate: { effort_points: 99 },
  depends_on: ['One'],
  blocked_by: ['Decision'],
  blocked_on_decision: true,
  modifiers: { confidence: 4 },
});

const invalid = normalizeV2CardMetadata({ kind: 'not-a-kind', priority_class: 'P2' });
assert.deepStrictEqual(invalid, { contract_version: 1, priority_class: 'P2' });
assert.deepStrictEqual(normalizeV2CardMetadata({ kind: 'task', priority_class: 'P2', blocked_on_decision: 'yes' }), {
  contract_version: 1,
  kind: 'task',
  priority_class: 'P2',
});

const card = normalizeFrontmatter({
  title: 'Example',
  labels: ['label-1'],
  signboard_v2: { kind: 'discovery', work_type: 'ux', priority_class: 'P0' },
});
assert.deepStrictEqual(card.signboard_v2, { contract_version: 1, kind: 'discovery', priority_class: 'P0' });
assert.deepStrictEqual(normalizeFrontmatter({ title: 'Legacy' }).signboard_v2, undefined);
console.log('V2 card metadata tests passed.');
