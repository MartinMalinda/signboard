const path = require('path');
const boardLabels = require('./boardLabels');
const cardFrontmatter = require('./cardFrontmatter');
const { isMissingPathError, readCardWithTimestamps } = require('./cardTimestamps');
const { listOrderedEntries } = require('./orderManifest');
const {
  parseTaskListItems,
} = require('./taskList');
const { evaluate: evaluateV2Card } = require('../shared/v2Evaluator');
const { resolveV2StageSemantics } = require('../shared/v2StageSemantics');

const ARCHIVE_DIRECTORY_NAME = 'XXX-Archive';
const V2_PRIORITY_CLASSES = new Set(['P0', 'P1', 'P2', 'P3']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneSnapshotValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneSnapshotValue);
  }
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, cloneSnapshotValue(nestedValue)]));
  }
  return value;
}

function normalizeV2MetadataValue(source, key, normalizer) {
  if (Object.prototype.hasOwnProperty.call(source, key)) {
    return normalizer(source[key]);
  }
  return undefined;
}

function buildV2CardProjection(frontmatter, cardName, listName, profile) {
  const rawMetadata = frontmatter && frontmatter.signboard_v2;
  const hasMetadata = Boolean(frontmatter && Object.prototype.hasOwnProperty.call(frontmatter, 'signboard_v2'));
  const metadataObject = isObject(rawMetadata) ? rawMetadata : {};
  const contractVersionIsValid = isObject(rawMetadata) && rawMetadata.contract_version === 1;
  const metadataWarnings = [];
  if (!hasMetadata) {
    metadataWarnings.push('V2_METADATA_MISSING');
  } else if (!contractVersionIsValid) {
    metadataWarnings.push('INVALID_V2_CONTRACT_VERSION');
  }

  const stageSemantics = resolveV2StageSemantics(profile, listName);
  const status = stageSemantics.stage;
  if (!stageSemantics.mapped) {
    metadataWarnings.push('V2_STAGE_UNMAPPED');
  } else if (stageSemantics.ambiguous) {
    metadataWarnings.push('V2_STAGE_AMBIGUOUS');
  }
  const source = contractVersionIsValid ? cloneSnapshotValue(metadataObject) : {};
  const cardDefaults = isObject(profile && profile.cardDefaults) ? profile.cardDefaults : {};
  const hasPriorityClass = Object.prototype.hasOwnProperty.call(source, 'priority_class');
  const normalizedPriorityClass = hasPriorityClass
    ? normalizeV2MetadataValue(source, 'priority_class', (value) => {
      const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
      return V2_PRIORITY_CLASSES.has(normalized) ? normalized : null;
    })
    : (cardDefaults.priorityClass || null);
  if (hasPriorityClass && normalizedPriorityClass === null) metadataWarnings.push('INVALID_PRIORITY');
  const hasKind = Object.prototype.hasOwnProperty.call(source, 'kind');
  const normalizedKind = hasKind
    ? normalizeV2MetadataValue(source, 'kind', (value) => typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null)
    : (cardDefaults.kind || null);
  if (hasKind && normalizedKind === null) metadataWarnings.push('INVALID_KIND');
  const metadata = {
    ...source,
    source: hasMetadata ? 'signboard_v2' : 'legacy',
    present: hasMetadata,
    valid: contractVersionIsValid,
    contract_version: contractVersionIsValid ? 1 : (hasMetadata && isObject(rawMetadata) ? rawMetadata.contract_version ?? null : null),
    id: typeof source.id === 'string' && source.id.trim()
      ? source.id.trim()
      : (typeof frontmatter.id === 'string' && frontmatter.id.trim() ? frontmatter.id.trim() : cardName),
    kind: normalizedKind,
    priority_class: normalizedPriorityClass,
    status,
    stage: status,
  };

  const evaluationInput = contractVersionIsValid
    ? metadata
    : { id: metadata.id, status };
  const evaluation = evaluateV2Card(evaluationInput);

  return {
    score_version: evaluation.score_version,
    metadata,
    normalized: evaluation.normalized,
    scores: evaluation.scores,
    score_ranges: evaluation.score_ranges,
    explanations: evaluation.explanations,
    eligibility: evaluation.gates,
    classes: evaluation.classes,
    sections: evaluation.sections,
    missing_fields: evaluation.missing_fields,
    defaults_applied: evaluation.defaults_applied,
    warnings: [...metadataWarnings, ...evaluation.warnings],
    stageSemantics,
  };
}

function normalizeSnapshotError(error, targetPath) {
  return {
    path: targetPath,
    code: error && typeof error.code === 'string' ? error.code : '',
    message: error && typeof error.message === 'string' ? error.message : String(error || 'Unknown error'),
  };
}

function getTaskSummaryFromItems(items) {
  const taskItems = Array.isArray(items) ? items : [];
  let completed = 0;

  for (const item of taskItems) {
    if (item && item.isCompleted) {
      completed += 1;
    }
  }

  return {
    total: taskItems.length,
    completed,
    remaining: Math.max(0, taskItems.length - completed),
  };
}

function collectTaskDateValues(items, fieldName, options = {}) {
  const taskItems = Array.isArray(items) ? items : [];
  const includeCompleted = options.includeCompleted === true;
  const values = new Set();

  for (const item of taskItems) {
    if (!item || (!includeCompleted && item.isCompleted)) {
      continue;
    }

    const value = String(item[fieldName] || '').trim();
    if (value) {
      values.add(value);
    }
  }

  return [...values].sort();
}

