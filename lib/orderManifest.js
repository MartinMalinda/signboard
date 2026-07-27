const fs = require('fs').promises;
const path = require('path');
const { atomicWriteFile } = require('./atomicFile');

const ORDER_MANIFEST_FILE = '.board.json';
const LEGACY_ORDER_MANIFEST_FILE = '.list.json';
const LEGACY_ORDER_MANIFEST_FILES = [LEGACY_ORDER_MANIFEST_FILE, '.signboard-order.json'];
const ORDER_MANIFEST_VERSION = 1;

const entrySortCollator = new Intl.Collator(undefined, {
  usage: 'sort',
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true,
  localeMatcher: 'lookup',
});

function getOrderManifestPath(directoryPath) {
  return path.join(path.resolve(directoryPath), ORDER_MANIFEST_FILE);
}

function getLegacyOrderManifestPaths(directoryPath) {
  const resolvedDirectory = path.resolve(directoryPath);
  return LEGACY_ORDER_MANIFEST_FILES.map((fileName) => path.join(resolvedDirectory, fileName));
}

function normalizeEntryName(value) {
  const name = String(value || '').trim();
  if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    return '';
  }
  return name;
}

function uniqueNames(names) {
  const seen = new Set();
  const result = [];

  for (const rawName of Array.isArray(names) ? names : []) {
    const name = normalizeEntryName(rawName);
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    result.push(name);
  }

  return result;
}

async function readManifestFile(manifestPath) {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const order = uniqueNames(parsed.order);
    return {
      version: Number(parsed.version) || ORDER_MANIFEST_VERSION,
      order,
      data: parsed,
      sourcePath: manifestPath,
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

async function readOrderManifest(directoryPath) {
  const currentManifest = await readManifestFile(getOrderManifestPath(directoryPath));
  if (currentManifest) {
    return currentManifest;
  }

  for (const legacyManifestPath of getLegacyOrderManifestPaths(directoryPath)) {
    const legacyManifest = await readManifestFile(legacyManifestPath);
    if (legacyManifest) {
      return legacyManifest;
    }
  }

  return null;
}

async function listDirectoryEntries(directoryPath, predicate) {
  const entries = await fs.readdir(path.resolve(directoryPath), { withFileTypes: true });
  return entries
    .filter((entry) => (typeof predicate === 'function' ? predicate(entry) : true))
    .map((entry) => entry.name);
}

async function listOrderedEntries(directoryPath, predicate, options = {}) {
  const candidates = uniqueNames(await listDirectoryEntries(directoryPath, predicate));
  const candidateSet = new Set(candidates);
  const manifest = await readOrderManifest(directoryPath);
  const ordered = [];
  const seen = new Set();

  if (manifest) {
    for (const name of manifest.order) {
      if (candidateSet.has(name) && !seen.has(name)) {
        seen.add(name);
        ordered.push(name);
      }
    }
  }

  const unlisted = candidates
    .filter((name) => !seen.has(name))
    .sort((left, right) => entrySortCollator.compare(left, right));
  ordered.push(...unlisted);

  if (options.writeManifest === true) {
    await writeOrderManifest(directoryPath, ordered);
  }

  return ordered;
}

async function writeOrderManifest(directoryPath, orderedNames) {
  const existing = await readOrderManifest(directoryPath);
  const existingData = existing && existing.data && typeof existing.data === 'object'
    ? existing.data
    : {};
  const payload = {
    ...existingData,
    version: ORDER_MANIFEST_VERSION,
    order: uniqueNames(orderedNames),
  };

  await atomicWriteFile(
    getOrderManifestPath(directoryPath),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );

  for (const legacyManifestPath of getLegacyOrderManifestPaths(directoryPath)) {
    if (legacyManifestPath !== getOrderManifestPath(directoryPath)) {
      await fs.rm(legacyManifestPath, { force: true });
    }
  }

  return payload;
}

async function updateOrderManifest(directoryPath, update = {}) {
  const predicate = typeof update.predicate === 'function' ? update.predicate : undefined;
  const currentEntries = uniqueNames(await listDirectoryEntries(directoryPath, predicate));
  const currentSet = new Set(currentEntries);
  const existing = await listOrderedEntries(directoryPath, predicate);
  const requested = Array.isArray(update.order) ? update.order : existing;
  const nextOrder = uniqueNames(requested).filter((name) => currentSet.has(name));

  for (const name of currentEntries) {
    if (!nextOrder.includes(name)) {
      nextOrder.push(name);
    }
  }

  return writeOrderManifest(directoryPath, nextOrder);
}

async function removeFromOrderManifest(directoryPath, entryNames) {
  const manifest = await readOrderManifest(directoryPath);
  if (!manifest) {
    return null;
  }

  const removed = new Set(uniqueNames(entryNames));
  return writeOrderManifest(directoryPath, manifest.order.filter((name) => !removed.has(name)));
}

async function moveOrderManifestEntry(
  sourceDirectoryPath,
  sourceEntryName,
  targetDirectoryPath,
  targetEntryName,
  predicate,
) {
  const sourceDirectory = path.resolve(sourceDirectoryPath);
  const targetDirectory = path.resolve(targetDirectoryPath);
  const sourceManifest = await readOrderManifest(sourceDirectory);
  const targetManifest = sourceDirectory === targetDirectory
    ? sourceManifest
    : await readOrderManifest(targetDirectory);
  const listOptions = { writeManifest: true };
  const sourceOrder = sourceManifest
    ? [...sourceManifest.order]
    : await listOrderedEntries(sourceDirectory, predicate, listOptions);
  const targetOrder = sourceDirectory === targetDirectory
    ? sourceOrder
    : targetManifest
      ? [...targetManifest.order]
      : await listOrderedEntries(targetDirectory, predicate, listOptions);

  const sourceIndex = sourceOrder.indexOf(sourceEntryName);
  const filteredSourceOrder = sourceOrder.filter((name) => name !== sourceEntryName && name !== targetEntryName);

  if (sourceDirectory === targetDirectory) {
    const insertAt = sourceIndex >= 0 ? Math.min(sourceIndex, filteredSourceOrder.length) : filteredSourceOrder.length;
    filteredSourceOrder.splice(insertAt, 0, targetEntryName);
    await writeOrderManifest(sourceDirectory, filteredSourceOrder);
    return;
  }

  const filteredTargetOrder = targetOrder.filter((name) => name !== sourceEntryName && name !== targetEntryName);
  const insertAt = sourceIndex >= 0 ? Math.min(sourceIndex, filteredTargetOrder.length) : filteredTargetOrder.length;
  filteredTargetOrder.splice(insertAt, 0, targetEntryName);
  await writeOrderManifest(sourceDirectory, filteredSourceOrder);
  await writeOrderManifest(targetDirectory, filteredTargetOrder);
}

module.exports = {
  ORDER_MANIFEST_FILE,
  LEGACY_ORDER_MANIFEST_FILE,
  LEGACY_ORDER_MANIFEST_FILES,
  ORDER_MANIFEST_VERSION,
  getOrderManifestPath,
  listOrderedEntries,
  readOrderManifest,
  moveOrderManifestEntry,
  removeFromOrderManifest,
  updateOrderManifest,
  writeOrderManifest,
};
