const assert = require('assert');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const cardFrontmatter = require('../lib/cardFrontmatter');
const {
  normalizeTimestamp,
  readCardIfPresent,
  readCardWithTimestamps,
  resolveCardTimestamps,
} = require('../lib/cardTimestamps');

function createStats(values = {}) {
  return {
    birthtime: values.birthtime,
    ctime: values.ctime,
    mtime: values.mtime,
  };
}

async function run() {
  assert.strictEqual(
    normalizeTimestamp('2026-03-10T14:30:00.000Z'),
    '2026-03-10T14:30:00.000Z',
    'expected valid ISO timestamps to normalize',
  );
  assert.strictEqual(normalizeTimestamp('not a date'), '', 'expected invalid timestamps to be ignored');

  const frontmatterCreated = resolveCardTimestamps({
    createdAt: '2026-01-10T12:00:00.000Z',
    activity: [
      { type: 'created', at: '2026-01-09T12:00:00.000Z' },
    ],
  }, createStats({
    birthtime: new Date('2026-01-08T12:00:00.000Z'),
    ctime: new Date('2026-01-08T13:00:00.000Z'),
    mtime: new Date('2026-03-10T12:00:00.000Z'),
  }));

  assert.strictEqual(frontmatterCreated.createdAt, '2026-01-10T12:00:00.000Z');
  assert.strictEqual(frontmatterCreated.createdAtSource, 'frontmatter');
  assert.strictEqual(frontmatterCreated.updatedAt, '2026-03-10T12:00:00.000Z');

  const activityCreated = resolveCardTimestamps({
    activity: [
      { type: 'created', at: '2026-01-09T12:00:00.000Z' },
    ],
  }, createStats({
    birthtime: new Date('2026-01-08T12:00:00.000Z'),
    ctime: new Date('2026-01-08T13:00:00.000Z'),
    mtime: new Date('2026-03-10T12:00:00.000Z'),
  }));

  assert.strictEqual(activityCreated.createdAt, '2026-01-09T12:00:00.000Z');
  assert.strictEqual(activityCreated.createdAtSource, 'activity');

  const legacyCreated = resolveCardTimestamps({}, createStats({
    birthtime: new Date('2026-01-08T12:00:00.000Z'),
    ctime: new Date('2026-01-08T13:00:00.000Z'),
    mtime: new Date('2026-03-10T12:00:00.000Z'),
  }));

  assert.strictEqual(legacyCreated.createdAt, '2026-01-08T12:00:00.000Z');
  assert.strictEqual(legacyCreated.createdAtSource, 'filesystem');

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-card-timestamps-'));
  const cardPath = path.join(directory, 'card.md');
  try {
    await cardFrontmatter.writeCard(cardPath, { frontmatter: { title: 'Present' }, body: 'Body' });
    const card = await readCardWithTimestamps(cardPath);
    assert.strictEqual(card.frontmatter.title, 'Present');
    assert(card.timestamps.updatedAt, 'expected a present card to include filesystem timestamps');

    await fs.unlink(cardPath);
    assert.deepStrictEqual(await readCardIfPresent(cardPath), {
      missing: true,
      requestedPath: cardPath,
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }

  console.log('Card timestamp tests passed.');
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
