const fs = require('fs').promises;
const path = require('path');
const { atomicWriteFile } = require('./atomicFile');

const ORDER_MANIFEST_FILE = '.signboard-order.json';
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

async function readOrderManifest(directoryPath) {
  try {
    const raw = await fs.readFile(getOrderManifestPath(directoryPath), 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const order = uniqueNames(parsed.order);
    return {
      version: Number(parsed.version) || ORDER_MANIFEST_VERSION,
      order,
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
  const payload = {
    version: ORDER_MANIFEST_VERSION,
    order: uniqueNames(orderedNames),
  };

  await atomicWriteFile(
    getOrderManifestPath(directoryPath),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );

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

module.exports = {
  ORDER_MANIFEST_FILE,
  ORDER_MANIFEST_VERSION,
  getOrderManifestPath,
  listOrderedEntries,
  readOrderManifest,
  removeFromOrderManifest,
  updateOrderManifest,
  writeOrderManifest,
};
