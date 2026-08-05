const assert = require('assert');
const { normalizeV2CardMetadata } = require('../shared/v2CardMetadata');
const { normalizeFrontmatter } = require('../lib/cardFrontmatter');

const normalized = normalizeV2CardMetadata({
  contract_version: 99,
  kind: 'task',
  work_type: 'product',
  priority_class: 'p1',
  estimate: { effort_points: 140 },
  depends_on: ['  One ', '', 'One'],
  execution: { ceiling: 'Autonomous_Pull_Request', background_selection: true, agent_execution_blocked: true },
});
assert.deepStrictEqual(normalized, {
  contract_version: 1,
  kind: 'task',
  work_type: 'product',
  priority_class: 'P1',
  estimate: { effort_points: 99 },
  depends_on: ['One'],
  execution: { ceiling: 'autonomous_pull_request', background_selection: true },
});

const invalid = normalizeV2CardMetadata({ kind: 'not-a-kind', work_type: 'product', priority_class: 'P2' });
assert.deepStrictEqual(invalid, { contract_version: 1, work_type: 'product', priority_class: 'P2' });

const malformedPolicy = normalizeV2CardMetadata({
  contract_version: 1,
  kind: 'task',
  work_type: 'product',
  priority_class: 'P2',
  execution: { ceiling: 'not-a-ceiling', background_selection: 'false' },
});
assert.deepStrictEqual(malformedPolicy.execution, {
  ceiling: 'not-a-ceiling',
  background_selection: 'false',
});
assert.deepStrictEqual(normalizeFrontmatter({ signboard_v2: malformedPolicy }).signboard_v2.execution, malformedPolicy.execution);

const card = normalizeFrontmatter({ title: 'Example', labels: ['label-1'], signboard_v2: { kind: 'discovery', work_type: 'ux', priority_class: 'P0' } });
assert.deepStrictEqual(card.signboard_v2, { contract_version: 1, kind: 'discovery', work_type: 'ux', priority_class: 'P0' });
assert.deepStrictEqual(normalizeFrontmatter({ title: 'Legacy' }).signboard_v2, undefined);
console.log('V2 card metadata tests passed.');
