const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { atomicWriteFile } = require('./atomicFile');

const SETTINGS_FILE_NAME = '.board.json';
const LEGACY_SETTINGS_FILE_NAME = 'board-settings.md';
const LEGACY_LABELS_FILE_NAME = 'labels.md';
const BOARD_SETTINGS_KEY = 'settings';
const YAML_FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

const DEFAULT_LABELS = Object.freeze([
  Object.freeze({
    id: 'label-1',
    name: 'Label 1',
    colorLight: '#22c55e',
    colorDark: '#16a34a',
  }),
  Object.freeze({
    id: 'label-2',
    name: 'Label 2',
    colorLight: '#3b82f6',
    colorDark: '#2563eb',
  }),
  Object.freeze({
    id: 'label-3',
    name: 'Label 3',
    colorLight: '#ef4444',
    colorDark: '#dc2626',
  }),
]);

const DEFAULT_THEME_BACKGROUNDS = Object.freeze({
  light: '#f7f8fa',
  dark: '#091102',
});
const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({
  enabled: false,
  time: '09:00',
});
const DEFAULT_TOOLTIPS_ENABLED = true;
const DEFAULT_WORKFLOW_SETTINGS = Object.freeze({
  autoDetectCompletedLists: true,
  completedListNames: Object.freeze([]),
  ignoredCompletedListNames: Object.freeze([]),
});
const DEFAULT_EXTERNAL_PUBLISHED_CALENDAR_SETTINGS = Object.freeze({
  include: true,
});
const DEFAULT_OBSIDIAN_BASE_SETTINGS = Object.freeze({
  managedHash: '',
  updatedAt: '',
});
const V2_STAGE_KEYS = Object.freeze([
  'inbox',
  'shaping',
  'ready',
  'active',
  'review',
  'blocked',
  'done',
  'dropped',
]);
const DEFAULT_V2_DASHBOARD_SECTIONS = Object.freeze([
  'priority',
  'impact',
  'low_hanging_fruit',
  'blocked',
]);
const DEFAULT_V2_PROFILE = Object.freeze({
  enabled: false,
  profileId: '',
  version: 1,
  title: '',
  description: '',
  stages: Object.freeze({
    inbox: Object.freeze([]),
    shaping: Object.freeze([]),
    ready: Object.freeze([]),
    active: Object.freeze([]),
    review: Object.freeze([]),
    blocked: Object.freeze([]),
    done: Object.freeze([]),
    dropped: Object.freeze([]),
  }),
  dashboard: Object.freeze({
    sections: DEFAULT_V2_DASHBOARD_SECTIONS,
    title: '',
    description: '',
  }),
  cardDefaults: Object.freeze({
    kind: 'task',
    priorityClass: 'P2',
  }),
  validationPolicy: 'framework_v1',
});
const AUTO_COMPLETED_LIST_NAME_KEYS = Object.freeze([
  'complete',
  'completed',
  'closed',
  'done',
  'finished',
  'resolved',
  'shipped',
]);

const FALLBACK_LIGHT = '#3b82f6';
const FALLBACK_DARK = '#2563eb';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonValue(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'undefined' || typeof value === 'function' ? undefined : value;
  }

  if (seen.has(value)) {
    return undefined;
  }

  seen.set(value, true);
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonValue(item, seen)).filter((item) => typeof item !== 'undefined');
  }

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    const cloned = cloneJsonValue(item, seen);
    if (typeof cloned !== 'undefined') {
      result[key] = cloned;
    }
  }
  return result;
}

function cloneDefaultV2Profile() {
  return {
    enabled: DEFAULT_V2_PROFILE.enabled,
    profileId: DEFAULT_V2_PROFILE.profileId,
    version: DEFAULT_V2_PROFILE.version,
    title: DEFAULT_V2_PROFILE.title,
    description: DEFAULT_V2_PROFILE.description,
    stages: Object.fromEntries(V2_STAGE_KEYS.map((stage) => [stage, []])),
    dashboard: {
      sections: [...DEFAULT_V2_DASHBOARD_SECTIONS],
      title: DEFAULT_V2_PROFILE.dashboard.title,
      description: DEFAULT_V2_PROFILE.dashboard.description,
    },
    cardDefaults: { ...DEFAULT_V2_PROFILE.cardDefaults },
    validationPolicy: DEFAULT_V2_PROFILE.validationPolicy,
  };
}