async function listBoardDirectories(boardRoot, options = {}) {
  const includeArchive = options.includeArchive === true;
  return listOrderedEntries(
    boardRoot,
    (entry) => entry.isDirectory() && (includeArchive || entry.name !== ARCHIVE_DIRECTORY_NAME),
    { writeManifest: options.writeManifest !== false && !includeArchive },
  );
}

async function listMarkdownCardFileNames(listPath, options = {}) {
  return listOrderedEntries(
    listPath,
    (entry) => entry.isFile() && entry.name.endsWith('.md'),
    { writeManifest: options.writeManifest !== false },
  );
}

async function readSnapshotCard(cardPath, cardName, listName, errors, options = {}) {
  const includeTimestamps = options.includeTimestamps !== false;
  const includeTaskItems = options.includeTaskItems !== false;

  try {
    const card = includeTimestamps
      ? await readCardWithTimestamps(cardPath)
      : await cardFrontmatter.readCard(cardPath);
    const body = String(card && typeof card.body === 'string' ? card.body : '');
    const taskItems = parseTaskListItems(body);
    const snapshotCard = {
      cardName,
      cardPath,
      displayTitle: cardFrontmatter.getCardDisplayTitle(card?.frontmatter?.title, cardName),
      frontmatter: card && card.frontmatter && typeof card.frontmatter === 'object'
        ? card.frontmatter
        : {},
      body,
      taskSummary: getTaskSummaryFromItems(taskItems),
      taskStartDates: collectTaskDateValues(taskItems, 'start', { includeCompleted: true }),
      incompleteTaskStartDates: collectTaskDateValues(taskItems, 'start'),
      taskDueDates: collectTaskDateValues(taskItems, 'due', { includeCompleted: true }),
      incompleteTaskDueDates: collectTaskDateValues(taskItems, 'due'),
    };

    if (includeTimestamps) {
      snapshotCard.timestamps = card && card.timestamps && typeof card.timestamps === 'object'
        ? card.timestamps
        : {};
    }

    if (includeTaskItems) {
      snapshotCard.taskItems = taskItems;
    }

    if (options.v2Profile) {
      snapshotCard.v2 = buildV2CardProjection(snapshotCard.frontmatter, cardName, listName, options.v2Profile);
    }

    return snapshotCard;
  } catch (error) {
    if (!isMissingPathError(error)) errors.push(normalizeSnapshotError(error, cardPath));
    return null;
  }
}

async function readSnapshotList(boardRoot, listName, errors, options = {}) {
  const listPath = path.join(boardRoot, listName);
  let cardNames = [];

  try {
    cardNames = await listMarkdownCardFileNames(listPath, options);
  } catch (error) {
    if (isMissingPathError(error)) return null;
    errors.push(normalizeSnapshotError(error, listPath));
  }

  const cards = (await Promise.all(
      cardNames.map((cardName) => readSnapshotCard(path.join(listPath, cardName), cardName, listName, errors, options)),
  )).filter(Boolean);

  return {
    listName,
    listPath,
    cards,
  };
}

async function readBoardSnapshot(boardRoot, options = {}) {
  const normalizedBoardRoot = path.resolve(String(boardRoot || ''));
  const includeArchive = options.includeArchive === true;
  const includeV2 = options.includeV2 === true;
  const includeBoardSettings = options.includeBoardSettings !== false;
  const shouldReadBoardSettings = includeBoardSettings || includeV2;
  const snapshotOptions = {
    includeTimestamps: options.includeTimestamps !== false,
    includeTaskItems: options.includeTaskItems !== false,
    writeManifest: options.writeManifest !== false,
  };
  const errors = [];
  const [listNames, boardSettings] = await Promise.all([
    listBoardDirectories(normalizedBoardRoot, {
      includeArchive,
      writeManifest: snapshotOptions.writeManifest,
    }),
    shouldReadBoardSettings
      ? boardLabels.readBoardSettings(normalizedBoardRoot, {
        ensureFile: options.ensureBoardSettings !== false,
      }).catch((error) => {
        errors.push(normalizeSnapshotError(error, path.join(normalizedBoardRoot, boardLabels.SETTINGS_FILE_NAME)));
        return null;
      })
      : Promise.resolve(null),
  ]);
  const v2Profile = includeV2 && boardSettings && boardSettings.v2 && boardSettings.v2.enabled === true
    ? boardSettings.v2
    : null;
  snapshotOptions.v2Profile = v2Profile;

  const lists = (await Promise.all(
    listNames.map((listName) => readSnapshotList(normalizedBoardRoot, listName, errors, snapshotOptions)),
  )).filter(Boolean);

  const snapshot = {
    ok: errors.length === 0,
    boardRoot: normalizedBoardRoot,
    boardName: path.basename(normalizedBoardRoot),
    boardSettings: includeBoardSettings && boardSettings
      ? cloneSnapshotValue(boardSettings)
      : null,
    lists,
    errors,
  };

  if (!includeV2 && snapshot.boardSettings) {
    delete snapshot.boardSettings.v2;
  }

  if (v2Profile) {
    snapshot.v2 = {
      profile: cloneSnapshotValue(v2Profile),
      cards: lists.flatMap((list) => list.cards
        .filter((card) => card && card.v2)
        .map((card) => ({
          listName: list.listName,
          cardName: card.cardName,
          cardPath: card.cardPath,
          ...card.v2,
        }))),
    };
  }

  return snapshot;
}

module.exports = {
  readBoardSnapshot,
};
