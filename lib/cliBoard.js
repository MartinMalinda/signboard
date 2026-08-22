const fs = require('fs').promises;
const path = require('path');
const cardFrontmatter = require('./cardFrontmatter');
const boardLabels = require('./boardLabels');
const { insertCardFileAtTop } = require('./cardOrdering');
const { listOrderedEntries, moveOrderManifestEntry, writeOrderManifest } = require('./orderManifest');
const { prepareNewCardFrontmatter, recordCardListMove: applyCardListMove } = require('./cardLifecycle');
const { resolveCardTimestamps } = require('./cardTimestamps');
const { getCardDisplayTitle } = require('./cardTitle');
const {
  appendNote,
  insertAfterHeading,
  replaceSection,
} = require('./cardBodyEdits');
const {
  parseIsoDateStringToLocalDate,
  getTaskListSummary,
  getTaskListStartDates,
  getIncompleteTaskListStartDates,
  getTaskListDueDates,
  getIncompleteTaskListDueDates,
} = require('./taskList');

const ARCHIVE_DIRECTORY_NAME = 'XXX-Archive';
const LIST_NAME_PATTERN = /^(\d{3}-)(.*?)(-[^-]{5}|-stock)$/;
const CARD_ID_PATTERN = /-([A-Za-z0-9]{5})\.md$/;

const listSortCollator = new Intl.Collator(undefined, {
  usage: 'sort',
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true,
  localeMatcher: 'lookup',
});

const cardSortCollator = new Intl.Collator(undefined, {
  usage: 'sort',
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true,
  localeMatcher: 'lookup',
});

function normalizeBoardRoot(boardRoot) {
  const normalized = String(boardRoot || '').trim();
  if (!normalized) {
    throw new Error('boardRoot is required.');
  }

  return path.resolve(normalized);
}

async function ensureDirectory(directoryPath, label) {
  let stats;

  try {
    stats = await fs.stat(directoryPath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`${label} does not exist: ${directoryPath}`);
    }
    throw error;
  }

  if (!stats.isDirectory()) {
    throw new Error(`${label} is not a directory: ${directoryPath}`);
  }
}

async function ensureBoardRoot(boardRoot) {
  const resolved = normalizeBoardRoot(boardRoot);
  await ensureDirectory(resolved, 'Board root');
  return resolved;
}

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

function randomSuffix(length = 5) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let output = '';

  for (let index = 0; index < length; index += 1) {
    output += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return output;
}