function normalizeV2String(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeV2StringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const candidate = item.trim();
    if (!candidate || seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    normalized.push(candidate);
  }
  return normalized;
}

function normalizeV2DashboardSections(value) {
  const sections = normalizeV2StringArray(value);
  const allowed = new Set(DEFAULT_V2_DASHBOARD_SECTIONS);
  const hadLegacySection = sections.some((section) => section === 'critical' || section === 'next_best_work' || section === 'high_impact');
  const migrated = sections
    .map((section) => section === 'next_best_work' ? 'priority' : section === 'high_impact' ? 'impact' : section === 'critical' ? '' : section)
    .filter(Boolean);
  if (hadLegacySection && !migrated.includes('impact')) {
    const priorityIndex = migrated.indexOf('priority');
    migrated.splice(priorityIndex >= 0 ? priorityIndex + 1 : 0, 0, 'impact');
  }
  const filtered = migrated.filter((section) => allowed.has(section));
  return filtered.length > 0 ? filtered : [...DEFAULT_V2_DASHBOARD_SECTIONS];
}

function normalizeV2Stages(rawStages) {
  const source = isObject(rawStages) ? cloneJsonValue(rawStages) : {};
  const normalized = isObject(source) ? source : {};
  for (const stage of V2_STAGE_KEYS) {
    normalized[stage] = normalizeV2StringArray(rawStages && rawStages[stage]);
  }
  return normalized;
}

function normalizeV2CardDefaults(rawDefaults) {
  const source = isObject(rawDefaults) ? cloneJsonValue(rawDefaults) : {};
  const normalized = isObject(source) ? source : {};
  normalized.kind = normalizeV2String(rawDefaults && rawDefaults.kind, DEFAULT_V2_PROFILE.cardDefaults.kind) || DEFAULT_V2_PROFILE.cardDefaults.kind;
  normalized.priorityClass = normalizeV2String(rawDefaults && rawDefaults.priorityClass, DEFAULT_V2_PROFILE.cardDefaults.priorityClass) || DEFAULT_V2_PROFILE.cardDefaults.priorityClass;
  delete normalized.workType;
  delete normalized.executionCeiling;
  delete normalized.backgroundSelection;
  return normalized;
}

function normalizeV2Profile(rawProfile = {}) {
  const source = isObject(rawProfile) ? rawProfile : {};
  const normalized = cloneJsonValue(source) || {};
  const defaults = cloneDefaultV2Profile();
  const rawVersion = source.version;
  const versionIsValid = typeof rawVersion === 'undefined' || rawVersion === 1;
  const enabledIsValid = typeof source.enabled === 'undefined' || typeof source.enabled === 'boolean';

  normalized.enabled = source.enabled === true && versionIsValid && enabledIsValid;
  normalized.profileId = normalizeV2String(source.profileId, defaults.profileId);
  normalized.version = 1;
  normalized.title = normalizeV2String(source.title, defaults.title);
  normalized.description = normalizeV2String(source.description, defaults.description);
  normalized.stages = normalizeV2Stages(source.stages);

  const rawDashboard = isObject(source.dashboard) ? source.dashboard : {};
  const dashboard = cloneJsonValue(rawDashboard) || {};
  dashboard.sections = normalizeV2DashboardSections(rawDashboard.sections);
  dashboard.title = normalizeV2String(rawDashboard.title, defaults.dashboard.title);
  dashboard.description = normalizeV2String(rawDashboard.description, defaults.dashboard.description);
  normalized.dashboard = dashboard;

  normalized.cardDefaults = normalizeV2CardDefaults(source.cardDefaults);
  normalized.validationPolicy = normalizeV2String(source.validationPolicy, defaults.validationPolicy) || defaults.validationPolicy;
  return normalized;
}

