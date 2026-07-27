const assert = require('assert');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { insertCardFileAtTop, reorderCardFilesInList, reorderListDirectories } = require('../lib/cardOrdering');
const { readOrderManifest } = require('../lib/orderManifest');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function listVisibleEntries(directoryPath) {
  return (await fs.readdir(directoryPath))
    .filter((name) => !name.startsWith('.'))
    .sort();
}

async function testInsertCardFileAtTop() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-card-ordering-'));
  const sourceList = path.join(root, '000-Source-stock');
  const targetList = path.join(root, '001-Target-stock');

  try {
    await fs.mkdir(sourceList, { recursive: true });
    await fs.mkdir(targetList, { recursive: true });
    const sourcePath = path.join(sourceList, 'moving-card-stock.md');
    await fs.writeFile(sourcePath, 'moving', 'utf8');
    await fs.writeFile(path.join(targetList, 'existing-card-stock.md'), 'existing', 'utf8');
    await fs.writeFile(path.join(targetList, 'second-card-stock.md'), 'second', 'utf8');

    const insertedFileName = await insertCardFileAtTop(targetList, sourcePath, path.basename(sourcePath));

    assert.strictEqual(insertedFileName, 'moving-card-stock.md');
    assert.deepStrictEqual(await listVisibleEntries(targetList), [
      'existing-card-stock.md',
      'moving-card-stock.md',
      'second-card-stock.md',
    ]);
    assert.strictEqual(await pathExists(sourcePath), false);
    assert.deepStrictEqual((await readOrderManifest(targetList)).order, [
      'moving-card-stock.md',
      'existing-card-stock.md',
      'second-card-stock.md',
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testReorderCardFilesInList() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-card-reorder-'));
  const listPath = path.join(root, 'To-do');

  try {
    await fs.mkdir(listPath, { recursive: true });
    const first = path.join(listPath, 'first-card-aaaaa.md');
    const second = path.join(listPath, 'second-card-bbbbb.md');
    const third = path.join(listPath, 'third-card-ccccc.md');
    await fs.writeFile(first, 'first', 'utf8');
    await fs.writeFile(second, 'second', 'utf8');
    await fs.writeFile(third, 'third', 'utf8');

    const result = await reorderCardFilesInList(listPath, [third, first, second]);

    assert.deepStrictEqual(result.map((entry) => entry.cardFile), [
      'third-card-ccccc.md',
      'first-card-aaaaa.md',
      'second-card-bbbbb.md',
    ]);
    assert.deepStrictEqual(await listVisibleEntries(listPath), [
      'first-card-aaaaa.md',
      'second-card-bbbbb.md',
      'third-card-ccccc.md',
    ]);
    assert.deepStrictEqual((await readOrderManifest(listPath)).order, [
      'third-card-ccccc.md',
      'first-card-aaaaa.md',
      'second-card-bbbbb.md',
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testReorderCardFilesAcrossLists() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-card-cross-reorder-'));
  const sourceList = path.join(root, 'Source');
  const targetList = path.join(root, 'Target');

  try {
    await fs.mkdir(sourceList, { recursive: true });
    await fs.mkdir(targetList, { recursive: true });
    const sourcePath = path.join(sourceList, 'moving-card-ddddd.md');
    const existingPath = path.join(targetList, 'existing-card-aaaaa.md');
    const secondPath = path.join(targetList, 'second-card-bbbbb.md');
    await fs.writeFile(sourcePath, 'moving', 'utf8');
    await fs.writeFile(existingPath, 'existing', 'utf8');
    await fs.writeFile(secondPath, 'second', 'utf8');

    const result = await reorderCardFilesInList(targetList, [existingPath, sourcePath, secondPath]);

    assert.deepStrictEqual(result.map((entry) => entry.cardFile), [
      'existing-card-aaaaa.md',
      'moving-card-ddddd.md',
      'second-card-bbbbb.md',
    ]);
    assert.deepStrictEqual(await listVisibleEntries(targetList), [
      'existing-card-aaaaa.md',
      'moving-card-ddddd.md',
      'second-card-bbbbb.md',
    ]);
    assert.strictEqual(await pathExists(sourcePath), false);
    assert.deepStrictEqual((await readOrderManifest(targetList)).order, [
      'existing-card-aaaaa.md',
      'moving-card-ddddd.md',
      'second-card-bbbbb.md',
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testReorderListDirectories() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'signboard-list-reorder-'));

  try {
    const todo = path.join(root, 'To-do');
    const doing = path.join(root, 'Doing');
    const done = path.join(root, 'Done');
    await fs.mkdir(todo, { recursive: true });
    await fs.mkdir(doing, { recursive: true });
    await fs.mkdir(done, { recursive: true });
    await fs.writeFile(path.join(todo, 'todo-card.md'), 'todo', 'utf8');

    const result = await reorderListDirectories(root, [done, todo, doing]);

    assert.deepStrictEqual(result.map((entry) => entry.listDirectoryName), ['Done', 'To-do', 'Doing']);
    assert.deepStrictEqual(await listVisibleEntries(root), ['Doing', 'Done', 'To-do']);
    assert.strictEqual(await pathExists(path.join(todo, 'todo-card.md')), true);
    assert.deepStrictEqual((await readOrderManifest(root)).order, ['Done', 'To-do', 'Doing']);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function run() {
  await testInsertCardFileAtTop();
  await testReorderCardFilesInList();
  await testReorderCardFilesAcrossLists();
  await testReorderListDirectories();
  console.log('Card ordering tests passed.');
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
