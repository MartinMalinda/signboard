const assert = require('assert');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const cardFrontmatter = require('../lib/cardFrontmatter');
const { readBoardSnapshot } = require('../lib/boardSnapshot');
const { updateBoardSettings } = require('../lib/boardLabels');
const { writeOrderManifest } = require('../lib/orderManifest');

async function testReadBoardSnapshot() {
  const boardRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-board-snapshot-'));
  const todoList = path.join(boardRoot, '000-To-do-stock');
  const doneList = path.join(boardRoot, '001-Done-stock');
  const archiveList = path.join(boardRoot, 'XXX-Archive');

  try {
    await fs.mkdir(todoList, { recursive: true });
    await fs.mkdir(doneList, { recursive: true });
    await fs.mkdir(archiveList, { recursive: true });
    await cardFrontmatter.writeCard(path.join(todoList, '000-alpha-card-abcde.md'), {
      frontmatter: {
        title: 'Alpha',
        due: '2026-03-10',
        labels: ['label-1'],
        signboard_v2: {
          contract_version: 1,
          kind: 'task',
          work_type: 'product',
          priority_class: 'P1',
          estimate: { effort_points: 2 },
        },
      },
      body: '- [ ] (start: 2026-03-09) Prep\n- [x] (due: 2026-03-08) Done',
    });
    await cardFrontmatter.writeCard(path.join(doneList, '000-finished-card-fghij.md'), {
      frontmatter: {
        title: 'Finished',
      },
      body: 'Complete',
    });
    await cardFrontmatter.writeCard(path.join(archiveList, '000-archived-card-klmno.md'), {
      frontmatter: {
        title: 'Archived',
      },
      body: 'Archived',
    });
    await writeOrderManifest(boardRoot, [path.basename(doneList), path.basename(todoList), path.basename(archiveList)]);
    await updateBoardSettings(boardRoot, {
      v2: {
        enabled: true,
        profileId: 'snapshot-test',
        stages: { ready: [path.basename(todoList)] },
      },
    });

    const snapshot = await readBoardSnapshot(boardRoot);

    assert.strictEqual(snapshot.ok, true);
    assert.strictEqual(snapshot.boardName, path.basename(boardRoot));
    assert.deepStrictEqual(snapshot.lists.map((list) => list.listName), [
      '001-Done-stock',
      '000-To-do-stock',
    ]);
    assert(snapshot.boardSettings, 'expected board settings in snapshot');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(snapshot, 'v2'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(snapshot.boardSettings, 'v2'), false);
    const todoSnapshot = snapshot.lists.find((list) => list.listName === '000-To-do-stock');
    assert(todoSnapshot, 'expected the To-do list in the snapshot');
    assert.strictEqual(todoSnapshot.cards.length, 1);
    assert.strictEqual(todoSnapshot.cards[0].frontmatter.title, 'Alpha');
    assert.deepStrictEqual(todoSnapshot.cards[0].taskStartDates, ['2026-03-09']);
    assert.deepStrictEqual(todoSnapshot.cards[0].taskDueDates, ['2026-03-08']);
    assert.deepStrictEqual(todoSnapshot.cards[0].incompleteTaskDueDates, []);
    assert(todoSnapshot.cards[0].timestamps.updatedAt, 'expected card timestamps');

    const v2Snapshot = await readBoardSnapshot(boardRoot, { includeV2: true });
    assert(v2Snapshot.v2, 'expected opt-in V2 snapshot');
    assert.strictEqual(v2Snapshot.v2.profile.profileId, 'snapshot-test');
    assert.strictEqual(v2Snapshot.boardSettings.v2.profileId, 'snapshot-test');
    assert.strictEqual(v2Snapshot.v2.cards.length, 2);
    const v2TodoCard = v2Snapshot.lists.find((list) => list.listName === '000-To-do-stock').cards[0];
    assert.strictEqual(v2TodoCard.v2.metadata.valid, true);
    assert.strictEqual(v2TodoCard.v2.normalized.status, 'ready');
    assert.strictEqual(v2TodoCard.v2.metadata.status, 'ready');
    assert(v2TodoCard.v2.scores.critical_index > 0 || v2TodoCard.v2.scores.critical_index === 0);
    assert(v2TodoCard.v2.sections.find((section) => section.name === 'critical').included);
    const legacyV2Card = v2Snapshot.lists.find((list) => list.listName === '001-Done-stock').cards[0];
    assert.strictEqual(legacyV2Card.v2.metadata.valid, false);
    assert(legacyV2Card.v2.warnings.includes('V2_METADATA_MISSING'));

    const v2WithoutSettings = await readBoardSnapshot(boardRoot, { includeV2: true, includeBoardSettings: false });
    assert.strictEqual(v2WithoutSettings.boardSettings, null);
    assert(v2WithoutSettings.v2, 'V2 opt-in should still load its profile');

    const snapshotWithArchive = await readBoardSnapshot(boardRoot, { includeArchive: true });
    assert.deepStrictEqual(snapshotWithArchive.lists.map((list) => list.listName), [
      '001-Done-stock',
      '000-To-do-stock',
      'XXX-Archive',
    ]);

    const leanSnapshot = await readBoardSnapshot(boardRoot, {
      includeBoardSettings: false,
      includeTimestamps: false,
      includeTaskItems: false,
    });
    const leanCard = leanSnapshot.lists.find((list) => list.listName === '000-To-do-stock').cards[0];
    assert.strictEqual(leanSnapshot.boardSettings, null);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(leanCard, 'timestamps'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(leanCard, 'taskItems'), false);
    assert.deepStrictEqual(leanCard.taskStartDates, ['2026-03-09']);
  } finally {
    await fs.rm(boardRoot, { recursive: true, force: true });
  }
}