function v2ProfileHasValues(profile) {
  const normalized = normalizeV2Profile(profile);
  const defaults = cloneDefaultV2Profile();
  const knownKeys = new Set([
    'enabled',
    'profileId',
    'version',
    'title',
    'description',
    'stages',
    'dashboard',
    'cardDefaults',
    'validationPolicy',
  ]);

  if (Object.keys(normalized).some((key) => !knownKeys.has(key))) {
    return true;
  }

  if (Object.keys(normalized.stages).some((key) => !V2_STAGE_KEYS.includes(key))) {
    return true;
  }

  if (Object.keys(normalized.dashboard).some((key) => !['sections', 'title', 'description'].includes(key))) {
    return true;
  }

  if (Object.keys(normalized.cardDefaults).some((key) => !['kind', 'priorityClass'].includes(key))) {
    return true;
  }

  if (normalized.enabled || normalized.profileId !== defaults.profileId || normalized.title !== defaults.title || normalized.description !== defaults.description || normalized.validationPolicy !== defaults.validationPolicy) {
    return true;
  }

  if (V2_STAGE_KEYS.some((stage) => normalized.stages[stage].length > 0)) {
    return true;
  }

  if (normalized.dashboard.title !== defaults.dashboard.title || normalized.dashboard.description !== defaults.dashboard.description || JSON.stringify(normalized.dashboard.sections) !== JSON.stringify(defaults.dashboard.sections)) {
    return true;
  }

  return Object.keys(normalized.cardDefaults).some((key) => normalized.cardDefaults[key] !== defaults.cardDefaults[key]) ||
    Object.keys(defaults.cardDefaults).some((key) => normalized.cardDefaults[key] !== defaults.cardDefaults[key]);
}

function jsonValuesEqual(left, right) {
  if (Object.is(left, right)) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => jsonValuesEqual(value, right[index]));
  }
  if (isObject(left) || isObject(right)) {
    if (!isObject(left) || !isObject(right)) {
      return false;
    }
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && jsonValuesEqual(left[key], right[key]));
  }
  return false;
}

function areV2ProfilesEqual(left, right) {
  if (!isObject(left) && !v2ProfileHasValues(right)) {
    return true;
  }
  return jsonValuesEqual(normalizeV2Profile(left), normalizeV2Profile(right));
}

function cloneDefaultLabels() {
  return DEFAULT_LABELS.map((label) => ({ ...label }));
}

function normalizeHexColor(value, fallback) {
  const source = String(value || '').trim().toLowerCase();
  if (!source) {
    return fallback;
  }

  if (/^#?[a-f0-9]{3}$/.test(source)) {
    const compact = source.replace('#', '');
    return `#${compact[0]}${compact[0]}${compact[1]}${compact[1]}${compact[2]}${compact[2]}`;
  }

  if (/^#?[a-f0-9]{6}$/.test(source)) {
    return source.startsWith('#') ? source : `#${source}`;
  }

  return fallback;
}

