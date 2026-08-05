const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const { readBoardSnapshot } = require('../lib/boardSnapshot');
const { updateBoardSettings } = require('../lib/boardLabels');
const { writeCard } = require('../lib/cardFrontmatter');
const { collectExternalPublishedCalendarEvents } = require('../lib/externalPublishedCalendar');
const stageSemantics = require('../shared/v2StageSemantics');

function loadDueNotificationUtilities() {
  const context = {
    console,
    SignboardV2StageSemantics: stageSemantics,
    normalizeBoardPath: (value) => {
      const normalized = String(value || '').trim();
      return normalized ? (normalized.endsWith('/') ? normalized : `${normalized}/`) : '';
    },
    isBoardListCompletedByWorkflow: () => false,
  };
  vm.createContext(context);
  for (const fileName of ['dueDateStatus.js', 'taskList.js', 'dueNotifications.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../app/utilities', fileName), 'utf8'), context);
  }
  return context;
}

const profile = {
  enabled: true,
  stages: {
    active: ['Custom Active'],
    done: ['Custom Terminal'],
    ready: ['Duplicate Mapping', 'Custom Active'],
  },
};

async function testResolverAndSnapshot() {
  assert.deepStrictEqual(stageSemantics.resolveV2StageSemantics(profile, 'Custom Active'), {
    stage: null, mapped: true, ambiguous: true, terminal: false,
  });
  assert.deepStrictEqual(stageSemantics.resolveV2StageSemantics(profile, 'Custom Terminal'), {
    stage: 'done', mapped: true, ambiguous: false, terminal: true,
  });
  assert.deepStrictEqual(stageSemantics.resolveV2StageSemantics(profile, 'Unmapped'), {
    stage: null, mapped: false, ambiguous: false, terminal: false,
  });

  const boardRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'signboard-v2-stage-semantics-'));
  const activeList = path.join(boardRoot, 'Custom Active');
  const terminalList = path.join(boardRoot, 'Custom Terminal');
  const unmappedList = path.join(boardRoot, 'Unmapped');
  try {
    await Promise.all([activeList, terminalList, unmappedList].map((listPath) => fs.promises.mkdir(listPath)));
    await Promise.all([
      writeCard(path.join(activeList, 'active.md'), { frontmatter: { title: 'Active', signboard_v2: { contract_version: 1, kind: 'task', work_type: 'product', priority_class: 'P2' } }, body: '' }),
      writeCard(path.join(terminalList, 'terminal.md'), { frontmatter: { title: 'Terminal', signboard_v2: { contract_version: 1, kind: 'task', work_type: 'product', priority_class: 'P2' } }, body: '' }),
      writeCard(path.join(unmappedList, 'unmapped.md'), { frontmatter: { title: 'Unmapped', signboard_v2: { contract_version: 1, kind: 'task', work_type: 'product', priority_class: 'P2' } }, body: '' }),
    ]);
    await updateBoardSettings(boardRoot, { v2: profile });
    const snapshot = await readBoardSnapshot(boardRoot, { includeV2: true });
    const cards = Object.fromEntries(snapshot.lists.flatMap((list) => list.cards).map((card) => [card.cardName, card.v2]));
    assert.strictEqual(cards['active.md'].stageSemantics.ambiguous, true);
    assert.strictEqual(cards['active.md'].metadata.status, null);
    assert.strictEqual(cards['terminal.md'].stageSemantics.terminal, true);
    assert.strictEqual(cards['unmapped.md'].stageSemantics.mapped, false);
    assert(cards['unmapped.md'].warnings.includes('V2_STAGE_UNMAPPED'));
  } finally {
    await fs.promises.rm(boardRoot, { recursive: true, force: true });
  }
}

async function testDueAndCalendarConsumers() {
  const context = loadDueNotificationUtilities();
  const root = '/tmp/v2-stage-board/';
  const lists = ['Custom Active', 'Custom Terminal', 'Unmapped'];
  const cards = new Map(lists.map((listName) => [
    `${root}${listName}/due.md`,
    { frontmatter: { title: listName, due: '2026-08-04' }, body: '- [ ] (due: 2026-08-04) Due item' },
  ]));
  const boardApi = {
    readBoardSettings: async () => ({ v2: profile, workflow: {} }),
    listLists: async () => lists,
    listCards: async (listPath) => [`${listPath.split('/').at(-1) === 'Custom Active' ? 'due.md' : 'due.md'}`],
    readCard: async (cardPath) => cards.get(cardPath),
  };
  const dueItems = await context.collectDueTodayItemsForBoard(boardApi, root, '2026-08-04');
  assert.strictEqual(dueItems.length, 0, 'ambiguous active mapping must fail closed for due notifications');

  const calendarEvents = await collectExternalPublishedCalendarEvents({
    boardRoots: [root],
    readBoardSettings: async () => ({ v2: { enabled: true, stages: { active: ['Custom Active'], done: ['Custom Terminal'] } }, externalPublishedCalendar: { include: true }, workflow: {} }),
    listLists: async () => ['Custom Active', 'Custom Terminal', 'Unmapped'],
    listCards: async () => ['due.md'],
    readCard: async (cardPath) => cards.get(cardPath),
  });
  assert.strictEqual(calendarEvents.length, 2);
  assert(calendarEvents.every((event) => event.listName === 'Custom Active'));
}

Promise.all([testResolverAndSnapshot(), testDueAndCalendarConsumers()])
  .then(() => console.log('V2 stage semantics tests passed.'))
  .catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