function completeV2Metadata(overrides = {}) {
  return {
    contract_version: 1,
    id: 'v2-card',
    kind: 'task',
    work_type: 'product',
    priority_class: 'P2',
    opportunity: { reach: 3, benefit: 3, frequency: 3 },
    risk_prevented: { likelihood: 1, harm: 1, blast_radius: 1, mitigation_effectiveness: 1, credible_tail: false },
    engineering_health: { maintenance_reduction: 4, complexity_reduction: 4, reliability_testability: 4, recurring_time_saved: 4 },
    enablement: { downstream_value: 2, downstream_breadth: 2, critical_path: 2 },
    discovery_value: { uncertainty_reduction: 2, decision_importance: 2, cost_of_wrong_choice: 2 },
    modifiers: { confidence: 5, strategic_fit: 4, urgency: 3, maintenance_delta: 1 },
    estimate: { effort_points: 2, coordination_complexity: 1 },
    delivery: { regression_likelihood: 1, change_blast_radius: 1, reversibility: 5, behavior_surface: 1, data_sensitivity: 1 },
    execution: {
      specification_clarity: 5,
      verification_strength: 5,
      boundedness: 5,
      isolation: 5,
      agent_execution_blocked: false,
      autonomous_execution_blocked: false,
      do_not_autorun: false,
      policy_autonomous_merge_allowed: false,
      rollback_straightforward: false,
      ci_deterministic: false,
      ci_comprehensive: false,
    },
    eligibility: {
      readiness: true,
      dependencies: true,
      date_window: true,
      scope: true,
      claim_available: true,
      protected_surface_clear: true,
      mode: 'general',
    },
    ...overrides,
  };
}

