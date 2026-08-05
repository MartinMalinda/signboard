const assert = require('assert');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const {
  readBoardSettings,
  updateBoardLabels,
  updateBoardThemeOverrides,
  updateBoardSettings,
  readLegacyBoardAppSettings,
  cardMatchesLabelFilter,
  isAutoDetectedCompletedListName,
  isCompletedListByWorkflow,
} = require('../lib/boardLabels');
const { readOrderManifest, writeOrderManifest } = require('../lib/orderManifest');

async function run() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-board-labels-'));
  const boardPath = path.join(tmpDir, 'board-one');
  await fs.mkdir(boardPath, { recursive: true });

  try {
    // 1) Missing board manifest should create default settings.
    const defaults = await readBoardSettings(boardPath);
    assert.strictEqual(defaults.labels.length, 3);
    assert.strictEqual(defaults.labels[0].id, 'label-1');
    assert.deepStrictEqual(defaults.themeOverrides, { light: {}, dark: {} });
    assert.deepStrictEqual(defaults.workflow, {
      autoDetectCompletedLists: true,
      completedListNames: [],
      ignoredCompletedListNames: [],
    });
    assert.deepStrictEqual(defaults.externalPublishedCalendar, { include: true });
    assert.deepStrictEqual(defaults.obsidianBase, { managedHash: '', updatedAt: '' });
    assert.deepStrictEqual(defaults.v2, {
      enabled: false,
      profileId: '',
      version: 1,
      title: '',
      description: '',
      stages: {
        inbox: [],
        shaping: [],
        ready: [],
        active: [],
        review: [],
        blocked: [],
        done: [],
        dropped: [],
      },
      dashboard: {
        sections: ['priority', 'impact', 'low_hanging_fruit', 'agent_loops', 'blocked'],
        title: '',
        description: '',
      },
      cardDefaults: { kind: 'task', workType: 'product', priorityClass: 'P2', executionCeiling: 'human_only', backgroundSelection: false },
      validationPolicy: 'framework_v1',
    });

    const settingsPath = path.join(boardPath, '.board.json');
    const writtenRaw = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    assert(writtenRaw.settings && writtenRaw.settings.labels, '.board.json should contain board settings');
    assert(!writtenRaw.settings.notifications, '.board.json should not contain app notification settings');
    assert(!writtenRaw.settings.tooltipsEnabled, '.board.json should not contain app tooltip settings');
    assert(!writtenRaw.settings.v2, 'disabled default V2 profile should remain optional on disk');

    // 2) Updating labels should persist and preserve ids.
    const updatedLabels = [
      {
        id: 'label-priority',
        name: 'Priority',
        colorLight: '#f59e0b',
        colorDark: '#d97706',
      },
      {
        id: 'label-bug',
        name: 'Bug',
        colorLight: '#ef4444',
        colorDark: '#dc2626',
      },
    ];

    await updateBoardLabels(boardPath, updatedLabels);
    const reloaded = await readBoardSettings(boardPath);
    assert.deepStrictEqual(reloaded.labels, updatedLabels);
    assert.deepStrictEqual(reloaded.themeOverrides, { light: {}, dark: {} });

    // 3) Theme overrides should persist and normalize values.
    await updateBoardThemeOverrides(boardPath, {
      light: { boardBackground: 'dfe4f2' },
      dark: { boardBackground: '#0b1220' },
    });
    const withThemeOverrides = await readBoardSettings(boardPath);
    assert.deepStrictEqual(withThemeOverrides.themeOverrides, {
      light: { boardBackground: '#dfe4f2' },
      dark: { boardBackground: '#0b1220' },
    });

    // 4) Updating full settings can clear overrides and preserve labels.
    await updateBoardSettings(boardPath, {
      labels: updatedLabels,
      themeOverrides: { light: {}, dark: {} },
      workflow: {
        autoDetectCompletedLists: false,
        completedListNames: ['003-Done-abc12'],
      },
      externalPublishedCalendar: {
        include: false,
      },
      obsidianBase: {
        managedHash: 'a'.repeat(64),
        updatedAt: '2026-06-09T12:00:00.000Z',
      },
    });
    const clearedOverrides = await readBoardSettings(boardPath);
    assert.deepStrictEqual(clearedOverrides.themeOverrides, { light: {}, dark: {} });
    assert.deepStrictEqual(clearedOverrides.labels, updatedLabels);
    assert.deepStrictEqual(clearedOverrides.workflow, {
      autoDetectCompletedLists: false,
      completedListNames: ['003-Done-abc12'],
      ignoredCompletedListNames: [],
    });
    assert.deepStrictEqual(clearedOverrides.externalPublishedCalendar, { include: false });
    assert.deepStrictEqual(clearedOverrides.obsidianBase, {
      managedHash: 'a'.repeat(64),
      updatedAt: '2026-06-09T12:00:00.000Z',
    });

    // 4b) V2 profiles normalize conservatively, merge partial updates, and persist atomically.
    await updateBoardSettings(boardPath, {
      v2: {
        enabled: true,
        profileId: 'signboard_v2_migration',
        version: 1,
        stages: { ready: [' Ready ', 'Ready', 42] },
        dashboard: {
          sections: ['critical', 'next_best_work', 'blocked'],
          title: 'V2 dashboard',
          customDashboardKey: { preserved: true },
        },
        cardDefaults: { kind: 'discovery', priorityClass: 42, executionCeiling: 'not-a-ceiling', backgroundSelection: 'false' },
        validationPolicy: 'framework_v1',
        customProfileKey: { preserved: true },
        dashboardExtra: { preserved: true },
      },
    });
    const v2Settings = await readBoardSettings(boardPath);
    assert.strictEqual(v2Settings.v2.enabled, true);
    assert.strictEqual(v2Settings.v2.profileId, 'signboard_v2_migration');
    assert.deepStrictEqual(v2Settings.v2.stages.ready, ['Ready']);
    assert.deepStrictEqual(v2Settings.v2.dashboard.sections, ['priority', 'impact', 'blocked']);
    assert.strictEqual(v2Settings.v2.cardDefaults.kind, 'discovery');
    assert.strictEqual(v2Settings.v2.cardDefaults.priorityClass, 'P2');
    assert.strictEqual(v2Settings.v2.cardDefaults.executionCeiling, 'human_only');
    assert.strictEqual(v2Settings.v2.cardDefaults.backgroundSelection, false);
    assert.deepStrictEqual(v2Settings.v2.customProfileKey, { preserved: true });
    assert.deepStrictEqual(v2Settings.v2.dashboard.customDashboardKey, { preserved: true });

    await updateBoardSettings(boardPath, {
      v2: { dashboard: { description: 'Decide what deserves attention next.' } },
    });
    const mergedV2Settings = await readBoardSettings(boardPath);
    assert.strictEqual(mergedV2Settings.v2.enabled, true);
    assert.strictEqual(mergedV2Settings.v2.dashboard.title, 'V2 dashboard');
    assert.strictEqual(mergedV2Settings.v2.dashboard.description, 'Decide what deserves attention next.');
    assert.deepStrictEqual(mergedV2Settings.v2.customProfileKey, { preserved: true });

    const v2Raw = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    assert.strictEqual(v2Raw.settings.v2.enabled, true);
    assert.deepStrictEqual(v2Raw.settings.v2.customProfileKey, { preserved: true });

    v2Raw.customManifestKey = { preserved: true };
    await fs.writeFile(settingsPath, `${JSON.stringify(v2Raw, null, 2)}\n`, 'utf8');
    await updateBoardSettings(boardPath, { v2: { title: 'Updated V2 dashboard' } });
    const preservedManifest = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    assert.deepStrictEqual(preservedManifest.customManifestKey, { preserved: true });

    await updateBoardSettings(boardPath, {
      v2: { enabled: true, version: 2 },
    });
    const invalidV2Settings = await readBoardSettings(boardPath);
    assert.strictEqual(invalidV2Settings.v2.enabled, false, 'invalid profile versions must fail closed');
    const clearedRaw = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    assert(clearedRaw.settings.externalPublishedCalendar, 'board calendar publishing opt-out should be persisted');
    assert(clearedRaw.settings.obsidianBase, 'managed Obsidian Base metadata should be persisted');

    await writeOrderManifest(boardPath, ['first-list', 'second-list']);
    await updateBoardLabels(boardPath, updatedLabels);
    assert.deepStrictEqual((await readOrderManifest(boardPath)).order, ['first-list', 'second-list']);

    const legacyAppBoardPath = path.join(tmpDir, 'board-app-legacy');
    await fs.mkdir(legacyAppBoardPath, { recursive: true });
    await fs.writeFile(path.join(legacyAppBoardPath, 'board-settings.md'), [
      '---',
      'labels:',
      '  - id: "legacy-app"',
      '    name: "Legacy App"',
      '    colorLight: "#22c55e"',
      '    colorDark: "#16a34a"',
      'notifications:',
      '  enabled: true',
      '  time: "08:30"',
      'tooltipsEnabled: false',
      '---',
    ].join('\n'), 'utf8');

    const legacyAppSettings = await readLegacyBoardAppSettings(legacyAppBoardPath);
    assert.deepStrictEqual(legacyAppSettings.notifications, { enabled: true, time: '08:30' });
    assert.strictEqual(legacyAppSettings.tooltipsEnabled, false);
    assert.strictEqual(legacyAppSettings.hasLegacyAppSettings, true);
    await readBoardSettings(legacyAppBoardPath);
    const legacyAppRaw = JSON.parse(await fs.readFile(path.join(legacyAppBoardPath, '.board.json'), 'utf8'));
    assert(!legacyAppRaw.settings.notifications, 'legacy app notification settings should be removed on rewrite');
    assert(!legacyAppRaw.settings.tooltipsEnabled, 'legacy app tooltip settings should be removed on rewrite');

    // 5) Legacy labels.md file should be migrated to .board.json.
    const legacyBoardPath = path.join(tmpDir, 'board-two');
    await fs.mkdir(legacyBoardPath, { recursive: true });
    const legacySource = [
      '---',
      'labels:',
      '  - id: "legacy-1"',
      '    name: "Legacy"',
      '    colorLight: "#22c55e"',
      '    colorDark: "#16a34a"',
      '---',
    ].join('\n');
    await fs.writeFile(path.join(legacyBoardPath, 'labels.md'), legacySource, 'utf8');

    const migrated = await readBoardSettings(legacyBoardPath);
    assert.strictEqual(migrated.labels[0].id, 'legacy-1');
    const migratedRaw = JSON.parse(await fs.readFile(path.join(legacyBoardPath, '.board.json'), 'utf8'));
    assert.strictEqual(migratedRaw.settings.labels[0].id, 'legacy-1');

    // 6) Filtering is OR-based.
    assert.strictEqual(cardMatchesLabelFilter(['label-1'], []), true);
    assert.strictEqual(cardMatchesLabelFilter([], ['label-1']), false);
    assert.strictEqual(cardMatchesLabelFilter(['label-2', 'label-9'], ['label-1', 'label-2']), true);
    assert.strictEqual(cardMatchesLabelFilter(['label-3'], ['label-1', 'label-2']), false);

    // 7) Workflow settings detect common completed-list names while preserving manual overrides.
    assert.strictEqual(isAutoDetectedCompletedListName('004-Done-abc12'), true);
    assert.strictEqual(isAutoDetectedCompletedListName('003-Completed-stock'), true);
    assert.strictEqual(isAutoDetectedCompletedListName('002-Doing-abc12'), false);
    assert.strictEqual(isCompletedListByWorkflow('004-Done-abc12', defaults.workflow), true);
    assert.strictEqual(isCompletedListByWorkflow('002-Doing-abc12', defaults.workflow), false);
    assert.strictEqual(isCompletedListByWorkflow('004-Done-abc12', {
      autoDetectCompletedLists: true,
      completedListNames: [],
      ignoredCompletedListNames: ['004-Done-abc12'],
    }), false);
    assert.strictEqual(isCompletedListByWorkflow('002-Doing-abc12', {
      autoDetectCompletedLists: false,
      completedListNames: ['002-Doing-abc12'],
    }), true);

    console.log('Board label tests passed.');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error('Board label tests failed.');
  console.error(error);
  process.exitCode = 1;
});