function createUniqueId(rawId, index, seenIds) {
  const baseId = String(rawId || '').trim() || `label-${index + 1}`;
  let candidate = baseId;
  let suffix = 2;

  while (seenIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  seenIds.add(candidate);
  return candidate;
}

function normalizeLabel(rawLabel, index, seenIds) {
  const source = isObject(rawLabel) ? rawLabel : {};
  const id = createUniqueId(source.id, index, seenIds);
  const fallbackName = `Label ${index + 1}`;
  const name = String(source.name || '').trim() || fallbackName;

  return {
    id,
    name,
    colorLight: normalizeHexColor(source.colorLight, FALLBACK_LIGHT),
    colorDark: normalizeHexColor(source.colorDark, FALLBACK_DARK),
  };
}

function normalizeLabels(rawLabels) {
  if (!Array.isArray(rawLabels)) {
    return cloneDefaultLabels();
  }

  const seenIds = new Set();
  const normalized = rawLabels
    .map((label, index) => normalizeLabel(label, index, seenIds))
    .filter((label) => label.id.length > 0);

  if (normalized.length === 0) {
    return cloneDefaultLabels();
  }

  return normalized;
}

function normalizeThemeModeOverride(rawModeOverrides) {
  const source = isObject(rawModeOverrides) ? rawModeOverrides : {};
  const boardBackground = normalizeHexColor(source.boardBackground, '');
  if (!boardBackground) {
    return {};
  }

  return {
    boardBackground,
  };
}

function normalizeThemeOverrides(rawThemeOverrides) {
  const source = isObject(rawThemeOverrides) ? rawThemeOverrides : {};

  return {
    light: normalizeThemeModeOverride(source.light),
    dark: normalizeThemeModeOverride(source.dark),
  };
}

function normalizeNotificationTime(value) {
  const candidate = String(value || '').trim();
  if (/^(?:0[1-9]|1\d|2[0-4]):[0-5]\d$/.test(candidate)) {
    return candidate;
  }

  return DEFAULT_NOTIFICATION_SETTINGS.time;
}

function normalizeNotificationSettings(rawNotificationSettings) {
  const source = isObject(rawNotificationSettings) ? rawNotificationSettings : {};
  return {
    enabled: source.enabled === true,
    time: normalizeNotificationTime(source.time),
  };
}

function normalizeTooltipsEnabled(value) {
  return value === false ? false : DEFAULT_TOOLTIPS_ENABLED;
}

function getBoardListDisplayNameFromDirectory(listName) {
  const normalized = String(listName || '').trim();
  if (!normalized) {
    return '';
  }

  const listNameMatch = normalized.match(/^\d{3}-(.*?)(-[^-]{5}|-stock)$/);
  if (listNameMatch) {
    return String(listNameMatch[1] || '').trim();
  }

  return normalized;
}

function normalizeWorkflowListName(value) {
  return String(value || '').trim();
}

function normalizeWorkflowListIdentity(value) {
  return normalizeWorkflowListName(value).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function normalizeWorkflowDetectionKey(value) {
  return getBoardListDisplayNameFromDirectory(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isAutoDetectedCompletedListName(listName) {
  const key = normalizeWorkflowDetectionKey(listName);
  return AUTO_COMPLETED_LIST_NAME_KEYS.includes(key);
}

function normalizeWorkflowListNames(rawListNames) {
  const values = Array.isArray(rawListNames) ? rawListNames : [];
  const seen = new Set();
  const normalized = [];

  for (const rawName of values) {
    const name = normalizeWorkflowListName(rawName);
    const identity = normalizeWorkflowListIdentity(name);
    if (!name || !identity || seen.has(identity)) {
      continue;
    }

    seen.add(identity);
    normalized.push(name);
  }

  return normalized;
}

function normalizeWorkflowSettings(rawWorkflowSettings) {
  const source = isObject(rawWorkflowSettings) ? rawWorkflowSettings : {};
  return {
    autoDetectCompletedLists: source.autoDetectCompletedLists === false ? false : DEFAULT_WORKFLOW_SETTINGS.autoDetectCompletedLists,
    completedListNames: normalizeWorkflowListNames(source.completedListNames || source.completedLists),
    ignoredCompletedListNames: normalizeWorkflowListNames(source.ignoredCompletedListNames),
  };
}

function normalizeExternalPublishedCalendarSettings(rawCalendarSettings) {
  const source = isObject(rawCalendarSettings) ? rawCalendarSettings : {};
  return {
    include: source.include === false ? false : DEFAULT_EXTERNAL_PUBLISHED_CALENDAR_SETTINGS.include,
  };
}

function normalizeObsidianBaseSettings(rawObsidianBaseSettings) {
  const source = isObject(rawObsidianBaseSettings) ? rawObsidianBaseSettings : {};
  const rawManagedHash = String(source.managedHash || '').trim();
  const managedHash = /^[a-f0-9]{64}$/i.test(rawManagedHash) ? rawManagedHash.toLowerCase() : '';
  const updatedAt = managedHash ? String(source.updatedAt || '').trim() : '';

  return {
    managedHash,
    updatedAt,
  };
}

function cloneWorkflowSettings(workflowSettings) {
  const normalized = normalizeWorkflowSettings(workflowSettings);
  return {
    autoDetectCompletedLists: normalized.autoDetectCompletedLists,
    completedListNames: normalized.completedListNames.slice(),
    ignoredCompletedListNames: normalized.ignoredCompletedListNames.slice(),
  };
}

function cloneExternalPublishedCalendarSettings(calendarSettings) {
  const normalized = normalizeExternalPublishedCalendarSettings(calendarSettings);
  return {
    include: normalized.include,
  };
}

function cloneObsidianBaseSettings(obsidianBaseSettings) {
  const normalized = normalizeObsidianBaseSettings(obsidianBaseSettings);
  return {
    managedHash: normalized.managedHash,
    updatedAt: normalized.updatedAt,
  };
}

function workflowSettingsHasValues(workflowSettings) {
  const normalized = normalizeWorkflowSettings(workflowSettings);
  return (
    normalized.autoDetectCompletedLists !== DEFAULT_WORKFLOW_SETTINGS.autoDetectCompletedLists ||
    normalized.completedListNames.length > 0 ||
    normalized.ignoredCompletedListNames.length > 0
  );
}

function externalPublishedCalendarSettingsHasValues(calendarSettings) {
  const normalized = normalizeExternalPublishedCalendarSettings(calendarSettings);
  return normalized.include !== DEFAULT_EXTERNAL_PUBLISHED_CALENDAR_SETTINGS.include;
}

function obsidianBaseSettingsHasValues(obsidianBaseSettings) {
  const normalized = normalizeObsidianBaseSettings(obsidianBaseSettings);
  return Boolean(normalized.managedHash || normalized.updatedAt);
}

function isCompletedListByWorkflow(listName, workflowSettings) {
  const normalized = normalizeWorkflowSettings(workflowSettings);
  const identity = normalizeWorkflowListIdentity(listName);
  if (!identity) {
    return false;
  }

  const completedListNames = new Set(normalized.completedListNames.map(normalizeWorkflowListIdentity));
  if (completedListNames.has(identity)) {
    return true;
  }

  const ignoredCompletedListNames = new Set(normalized.ignoredCompletedListNames.map(normalizeWorkflowListIdentity));
  if (ignoredCompletedListNames.has(identity)) {
    return false;
  }

  return normalized.autoDetectCompletedLists && isAutoDetectedCompletedListName(listName);
}

function cloneThemeOverrides(themeOverrides) {
  const source = isObject(themeOverrides) ? themeOverrides : {};
  const normalized = normalizeThemeOverrides(source);
  return {
    light: { ...normalized.light },
    dark: { ...normalized.dark },
  };
}

function cloneNotificationSettings(notificationSettings) {
  const normalized = normalizeNotificationSettings(notificationSettings);
  return {
    enabled: normalized.enabled,
    time: normalized.time,
  };
}

function themeModeOverridesHasValues(modeOverrides) {
  return isObject(modeOverrides) && typeof modeOverrides.boardBackground === 'string' && modeOverrides.boardBackground.length > 0;
}

function themeOverridesHasValues(themeOverrides) {
  return Boolean(
    themeModeOverridesHasValues(themeOverrides.light) ||
    themeModeOverridesHasValues(themeOverrides.dark),
  );
}

function parseBoardSettings(rawContent) {
  const match = String(rawContent || '').match(YAML_FRONTMATTER_REGEX);
  if (!match) {
    return {};
  }

  const yamlSource = match[1];
  if (!yamlSource.trim()) {
    return {};
  }

  try {
    const parsed = yaml.load(yamlSource, { schema: yaml.JSON_SCHEMA });
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeBoardSettings(rawSettings = {}) {
  const source = isObject(rawSettings) ? rawSettings : {};
  return {
    labels: normalizeLabels(source.labels),
    colorScheme: typeof source.colorScheme === 'string' ? source.colorScheme : '',
    themeOverrides: normalizeThemeOverrides(source.themeOverrides),
    workflow: normalizeWorkflowSettings(source.workflow),
    externalPublishedCalendar: normalizeExternalPublishedCalendarSettings(source.externalPublishedCalendar),
    obsidianBase: normalizeObsidianBaseSettings(source.obsidianBase),
    v2: normalizeV2Profile(source.v2),
  };
}

function serializeBoardSettings(settings) {
  const normalized = normalizeBoardSettings(settings);
  const serializable = {
    labels: normalized.labels,
  };

  if (normalized.colorScheme) {
    serializable.colorScheme = normalized.colorScheme;
  }

  if (themeOverridesHasValues(normalized.themeOverrides)) {
    serializable.themeOverrides = {};
    if (themeModeOverridesHasValues(normalized.themeOverrides.light)) {
      serializable.themeOverrides.light = { ...normalized.themeOverrides.light };
    }
    if (themeModeOverridesHasValues(normalized.themeOverrides.dark)) {
      serializable.themeOverrides.dark = { ...normalized.themeOverrides.dark };
    }
  }

  if (workflowSettingsHasValues(normalized.workflow)) {
    serializable.workflow = {
      autoDetectCompletedLists: normalized.workflow.autoDetectCompletedLists,
    };
    if (normalized.workflow.completedListNames.length > 0) {
      serializable.workflow.completedListNames = normalized.workflow.completedListNames.slice();
    }
    if (normalized.workflow.ignoredCompletedListNames.length > 0) {
      serializable.workflow.ignoredCompletedListNames = normalized.workflow.ignoredCompletedListNames.slice();
    }
  }

  if (externalPublishedCalendarSettingsHasValues(normalized.externalPublishedCalendar)) {
    serializable.externalPublishedCalendar = {
      include: normalized.externalPublishedCalendar.include,
    };
  }

  if (obsidianBaseSettingsHasValues(normalized.obsidianBase)) {
    serializable.obsidianBase = {
      managedHash: normalized.obsidianBase.managedHash,
    };
    if (normalized.obsidianBase.updatedAt) {
      serializable.obsidianBase.updatedAt = normalized.obsidianBase.updatedAt;
    }
  }

  if (v2ProfileHasValues(normalized.v2)) {
    serializable.v2 = normalized.v2;
  }

  return serializable;
}

function getPrimarySettingsPath(boardRoot) {
  return path.join(boardRoot, SETTINGS_FILE_NAME);
}

function areLabelCollectionsEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  return left.every((label, index) => {
    const other = right[index];
    return (
      label.id === other.id &&
      label.name === other.name &&
      label.colorLight === other.colorLight &&
      label.colorDark === other.colorDark
    );
  });
}

function areThemeModeOverridesEqual(left, right) {
  const leftMode = isObject(left) ? left : {};
  const rightMode = isObject(right) ? right : {};
  return String(leftMode.boardBackground || '') === String(rightMode.boardBackground || '');
}

function areThemeOverridesEqual(left, right) {
  const leftOverrides = normalizeThemeOverrides(left);
  const rightOverrides = normalizeThemeOverrides(right);
  return (
    areThemeModeOverridesEqual(leftOverrides.light, rightOverrides.light) &&
    areThemeModeOverridesEqual(leftOverrides.dark, rightOverrides.dark)
  );
}

function areNotificationSettingsEqual(left, right) {
  const leftNotifications = normalizeNotificationSettings(left);
  const rightNotifications = normalizeNotificationSettings(right);
  return (
    leftNotifications.enabled === rightNotifications.enabled &&
    leftNotifications.time === rightNotifications.time
  );
}

function areTooltipsEnabledEqual(left, right) {
  return normalizeTooltipsEnabled(left) === normalizeTooltipsEnabled(right);
}

function areWorkflowSettingsEqual(left, right) {
  const leftWorkflow = normalizeWorkflowSettings(left);
  const rightWorkflow = normalizeWorkflowSettings(right);
  return (
    leftWorkflow.autoDetectCompletedLists === rightWorkflow.autoDetectCompletedLists &&
    JSON.stringify(leftWorkflow.completedListNames) === JSON.stringify(rightWorkflow.completedListNames) &&
    JSON.stringify(leftWorkflow.ignoredCompletedListNames) === JSON.stringify(rightWorkflow.ignoredCompletedListNames)
  );
}

function areExternalPublishedCalendarSettingsEqual(left, right) {
  const leftSettings = normalizeExternalPublishedCalendarSettings(left);
  const rightSettings = normalizeExternalPublishedCalendarSettings(right);
  return leftSettings.include === rightSettings.include;
}

function areObsidianBaseSettingsEqual(left, right) {
  const leftSettings = normalizeObsidianBaseSettings(left);
  const rightSettings = normalizeObsidianBaseSettings(right);
  return (
    leftSettings.managedHash === rightSettings.managedHash &&
    leftSettings.updatedAt === rightSettings.updatedAt
  );
}

function hasLegacyAppSettings(parsedSettings) {
  return Boolean(
    parsedSettings &&
    typeof parsedSettings === 'object' &&
    (
      Object.prototype.hasOwnProperty.call(parsedSettings, 'notifications') ||
      Object.prototype.hasOwnProperty.call(parsedSettings, 'tooltipsEnabled')
    )
  );
}

async function loadExistingBoardSettings(boardRoot) {
  const primaryPath = getPrimarySettingsPath(boardRoot);
  let primaryExisting = null;

  try {
    const raw = await fs.readFile(primaryPath, 'utf8');
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (isObject(parsed)) {
      primaryExisting = { raw, parsed, sourcePath: primaryPath, format: 'json' };
    }
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  const hasEmbeddedSettings = primaryExisting && (
    isObject(primaryExisting.parsed[BOARD_SETTINGS_KEY]) ||
    [
      'labels',
      'colorScheme',
      'themeOverrides',
      'workflow',
      'externalPublishedCalendar',
      'obsidianBase',
      'v2',
      'notifications',
      'tooltipsEnabled',
    ].some((key) => Object.prototype.hasOwnProperty.call(primaryExisting.parsed, key))
  );
  if (hasEmbeddedSettings) {
    return primaryExisting;
  }

  const legacyPath = path.join(boardRoot, LEGACY_SETTINGS_FILE_NAME);
  try {
    const raw = await fs.readFile(legacyPath, 'utf8');
    return { raw, sourcePath: legacyPath, format: 'yaml' };
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (primaryExisting) {
    return primaryExisting;
  }

  const legacyLabelsPath = path.join(boardRoot, LEGACY_LABELS_FILE_NAME);
  try {
    const raw = await fs.readFile(legacyLabelsPath, 'utf8');
    return { raw, sourcePath: legacyLabelsPath, format: 'yaml' };
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  return null;
}

function extractJsonBoardSettings(parsedSettings) {
  if (!isObject(parsedSettings)) {
    return {};
  }

  if (isObject(parsedSettings[BOARD_SETTINGS_KEY])) {
    return parsedSettings[BOARD_SETTINGS_KEY];
  }

  // Accept a short-lived flat JSON shape so hand-authored or early migration
  // files can still be normalized into the canonical nested shape.
  const knownKeys = [
    'labels',
    'colorScheme',
    'themeOverrides',
    'workflow',
    'externalPublishedCalendar',
    'obsidianBase',
    'v2',
    'notifications',
    'tooltipsEnabled',
  ];
  const flatSettings = {};
  for (const key of knownKeys) {
    if (Object.prototype.hasOwnProperty.call(parsedSettings, key)) {
      flatSettings[key] = parsedSettings[key];
    }
  }
  return flatSettings;
}

async function readExistingJsonManifest(boardRoot) {
  const primaryPath = getPrimarySettingsPath(boardRoot);
  try {
    const raw = await fs.readFile(primaryPath, 'utf8');
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : {};
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return {};
    }
    if (error instanceof SyntaxError) {
      return {};
    }
    throw error;
  }
}

async function writeBoardSettings(boardRoot, settings) {
  const primaryPath = getPrimarySettingsPath(boardRoot);
  const normalized = normalizeBoardSettings(settings);
  const existingManifest = await readExistingJsonManifest(boardRoot);
  const preservedManifest = { ...existingManifest };
  for (const key of [
    'labels',
    'colorScheme',
    'themeOverrides',
    'workflow',
    'externalPublishedCalendar',
    'obsidianBase',
    'v2',
    'notifications',
    'tooltipsEnabled',
  ]) {
    delete preservedManifest[key];
  }

  const payload = {
    ...preservedManifest,
    version: Number(existingManifest.version) || 1,
    [BOARD_SETTINGS_KEY]: serializeBoardSettings(normalized),
  };

  await atomicWriteFile(primaryPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    settingsPath: primaryPath,
    ...normalized,
  };
}

async function readBoardSettings(boardRoot, options = {}) {
  const ensureFile = options.ensureFile !== false;
  const primaryPath = getPrimarySettingsPath(boardRoot);
  const existing = await loadExistingBoardSettings(boardRoot);

  if (!existing) {
    const defaults = normalizeBoardSettings({});
    if (ensureFile) {
      return writeBoardSettings(boardRoot, defaults);
    }

    return {
      settingsPath: primaryPath,
      ...defaults,
    };
  }

  const parsed = existing.format === 'json'
    ? extractJsonBoardSettings(existing.parsed)
    : parseBoardSettings(existing.raw);
  const normalized = normalizeBoardSettings(parsed);

  if (ensureFile) {
    const shouldRewrite =
      existing.sourcePath !== primaryPath ||
      !areLabelCollectionsEqual(parsed.labels, normalized.labels) ||
      !areThemeOverridesEqual(parsed.themeOverrides, normalized.themeOverrides) ||
      !areWorkflowSettingsEqual(parsed.workflow, normalized.workflow) ||
      !areExternalPublishedCalendarSettingsEqual(parsed.externalPublishedCalendar, normalized.externalPublishedCalendar) ||
      !areObsidianBaseSettingsEqual(parsed.obsidianBase, normalized.obsidianBase) ||
      !areV2ProfilesEqual(parsed.v2, normalized.v2) ||
      hasLegacyAppSettings(parsed);

    if (shouldRewrite) {
      return writeBoardSettings(boardRoot, normalized);
    }
  }

  return {
    settingsPath: primaryPath,
    ...normalized,
  };
}

async function updateBoardLabels(boardRoot, labels = []) {
  const current = await readBoardSettings(boardRoot, { ensureFile: true });
  const nextSettings = {
    ...current,
    labels,
  };

  return writeBoardSettings(boardRoot, nextSettings);
}

async function updateBoardThemeOverrides(boardRoot, themeOverrides = {}) {
  const current = await readBoardSettings(boardRoot, { ensureFile: true });
  const nextSettings = {
    ...current,
    themeOverrides: cloneThemeOverrides(themeOverrides),
  };

  return writeBoardSettings(boardRoot, nextSettings);
}

async function updateBoardSettings(boardRoot, partialSettings = {}) {
  const current = await readBoardSettings(boardRoot, { ensureFile: true });
  const nextSettings = {
    ...current,
    ...partialSettings,
  };

  if ('labels' in partialSettings) {
    nextSettings.labels = partialSettings.labels;
  }

  if ('colorScheme' in partialSettings) {
    nextSettings.colorScheme = typeof partialSettings.colorScheme === 'string'
      ? partialSettings.colorScheme
      : '';
  }

  if ('themeOverrides' in partialSettings) {
    nextSettings.themeOverrides = cloneThemeOverrides(partialSettings.themeOverrides);
  }

  if ('workflow' in partialSettings) {
    nextSettings.workflow = cloneWorkflowSettings(partialSettings.workflow);
  }

  if ('externalPublishedCalendar' in partialSettings) {
    nextSettings.externalPublishedCalendar = cloneExternalPublishedCalendarSettings(partialSettings.externalPublishedCalendar);
  }

  if ('obsidianBase' in partialSettings) {
    nextSettings.obsidianBase = cloneObsidianBaseSettings(partialSettings.obsidianBase);
  }

  if ('v2' in partialSettings) {
    const currentV2 = isObject(current.v2) ? current.v2 : {};
    const partialV2 = isObject(partialSettings.v2) ? partialSettings.v2 : {};
    nextSettings.v2 = {
      ...currentV2,
      ...partialV2,
    };

    for (const nestedKey of ['stages', 'dashboard', 'cardDefaults']) {
      if (isObject(currentV2[nestedKey]) || isObject(partialV2[nestedKey])) {
        nextSettings.v2[nestedKey] = {
          ...(isObject(currentV2[nestedKey]) ? currentV2[nestedKey] : {}),
          ...(isObject(partialV2[nestedKey]) ? partialV2[nestedKey] : {}),
        };
      }
    }
  }

  return writeBoardSettings(boardRoot, nextSettings);
}

async function readLegacyBoardAppSettings(boardRoot) {
  const existing = await loadExistingBoardSettings(boardRoot);
  if (!existing) {
    return {
      notifications: cloneNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS),
      tooltipsEnabled: DEFAULT_TOOLTIPS_ENABLED,
      hasLegacyAppSettings: false,
    };
  }

  const parsed = existing.format === 'json'
    ? extractJsonBoardSettings(existing.parsed)
    : parseBoardSettings(existing.raw);
  return {
    notifications: cloneNotificationSettings(parsed.notifications),
    tooltipsEnabled: normalizeTooltipsEnabled(parsed.tooltipsEnabled),
    hasLegacyAppSettings: hasLegacyAppSettings(parsed),
  };
}

function cardMatchesLabelFilter(cardLabelIds = [], selectedLabelIds = []) {
  if (!Array.isArray(selectedLabelIds) || selectedLabelIds.length === 0) {
    return true;
  }

  if (!Array.isArray(cardLabelIds) || cardLabelIds.length === 0) {
    return false;
  }

  const selected = new Set(selectedLabelIds.map((id) => String(id).trim()).filter(Boolean));
  if (selected.size === 0) {
    return true;
  }

  return cardLabelIds.some((id) => selected.has(String(id).trim()));
}

module.exports = {
  SETTINGS_FILE_NAME,
  LEGACY_SETTINGS_FILE_NAME,
  BOARD_SETTINGS_KEY,
  DEFAULT_LABELS: cloneDefaultLabels,
  DEFAULT_THEME_BACKGROUNDS: () => ({ ...DEFAULT_THEME_BACKGROUNDS }),
  DEFAULT_V2_PROFILE: cloneDefaultV2Profile,
  V2_STAGE_KEYS: [...V2_STAGE_KEYS],
  DEFAULT_V2_DASHBOARD_SECTIONS: [...DEFAULT_V2_DASHBOARD_SECTIONS],
  normalizeBoardSettings,
  normalizeV2Profile,
  readBoardSettings,
  writeBoardSettings,
  updateBoardLabels,
  updateBoardThemeOverrides,
  updateBoardSettings,
  readLegacyBoardAppSettings,
  cardMatchesLabelFilter,
  normalizeExternalPublishedCalendarSettings,
  normalizeWorkflowSettings,
  isAutoDetectedCompletedListName,
  isCompletedListByWorkflow,
};