async function testOptInV2Projection() {
  const boardRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-board-snapshot-v2-'));
  const readyList = path.join(boardRoot, 'Ready');
  const blockedList = path.join(boardRoot, 'Blocked');

  try {
    await fs.mkdir(readyList, { recursive: true });
    await fs.mkdir(blockedList, { recursive: true });
    await cardFrontmatter.writeCard(path.join(readyList, '000-ready.md'), {
      frontmatter: { title: 'Ready', signboard_v2: completeV2Metadata() },
      body: 'Ready body',
    });
    await cardFrontmatter.writeCard(path.join(readyList, '001-p0.md'), {
      frontmatter: { title: 'P0', signboard_v2: completeV2Metadata({ id: 'p0', priority_class: 'P0' }) },
      body: 'P0 body',
    });
    await cardFrontmatter.writeCard(path.join(readyList, '002-p1.md'), {
      frontmatter: { title: 'P1', signboard_v2: completeV2Metadata({ id: 'p1', priority_class: 'P1' }) },
      body: 'P1 body',
    });
    await cardFrontmatter.writeCard(path.join(readyList, '003-legacy.md'), {
      frontmatter: { title: 'Legacy' },
      body: 'Legacy body',
    });
    await cardFrontmatter.writeCard(path.join(readyList, '004-malformed.md'), {
      frontmatter: { title: 'Malformed', signboard_v2: { contract_version: 1, kind: 99, work_type: 42, priority_class: 99, execution: { do_not_autorun: 'false' } } },
      body: 'Malformed body',
    });
    await cardFrontmatter.writeCard(path.join(readyList, '005-invalid-version.md'), {
      frontmatter: { title: 'Invalid version', signboard_v2: 'not-an-object' },
      body: 'Invalid body',
    });
    await cardFrontmatter.writeCard(path.join(blockedList, '000-blocked.md'), {
      frontmatter: { title: 'Blocked', signboard_v2: completeV2Metadata({ id: 'blocked', status: 'ready' }) },
      body: 'Blocked body',
    });
    await cardFrontmatter.writeCard(path.join(readyList, '006-sparse.md'), {
      frontmatter: { title: 'Sparse', signboard_v2: { contract_version: 1, id: 'sparse', kind: 'task' } },
      body: 'Sparse body',
    });
    await writeOrderManifest(boardRoot, ['Ready', 'Blocked']);
    await updateBoardSettings(boardRoot, {
      v2: {
        enabled: true,
        profileId: 'projection-test',
        stages: { ready: ['Ready'], blocked: ['Blocked'] },
      },
    });

    const snapshot = await readBoardSnapshot(boardRoot, { includeV2: true });
    assert(snapshot.v2, 'enabled opt-in snapshot should expose the V2 projection');
    assert.strictEqual(snapshot.v2.profile.profileId, 'projection-test');
    const cards = Object.fromEntries(snapshot.lists.flatMap((list) => list.cards.map((card) => [card.cardName, card])));
    assert.strictEqual(cards['000-ready.md'].v2.metadata.status, 'ready');
    assert(cards['000-ready.md'].v2.scores.priority_index > 0);
    assert.strictEqual(cards['000-ready.md'].v2.eligibility.eligible, true);
    assert(cards['000-ready.md'].v2.sections.find((section) => section.name === 'agent_loops').included);

    for (const name of ['001-p0.md', '002-p1.md']) {
      const projection = cards[name].v2;
      assert(projection.sections.find((section) => section.name === 'critical').included);
      assert(projection.scores.autonomy_score <= 74);
      assert.strictEqual(projection.eligibility.agent_eligible, false);
      assert(projection.eligibility.reason_codes.includes('PRIORITY_AUTONOMY_CAP'));
    }

    assert(cards['000-blocked.md'].v2.sections.find((section) => section.name === 'blocked').included);
    assert.strictEqual(cards['000-blocked.md'].v2.eligibility.eligible, false);
    assert(cards['000-blocked.md'].v2.eligibility.reason_codes.includes('STATUS_BLOCKED'));

    assert.strictEqual(cards['003-legacy.md'].v2.metadata.present, false);
    assert.strictEqual(cards['003-legacy.md'].v2.eligibility.eligible, false);
    assert(cards['003-legacy.md'].v2.missing_fields.length > 0);
    assert.strictEqual(cards['005-invalid-version.md'].v2.metadata.valid, false);
    assert(cards['005-invalid-version.md'].v2.warnings.includes('INVALID_V2_CONTRACT_VERSION'));
    assert.strictEqual(cards['004-malformed.md'].v2.eligibility.eligible, false);
    assert(cards['004-malformed.md'].v2.warnings.some((warning) => warning.startsWith('INVALID_')));
    assert(cards['004-malformed.md'].v2.warnings.includes('INVALID_PRIORITY'));
    assert(cards['004-malformed.md'].v2.warnings.includes('INVALID_KIND'));
    assert(cards['004-malformed.md'].v2.warnings.includes('INVALID_WORK_TYPE'));
    assert(cards['004-malformed.md'].v2.eligibility.reason_codes.includes('METADATA_GATE_FAILED'));
    assert.strictEqual(cards['006-sparse.md'].v2.scores.priority_index, null);
    assert.strictEqual(cards['006-sparse.md'].v2.eligibility.eligible, false);
    assert(cards['006-sparse.md'].v2.missing_fields.includes('estimate.effort_points'));

    const noRequest = await readBoardSnapshot(boardRoot);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(noRequest, 'v2'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(noRequest.lists[0].cards[0], 'v2'), false);
  } finally {
    await fs.rm(boardRoot, { recursive: true, force: true });
  }
}

async function run() {
  await testReadBoardSnapshot();
  await testOptInV2Projection();
  console.log('Board snapshot tests passed.');
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