function sanitizeListName(rawName) {
  const cleaned = String(rawName || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Untitled';
}

function sanitizeCardSlug(rawName) {
  const cleaned = String(rawName || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'untitled';
}

function getListDisplayName(listDirectoryName) {
  const normalized = String(listDirectoryName || '').trim();
  if (!normalized) {
    return 'Untitled';
  }

  if (normalized === ARCHIVE_DIRECTORY_NAME) {
    return 'Archive';
  }

  const match = normalized.match(LIST_NAME_PATTERN);
  if (match) {
    return String(match[2] || '').trim() || 'Untitled';
  }

  return normalized;
}

function getCardId(fileName) {
  const match = String(fileName || '').match(CARD_ID_PATTERN);
  return match ? match[1] : '';
}

function normalizeSearchTokens(query) {
  const normalized = String(query || '').trim().toLowerCase();
  return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
}

function cardMatchesSearch(record, query) {
  const tokens = normalizeSearchTokens(query);
  if (tokens.length === 0) {
    return true;
  }

  const haystack = `${String(record.title || '')}\n${String(record.body || '')}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function todayLocalDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toIsoDateString(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function createDateRangeEnd(startDate, daysAhead) {
  return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + daysAhead);
}

function startOfWeek(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const day = date.getDay();
  const mondayOffset = (day + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset);
}

function endOfWeek(dateValue) {
  const start = startOfWeek(dateValue);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
}

function compareOptionalIsoDates(left, right) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left.localeCompare(right);
}

function getTimestampMs(value) {
  const parsed = Date.parse(String(value || '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareOptionalTimestamps(left, right, descending = false) {
  const leftMs = getTimestampMs(left);
  const rightMs = getTimestampMs(right);

  if (leftMs > 0 && rightMs > 0 && leftMs !== rightMs) {
    return descending ? rightMs - leftMs : leftMs - rightMs;
  }

  if (leftMs > 0 && rightMs <= 0) {
    return -1;
  }

  if (leftMs <= 0 && rightMs > 0) {
    return 1;
  }

  return 0;
}

function getCardSortTimestamp(record, fieldName) {
  const timestamps = record && record.timestamps && typeof record.timestamps === 'object'
    ? record.timestamps
    : {};

  return String(timestamps[fieldName] || (record && record[fieldName]) || '').trim();
}

function normalizeTaskStatus(taskStatusValue, dueFilterValue) {
  const normalizedDueFilter = String(dueFilterValue || '').trim().toLowerCase();
  const fallback = normalizedDueFilter === 'overdue' ? 'open' : 'any';

  if (taskStatusValue == null || taskStatusValue === '') {
    return fallback;
  }

  const normalizedTaskStatus = String(taskStatusValue || '').trim().toLowerCase();
  if (normalizedTaskStatus === 'open' || normalizedTaskStatus === 'any') {
    return normalizedTaskStatus;
  }

  throw new Error(`Unsupported task status filter: ${taskStatusValue}`);
}

function getDueDatesForRecord(record, dueSource = 'any', taskStatus = 'any') {
  const entries = [];
  const source = String(dueSource || 'any');
  const normalizedTaskStatus = normalizeTaskStatus(taskStatus);
  const taskDueDates = normalizedTaskStatus === 'open'
    ? (Array.isArray(record.incompleteTaskDueDates) ? record.incompleteTaskDueDates : record.taskDueDates)
    : record.taskDueDates;

  if ((source === 'any' || source === 'card') && record.due) {
    entries.push({ source: 'card', date: record.due });
  }

  if (source === 'any' || source === 'task') {
    for (const taskDate of Array.isArray(taskDueDates) ? taskDueDates : []) {
      entries.push({ source: 'task', date: taskDate });
    }
  }

  return entries;
}

function buildDueMatcher(dueFilterValue) {
  const raw = String(dueFilterValue || '').trim().toLowerCase();
  if (!raw || raw === 'any') {
    return null;
  }

  const today = todayLocalDate();
  const todayIso = toIsoDateString(today);
  const tomorrowIso = toIsoDateString(createDateRangeEnd(today, 1));
  const thisWeekEndIso = toIsoDateString(endOfWeek(today));

  if (raw === 'none') {
    return (dates) => dates.length === 0;
  }

  if (raw === 'today') {
    return (dates) => dates.some((entry) => entry.date === todayIso);
  }

  if (raw === 'tomorrow') {
    return (dates) => dates.some((entry) => entry.date === tomorrowIso);
  }

  if (raw === 'overdue') {
    return (dates) => dates.some((entry) => entry.date < todayIso);
  }

  if (raw === 'upcoming') {
    return (dates) => dates.some((entry) => entry.date >= todayIso);
  }

  if (raw === 'this-week') {
    return (dates) => dates.some((entry) => entry.date >= todayIso && entry.date <= thisWeekEndIso);
  }

  const nextMatch = raw.match(/^next:(\d+)$/);
  if (nextMatch) {
    const days = Number(nextMatch[1]);
    const endIso = toIsoDateString(createDateRangeEnd(today, days));
    return (dates) => dates.some((entry) => entry.date >= todayIso && entry.date <= endIso);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return (dates) => dates.some((entry) => entry.date === raw);
  }

  throw new Error(`Unsupported due filter: ${dueFilterValue}`);
}

async function listLists(boardRoot, options = {}) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const includeArchive = options.includeArchive === true;
  const withCardCounts = options.withCardCounts !== false;
  const lists = [];

  const directoryNames = await listOrderedEntries(
    resolvedBoardRoot,
    (entry) => entry.isDirectory() && (includeArchive || entry.name !== ARCHIVE_DIRECTORY_NAME),
    { writeManifest: true },
  );

  for (const directoryName of directoryNames) {
    const isArchive = directoryName === ARCHIVE_DIRECTORY_NAME;

    const listPath = path.join(resolvedBoardRoot, directoryName);
    let cardCount = null;

    if (withCardCounts) {
      const cardNames = await listOrderedEntries(
        listPath,
        (entry) => entry.isFile() && entry.name.endsWith('.md'),
        { writeManifest: true },
      );
      cardCount = cardNames.length;
    }

    lists.push({
      directoryName,
      displayName: getListDisplayName(directoryName),
      path: listPath,
      isArchive,
      cardCount,
    });
  }

  return lists;
}

function normalizeMatchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveUniqueMatch(items, ref, matchers, label) {
  const normalizedRef = normalizeMatchValue(ref);
  if (!normalizedRef) {
    throw new Error(`${label} reference is required.`);
  }

  for (const matcher of matchers) {
    const exactMatches = items.filter((item) => matcher(item, normalizedRef, true));
    if (exactMatches.length === 1) {
      return exactMatches[0];
    }
    if (exactMatches.length > 1) {
      throw new Error(`Ambiguous ${label} reference "${ref}".`);
    }
  }

  for (const matcher of matchers) {
    const partialMatches = items.filter((item) => matcher(item, normalizedRef, false));
    if (partialMatches.length === 1) {
      return partialMatches[0];
    }
    if (partialMatches.length > 1) {
      throw new Error(`Ambiguous ${label} reference "${ref}".`);
    }
  }

  throw new Error(`Could not find ${label}: ${ref}`);
}

async function resolveList(boardRoot, listRef, options = {}) {
  const lists = await listLists(boardRoot, {
    includeArchive: options.includeArchive === true,
    withCardCounts: options.withCardCounts,
  });

  return resolveUniqueMatch(
    lists,
    listRef,
    [
      (item, ref, exact) => {
        const value = normalizeMatchValue(item.directoryName);
        return exact ? value === ref : value.includes(ref);
      },
      (item, ref, exact) => {
        const value = normalizeMatchValue(item.displayName);
        return exact ? value === ref : value.includes(ref);
      },
    ],
    'list',
  );
}

async function createList(boardRoot, listName) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const sanitizedName = sanitizeListName(String(listName || '').slice(0, 25));
  const directoryName = sanitizedName;
  const listPath = path.join(resolvedBoardRoot, directoryName);

  await fs.mkdir(listPath);
  const orderedLists = await listOrderedEntries(
    resolvedBoardRoot,
    (entry) => entry.isDirectory() && entry.name !== ARCHIVE_DIRECTORY_NAME,
    { writeManifest: true },
  );
  if (!orderedLists.includes(directoryName)) {
    await writeOrderManifest(resolvedBoardRoot, [...orderedLists, directoryName]);
  }

  return {
    boardRoot: resolvedBoardRoot,
    directoryName,
    displayName: getListDisplayName(directoryName),
    path: listPath,
  };
}

async function renameList(boardRoot, listRef, newName) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const listEntry = await resolveList(resolvedBoardRoot, listRef, { includeArchive: true });

  if (listEntry.isArchive) {
    throw new Error('Archive list cannot be renamed.');
  }

  const match = listEntry.directoryName.match(LIST_NAME_PATTERN);
  const sanitizedName = sanitizeListName(newName);
  const nextDirectoryName = match
    ? `${match[1]}${sanitizedName}${match[3]}`
    : sanitizedName;
  if (nextDirectoryName === listEntry.directoryName) {
    return {
      before: listEntry,
      after: listEntry,
      changed: false,
    };
  }

  const nextPath = path.join(resolvedBoardRoot, nextDirectoryName);
  if (await pathExists(nextPath)) {
    throw new Error(`A list already exists at ${nextDirectoryName}`);
  }

  await fs.rename(listEntry.path, nextPath);
  await moveOrderManifestEntry(
    resolvedBoardRoot,
    listEntry.directoryName,
    resolvedBoardRoot,
    nextDirectoryName,
    (entry) => entry.isDirectory() && entry.name !== ARCHIVE_DIRECTORY_NAME,
  );

  return {
    before: listEntry,
    after: {
      ...listEntry,
      directoryName: nextDirectoryName,
      displayName: getListDisplayName(nextDirectoryName),
      path: nextPath,
    },
    changed: true,
  };
}

async function loadCardRecord(boardRoot, listEntry, fileName) {
  const cardPath = path.join(listEntry.path, fileName);
  const [card, stats] = await Promise.all([
    cardFrontmatter.readCard(cardPath),
    fs.stat(cardPath),
  ]);
  const taskSummary = getTaskListSummary(card.body);
  const taskStartDates = getTaskListStartDates(card.body);
  const incompleteTaskStartDates = getIncompleteTaskListStartDates(card.body);
  const taskDueDates = getTaskListDueDates(card.body);
  const incompleteTaskDueDates = getIncompleteTaskListDueDates(card.body);
  const labels = Array.isArray(card.frontmatter.labels)
    ? card.frontmatter.labels.map((labelId) => String(labelId))
    : [];
  const timestamps = resolveCardTimestamps(card.frontmatter, stats);

  return {
    boardRoot,
    listDirectoryName: listEntry.directoryName,
    listDisplayName: listEntry.displayName,
    listPath: listEntry.path,
    fileName,
    filePath: cardPath,
    cardId: getCardId(fileName),
    title: getCardDisplayTitle(card.frontmatter.title, fileName),
    displayTitle: getCardDisplayTitle(card.frontmatter.title, fileName),
    body: card.body,
    start: String(card.frontmatter.start || '').trim(),
    due: String(card.frontmatter.due || '').trim(),
    labels,
    frontmatter: card.frontmatter,
    timestamps,
    taskSummary,
    taskStartDates,
    incompleteTaskStartDates,
    taskDueDates,
    incompleteTaskDueDates,
    mtimeMs: stats.mtimeMs,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  };
}

async function listCards(boardRoot, options = {}) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const includeArchive = options.includeArchive === true;
  const listRefs = Array.isArray(options.listRefs)
    ? options.listRefs.filter(Boolean)
    : (options.listRef ? [options.listRef] : []);
  const selectedLists = listRefs.length > 0
    ? await Promise.all(listRefs.map((listRef) => resolveList(resolvedBoardRoot, listRef, { includeArchive })))
    : await listLists(resolvedBoardRoot, { includeArchive, withCardCounts: false });
  const boardSettings = await boardLabels.readBoardSettings(resolvedBoardRoot, { ensureFile: false });
  const labelMap = new Map(boardSettings.labels.map((label) => [label.id, label.name]));
  const dueMatcher = buildDueMatcher(options.due);
  const dueSource = String(options.dueSource || 'any').toLowerCase();
  const taskStatus = normalizeTaskStatus(options.taskStatus, options.due);
  const labelMode = String(options.labelMode || 'any').toLowerCase() === 'all' ? 'all' : 'any';
  const labelIds = options.labelRefs && options.labelRefs.length > 0
    ? await resolveLabelIds(resolvedBoardRoot, options.labelRefs)
    : [];
  const records = [];

  const listOrder = new Map(selectedLists.map((listEntry, index) => [listEntry.path, index]));
  const cardOrder = new Map();

  for (const listEntry of selectedLists) {
    const cardNames = await listOrderedEntries(
      listEntry.path,
      (entry) => entry.isFile() && entry.name.endsWith('.md'),
      { writeManifest: true },
    );
    cardNames.forEach((fileName, index) => cardOrder.set(`${listEntry.path}\n${fileName}`, index));

    const loaded = await Promise.all(
      cardNames.map((fileName) => loadCardRecord(resolvedBoardRoot, listEntry, fileName))
    );

    for (const record of loaded) {
      const normalizedLabelNames = record.labels
        .map((labelId) => labelMap.get(labelId) || labelId)
        .sort((left, right) => listSortCollator.compare(left, right));

      const nextRecord = {
        ...record,
        labelNames: normalizedLabelNames,
      };

      if (!cardMatchesSearch(nextRecord, options.search)) {
        continue;
      }

      if (labelIds.length > 0) {
        const hasMatch = labelMode === 'all'
          ? labelIds.every((labelId) => nextRecord.labels.includes(labelId))
          : labelIds.some((labelId) => nextRecord.labels.includes(labelId));

        if (!hasMatch) {
          continue;
        }
      }

      if (dueMatcher) {
        const dueDates = getDueDatesForRecord(nextRecord, dueSource, taskStatus);
        if (!dueMatcher(dueDates)) {
          continue;
        }
      }

      records.push(nextRecord);
    }
  }

  const sortBy = String(options.sort || 'list').toLowerCase();
  records.sort((left, right) => {
    if (sortBy === 'title') {
      return listSortCollator.compare(left.title, right.title);
    }

    if (sortBy === 'due') {
      const leftEarliest = getEarliestDueDate(left, dueSource, taskStatus);
      const rightEarliest = getEarliestDueDate(right, dueSource, taskStatus);
      const dueComparison = compareOptionalIsoDates(leftEarliest, rightEarliest);
      if (dueComparison !== 0) {
        return dueComparison;
      }
    }

    if (sortBy === 'updated' || sortBy === 'updated-newest' || sortBy === 'updated-oldest') {
      const updatedComparison = compareOptionalTimestamps(
        getCardSortTimestamp(left, 'updatedAt'),
        getCardSortTimestamp(right, 'updatedAt'),
        sortBy !== 'updated-oldest',
      );
      if (updatedComparison !== 0) {
        return updatedComparison;
      }
    }

    if (sortBy === 'created' || sortBy === 'created-oldest' || sortBy === 'created-newest') {
      const createdComparison = compareOptionalTimestamps(
        getCardSortTimestamp(left, 'createdAt'),
        getCardSortTimestamp(right, 'createdAt'),
        sortBy === 'created-newest',
      );
      if (createdComparison !== 0) {
        return createdComparison;
      }
    }

    const listComparison = (listOrder.get(left.listPath) ?? Number.MAX_SAFE_INTEGER)
      - (listOrder.get(right.listPath) ?? Number.MAX_SAFE_INTEGER);
    if (listComparison !== 0) {
      return listComparison;
    }

    const fileComparison = (cardOrder.get(`${left.listPath}\n${left.fileName}`) ?? Number.MAX_SAFE_INTEGER)
      - (cardOrder.get(`${right.listPath}\n${right.fileName}`) ?? Number.MAX_SAFE_INTEGER);
    if (fileComparison !== 0) {
      return fileComparison;
    }

    return listSortCollator.compare(left.title, right.title);
  });

  const limit = Number(options.limit);
  if (Number.isInteger(limit) && limit >= 0) {
    return records.slice(0, limit);
  }

  return records;
}

function getEarliestDueDate(record, dueSource = 'any', taskStatus = 'any') {
  const dueDates = getDueDatesForRecord(record, dueSource, taskStatus).map((entry) => entry.date).sort();
  return dueDates[0] || '';
}

async function resolveLabelIds(boardRoot, labelRefs) {
  const boardSettings = await boardLabels.readBoardSettings(boardRoot, { ensureFile: false });
  const labels = Array.isArray(boardSettings.labels) ? boardSettings.labels : [];

  return labelRefs.map((labelRef) => {
    const normalizedRef = normalizeMatchValue(labelRef);
    if (!normalizedRef) {
      throw new Error('Label reference cannot be empty.');
    }

    const exactById = labels.find((label) => normalizeMatchValue(label.id) === normalizedRef);
    if (exactById) {
      return exactById.id;
    }

    const exactByName = labels.find((label) => normalizeMatchValue(label.name) === normalizedRef);
    if (exactByName) {
      return exactByName.id;
    }

    const partialMatches = labels.filter((label) => (
      normalizeMatchValue(label.id).includes(normalizedRef) ||
      normalizeMatchValue(label.name).includes(normalizedRef)
    ));

    if (partialMatches.length === 1) {
      return partialMatches[0].id;
    }

    if (partialMatches.length > 1) {
      throw new Error(`Ambiguous label reference "${labelRef}".`);
    }

    throw new Error(`Could not find label: ${labelRef}`);
  });
}

async function resolveCard(boardRoot, options = {}) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const includeArchive = options.includeArchive === true;
  const cardRef = String(options.cardRef || '').trim();
  if (!cardRef) {
    throw new Error('card reference is required.');
  }

  const cards = await listCards(resolvedBoardRoot, {
    includeArchive,
    listRefs: options.listRef ? [options.listRef] : [],
  });

  return resolveUniqueMatch(
    cards,
    cardRef,
    [
      (item, ref, exact) => {
        const value = normalizeMatchValue(item.fileName);
        return exact ? value === ref : value.includes(ref);
      },
      (item, ref, exact) => {
        const value = normalizeMatchValue(item.cardId);
        return exact ? value === ref : value.includes(ref);
      },
      (item, ref, exact) => {
        const value = normalizeMatchValue(item.title);
        return exact ? value === ref : value.includes(ref);
      },
    ],
    'card',
  );
}

function normalizeDateInput(dateValue, fieldLabel) {
  const normalized = String(dateValue || '').trim();
  if (!normalized || normalized.toLowerCase() === 'none') {
    return null;
  }

  if (!parseIsoDateStringToLocalDate(normalized)) {
    throw new Error(`${fieldLabel} dates must use YYYY-MM-DD. Received: ${dateValue}`);
  }

  return normalized;
}

function normalizeDueInput(dueValue) {
  return normalizeDateInput(dueValue, 'Due');
}

function normalizeStartInput(startValue) {
  return normalizeDateInput(startValue, 'Start');
}

async function createCard(boardRoot, options = {}) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const listEntry = await resolveList(resolvedBoardRoot, options.listRef, { includeArchive: true });
  const title = String(options.title || '').trim();

  const fileName = `${sanitizeCardSlug(title || 'card').slice(0, 25)}-${randomSuffix()}.md`;
  const filePath = path.join(listEntry.path, fileName);
  const start = normalizeStartInput(options.start);
  const due = normalizeDueInput(options.due);
  const labelIds = options.labelRefs && options.labelRefs.length > 0
    ? await resolveLabelIds(resolvedBoardRoot, options.labelRefs)
    : [];
  const initialFrontmatter = {
    title,
    start,
    due,
    labels: labelIds,
  };
  const boardSettings = await boardLabels.readBoardSettings(resolvedBoardRoot, { ensureFile: false });
  const v2Profile = boardSettings && boardSettings.v2 && boardSettings.v2.enabled === true ? boardSettings.v2 : null;
  const hasV2Overrides = options.kind != null || options.priorityClass != null || options.effortPoints != null;
  if (v2Profile || hasV2Overrides) {
    const defaults = v2Profile && v2Profile.cardDefaults ? v2Profile.cardDefaults : {};
    initialFrontmatter.signboard_v2 = {
      contract_version: 1,
      kind: String(options.kind || defaults.kind || 'task'),
      priority_class: String(options.priorityClass || defaults.priorityClass || 'P2'),
    };
    if (options.effortPoints != null && Number.isFinite(Number(options.effortPoints))) initialFrontmatter.signboard_v2.estimate = { effort_points: Number(options.effortPoints) };
  }
  const frontmatter = cardFrontmatter.normalizeFrontmatter(prepareNewCardFrontmatter(initialFrontmatter));
  const body = typeof options.body === 'string' ? options.body : '';

  if (options.dryRun === true) {
    return {
      dryRun: true,
      operation: 'create-card',
      boardRoot: resolvedBoardRoot,
      listDirectoryName: listEntry.directoryName,
      listDisplayName: listEntry.displayName,
      listPath: listEntry.path,
      fileName,
      filePath,
      cardId: getCardId(fileName),
      title: getCardDisplayTitle(frontmatter.title, fileName),
      displayTitle: getCardDisplayTitle(frontmatter.title, fileName),
      start: start || '',
      due: due || '',
      labels: labelIds,
      labelNames: await labelNamesForIds(resolvedBoardRoot, labelIds),
      frontmatter,
      body,
      timestamps: resolveCardTimestamps(frontmatter),
      taskSummary: getTaskListSummary(body),
      taskStartDates: getTaskListStartDates(body),
      incompleteTaskStartDates: getIncompleteTaskListStartDates(body),
      taskDueDates: getTaskListDueDates(body),
      incompleteTaskDueDates: getIncompleteTaskListDueDates(body),
    };
  }

  await cardFrontmatter.writeCard(filePath, {
    frontmatter,
    body,
  });

  const orderedCards = await listOrderedEntries(
    listEntry.path,
    (entry) => entry.isFile() && entry.name.endsWith('.md'),
    { writeManifest: true },
  );
  if (!orderedCards.includes(fileName)) {
    await writeOrderManifest(listEntry.path, [...orderedCards, fileName]);
  }

  return loadCardRecord(resolvedBoardRoot, listEntry, fileName);
}

async function labelNamesForIds(boardRoot, labelIds) {
  const boardSettings = await boardLabels.readBoardSettings(boardRoot, { ensureFile: false });
  const labelMap = new Map(boardSettings.labels.map((label) => [label.id, label.name]));
  return (Array.isArray(labelIds) ? labelIds : [])
    .map((labelId) => labelMap.get(labelId) || labelId)
    .sort((left, right) => listSortCollator.compare(left, right));
}

async function duplicateCard(boardRoot, options = {}) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const sourceRecord = await resolveCard(resolvedBoardRoot, {
    cardRef: options.cardRef,
    listRef: options.fromListRef,
    includeArchive: true,
  });
  const sourceCard = await cardFrontmatter.readCard(sourceRecord.filePath);
  const targetList = options.targetListRef
    ? await resolveList(resolvedBoardRoot, options.targetListRef, { includeArchive: true })
    : {
        directoryName: sourceRecord.listDirectoryName,
        displayName: sourceRecord.listDisplayName,
        path: sourceRecord.listPath,
      };
  const sourceTitle = getCardDisplayTitle(sourceCard.frontmatter?.title, sourceRecord.fileName);
  const title = Object.prototype.hasOwnProperty.call(options, 'title')
    ? String(options.title || '').trim()
    : `${String(options.titlePrefix || 'Copy of ')}${sourceTitle}`.trim();

  const removeLabelIds = options.removeLabelRefs && options.removeLabelRefs.length > 0
    ? new Set(await resolveLabelIds(resolvedBoardRoot, options.removeLabelRefs))
    : new Set();
  const addLabelIds = options.addLabelRefs && options.addLabelRefs.length > 0
    ? await resolveLabelIds(resolvedBoardRoot, options.addLabelRefs)
    : [];
  const sourceLabels = Array.isArray(sourceCard.frontmatter?.labels)
    ? sourceCard.frontmatter.labels.map((labelId) => String(labelId))
    : [];
  const labelSet = new Set(options.clearLabels === true ? [] : sourceLabels);

  for (const labelId of removeLabelIds) {
    labelSet.delete(labelId);
  }

  for (const labelId of addLabelIds) {
    labelSet.add(labelId);
  }

  const labels = [...labelSet];
  const body = Object.prototype.hasOwnProperty.call(options, 'body')
    ? String(options.body || '')
    : sourceCard.body;
  const fileName = `${sanitizeCardSlug(title || 'card').slice(0, 25)}-${randomSuffix()}.md`;
  const filePath = path.join(targetList.path, fileName);
  const frontmatterSource = {
    ...sourceCard.frontmatter,
    title,
    labels,
  };

  if (Object.prototype.hasOwnProperty.call(options, 'due')) {
    frontmatterSource.due = normalizeDueInput(options.due);
  }

  if (Object.prototype.hasOwnProperty.call(options, 'start')) {
    frontmatterSource.start = normalizeStartInput(options.start);
  }

  const frontmatter = prepareNewCardFrontmatter({
    ...frontmatterSource,
  });

  if (options.dryRun === true) {
    return {
      dryRun: true,
      operation: options.operation || 'duplicate-card',
      boardRoot: resolvedBoardRoot,
      sourceListDirectoryName: sourceRecord.listDirectoryName,
      sourceListDisplayName: sourceRecord.listDisplayName,
      sourceFileName: sourceRecord.fileName,
      sourceFilePath: sourceRecord.filePath,
      listDirectoryName: targetList.directoryName,
      listDisplayName: targetList.displayName,
      listPath: targetList.path,
      fileName,
      filePath,
      cardId: getCardId(fileName),
      title,
      start: String(frontmatter.start || ''),
      due: String(frontmatter.due || ''),
      labels,
      labelNames: await labelNamesForIds(resolvedBoardRoot, labels),
      frontmatter,
      body,
      timestamps: resolveCardTimestamps(frontmatter),
      taskSummary: getTaskListSummary(body),
      taskStartDates: getTaskListStartDates(body),
      incompleteTaskStartDates: getIncompleteTaskListStartDates(body),
      taskDueDates: getTaskListDueDates(body),
      incompleteTaskDueDates: getIncompleteTaskListDueDates(body),
    };
  }

  await cardFrontmatter.writeCard(filePath, {
    frontmatter,
    body,
  });

  const orderedCards = await listOrderedEntries(
    targetList.path,
    (entry) => entry.isFile() && entry.name.endsWith('.md'),
    { writeManifest: true },
  );
  if (!orderedCards.includes(fileName)) {
    await writeOrderManifest(targetList.path, [...orderedCards, fileName]);
  }

  return loadCardRecord(resolvedBoardRoot, targetList, fileName);
}

async function editCard(boardRoot, options = {}) {
  const resolvedBoardRoot = await ensureBoardRoot(boardRoot);
  const cardRecord = await resolveCard(resolvedBoardRoot, {
    cardRef: options.cardRef,
    listRef: options.listRef,
    includeArchive: true,
  });
  const current = await cardFrontmatter.readCard(cardRecord.filePath);
  const nextFrontmatter = { ...current.frontmatter };
  const currentLabels = Array.isArray(nextFrontmatter.labels)
    ? nextFrontmatter.labels.map((labelId) => String(labelId))
    : [];
  let nextBody = current.body;

  if (Object.prototype.hasOwnProperty.call(options, 'title')) {
    const title = String(options.title || '').trim();
    nextFrontmatter.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(options, 'body')) {
    nextBody = String(options.body || '');
  }

  if (typeof options.appendBody === 'string' && options.appendBody.length > 0) {
    nextBody = nextBody ? `${nextBody}\n${options.appendBody}` : options.appendBody;
  }

  if (options.replaceSection) {
    nextBody = replaceSection(nextBody, options.replaceSection.heading, options.replaceSection.body);
  }

  if (options.insertAfterHeading) {
    nextBody = insertAfterHeading(nextBody, options.insertAfterHeading.heading, options.insertAfterHeading.text);
  }

  if (options.note) {
    nextBody = appendNote(nextBody, options.note.text, {
      section: options.note.section,
      timestamp: options.note.timestamp === true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(options, 'due')) {
    nextFrontmatter.due = normalizeDueInput(options.due);
  }

  if (Object.prototype.hasOwnProperty.call(options, 'start')) {
    nextFrontmatter.start = normalizeStartInput(options.start);
  }

  if (options.setLabelRefs && options.setLabelRefs.length > 0) {
    nextFrontmatter.labels = await resolveLabelIds(resolvedBoardRoot, options.setLabelRefs);
  } else {
    const nextLabelSet = new Set(options.clearLabels === true ? [] : currentLabels);

    if (options.addLabelRefs && options.addLabelRefs.length > 0) {
      for (const labelId of await resolveLabelIds(resolvedBoardRoot, options.addLabelRefs)) {
        nextLabelSet.add(labelId);
      }
    }

    if (options.removeLabelRefs && options.removeLabelRefs.length > 0) {
      for (const labelId of await resolveLabelIds(resolvedBoardRoot, options.removeLabelRefs)) {
        nextLabelSet.delete(labelId);
      }
    }

    nextFrontmatter.labels = [...nextLabelSet];
  }

  if (options.dryRun === true) {
    const targetList = options.moveToListRef
      ? await resolveList(resolvedBoardRoot, options.moveToListRef, { includeArchive: true })
      : {
          directoryName: cardRecord.listDirectoryName,
          displayName: cardRecord.listDisplayName,
          path: cardRecord.listPath,
        };
    return {
      dryRun: true,
      operation: 'edit-card',
      boardRoot: resolvedBoardRoot,
      sourceListDirectoryName: cardRecord.listDirectoryName,
      sourceListDisplayName: cardRecord.listDisplayName,
      sourceFileName: cardRecord.fileName,
      sourceFilePath: cardRecord.filePath,
      listDirectoryName: targetList.directoryName,
      listDisplayName: targetList.displayName,
      listPath: targetList.path,
      fileName: cardRecord.fileName,
      filePath: path.join(targetList.path, cardRecord.fileName),
      cardId: cardRecord.cardId,
      title: getCardDisplayTitle(nextFrontmatter.title, cardRecord.fileName),
      displayTitle: getCardDisplayTitle(nextFrontmatter.title, cardRecord.fileName),
      start: String(nextFrontmatter.start || ''),
      due: String(nextFrontmatter.due || ''),
      labels: Array.isArray(nextFrontmatter.labels) ? nextFrontmatter.labels : [],
      labelNames: await labelNamesForIds(resolvedBoardRoot, nextFrontmatter.labels),
      frontmatter: nextFrontmatter,
      body: nextBody,
      timestamps: {
        ...resolveCardTimestamps(nextFrontmatter),
        updatedAt: cardRecord.timestamps ? cardRecord.timestamps.updatedAt : '',
        updatedAtSource: cardRecord.timestamps ? cardRecord.timestamps.updatedAtSource : '',
      },
      taskSummary: getTaskListSummary(nextBody),
      taskStartDates: getTaskListStartDates(nextBody),
      incompleteTaskStartDates: getIncompleteTaskListStartDates(nextBody),
      taskDueDates: getTaskListDueDates(nextBody),
      incompleteTaskDueDates: getIncompleteTaskListDueDates(nextBody),
      wouldMove: Boolean(options.moveToListRef),
    };
  }

  await cardFrontmatter.writeCard(cardRecord.filePath, {
    frontmatter: nextFrontmatter,
    body: nextBody,
  });

  let finalFilePath = cardRecord.filePath;
  let finalListEntry = {
    directoryName: cardRecord.listDirectoryName,
    displayName: cardRecord.listDisplayName,
    path: cardRecord.listPath,
  };

  if (options.moveToListRef) {
    const targetList = await resolveList(resolvedBoardRoot, options.moveToListRef, { includeArchive: true });
    const movedFileName = await insertCardFileAtTop(targetList.path, cardRecord.filePath, cardRecord.fileName);
    const nextPath = path.join(targetList.path, movedFileName);
    if (nextPath !== cardRecord.filePath) {
      if (
        cardRecord.listDirectoryName !== ARCHIVE_DIRECTORY_NAME &&
        targetList.directoryName !== ARCHIVE_DIRECTORY_NAME
      ) {
        const movedCard = await cardFrontmatter.readCard(nextPath);
        await cardFrontmatter.writeCard(nextPath, {
          frontmatter: applyCardListMove(movedCard.frontmatter, {
            fromListDirectoryName: cardRecord.listDirectoryName,
            fromListDisplayName: getListDisplayName(cardRecord.listDirectoryName),
            toListDirectoryName: targetList.directoryName,
            toListDisplayName: targetList.displayName,
          }),
          body: movedCard.body,
        });
      }

      finalFilePath = nextPath;
      finalListEntry = targetList;
    }
  }

  return loadCardRecord(resolvedBoardRoot, finalListEntry, path.basename(finalFilePath));
}

async function addCardNote(boardRoot, options = {}) {
  return editCard(boardRoot, {
    cardRef: options.cardRef,
    listRef: options.listRef,
    note: {
      text: options.text,
      section: options.section,
      timestamp: options.timestamp === true,
    },
    dryRun: options.dryRun === true,
  });
}

function summarizeDue(record) {
  const pieces = [];
  if (record.due) {
    pieces.push(record.due);
  }
  if (record.taskDueDates.length > 0) {
    const taskDue = record.taskDueDates.join(',');
    pieces.push(record.due ? `tasks:${taskDue}` : `task:${taskDue}`);
  }
  return pieces.join(' | ');
}

module.exports = {
  ARCHIVE_DIRECTORY_NAME,
  getListDisplayName,
  getCardId,
  listLists,
  resolveList,
  createList,
  renameList,
  listCards,
  resolveCard,
  createCard,
  duplicateCard,
  editCard,
  addCardNote,
  resolveLabelIds,
  summarizeDue,
  getEarliestDueDate,
};
