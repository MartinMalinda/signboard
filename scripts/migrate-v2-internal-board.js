const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { atomicWriteFile } = require('../lib/atomicFile');

const BOARD_ROOT = path.resolve(__dirname, '..', 'tasks', 'signboard-v2-migration');
const V2_FIELDS = [
  'id',
  'kind',
  'priority_class',
  'parent',
  'depends_on',
  'blocked_by',
  'blocked_on_decision',
  'estimate',
  'opportunity',
  'risk_prevented',
  'discovery_value',
  'modifiers',
  'delivery',
];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]));
  return value;
}

async function collectCardFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectCardFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function parseCard(raw, filePath) {
  const match = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing YAML frontmatter: ${filePath}`);
  const frontmatter = yaml.load(match[1]) || {};
  if (!isObject(frontmatter)) throw new Error(`Frontmatter must be an object: ${filePath}`);
  return { frontmatter, frontmatterSource: match[1], headerEnd: match[0].length };
}

function buildV2Metadata(frontmatter) {
  const metadata = { contract_version: 1 };
  for (const field of V2_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(frontmatter, field)) {
      metadata[field] = cloneValue(frontmatter[field]);
    }
  }

  return metadata;
}

function appendV2Frontmatter(raw, metadata) {
  const match = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const newline = String(raw).includes('\r\n') ? '\r\n' : '\n';
  const serialized = yaml.dump({ signboard_v2: metadata }, {
    noRefs: true,
    lineWidth: -1,
    noCompatMode: true,
    indent: 2,
  }).trimEnd().replace(/\n/g, newline);
  const markerStart = match.index + match[0].length - 3;
  const beforeMarker = raw.slice(0, markerStart).replace(/\r?\n$/, '');
  const afterMarker = raw.slice(markerStart + 3).replace(/^\r?\n/, '');
  return `${beforeMarker}${newline}${serialized}${newline}---${afterMarker ? `${newline}${afterMarker}` : ''}`;
}

function validateMetadata(metadata, filePath) {
  if (!isObject(metadata) || metadata.contract_version !== 1) {
    throw new Error(`Invalid signboard_v2 contract: ${filePath}`);
  }
  for (const field of ['kind', 'priority_class']) {
    if (typeof metadata[field] !== 'string' || !metadata[field].trim()) {
      throw new Error(`Missing signboard_v2.${field}: ${filePath}`);
    }
  }
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const checkOnly = process.argv.includes('--check');
  const files = await collectCardFiles(BOARD_ROOT);
  const cards = [];
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    cards.push({ filePath, raw, ...parseCard(raw, filePath) });
  }
  let migrated = 0;
  let alreadyCurrent = 0;

  for (const card of cards) {
    const existing = card.frontmatter.signboard_v2;
    if (existing) {
      validateMetadata(existing, card.filePath);
      alreadyCurrent += 1;
      continue;
    }

    if (checkOnly) {
      throw new Error(`Missing signboard_v2 metadata: ${card.filePath}`);
    }

    const metadata = buildV2Metadata(card.frontmatter);
    validateMetadata(metadata, card.filePath);
    migrated += 1;
    if (shouldWrite) {
      await atomicWriteFile(card.filePath, appendV2Frontmatter(card.raw, metadata), 'utf8');
    }
  }

  const mode = shouldWrite ? 'Migrated' : (checkOnly ? 'Validated' : 'Would migrate');
  console.log(`${mode} ${migrated} cards; ${alreadyCurrent} already had V2 metadata.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
