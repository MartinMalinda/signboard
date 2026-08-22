// Board-label and workflow helpers used by the canonical Vue renderer.
const DEFAULT_LABELS = Object.freeze([
  Object.freeze({ id: 'label-1', name: 'Label 1', colorLight: '#22c55e', colorDark: '#16a34a' }),
  Object.freeze({ id: 'label-2', name: 'Label 2', colorLight: '#3b82f6', colorDark: '#2563eb' }),
  Object.freeze({ id: 'label-3', name: 'Label 3', colorLight: '#ef4444', colorDark: '#dc2626' }),
]);

const DEFAULT_WORKFLOW_SETTINGS = Object.freeze({ autoDetectCompletedLists: true, completedListNames: Object.freeze([]), ignoredCompletedListNames: Object.freeze([]) });
const AUTO_COMPLETED_LIST_NAME_KEYS = Object.freeze(['complete', 'completed', 'closed', 'done', 'finished', 'resolved', 'shipped']);

function normalizeHexColor(value, fallback) {
  const source = String(value || '').trim().toLowerCase();
  if (/^#?[a-f0-9]{3}$/.test(source)) { const compact = source.replace('#', ''); return `#${compact[0]}${compact[0]}${compact[1]}${compact[1]}${compact[2]}${compact[2]}`; }
  if (/^#?[a-f0-9]{6}$/.test(source)) return source.startsWith('#') ? source : `#${source}`;
  return fallback;
}

function normalizeLabels(rawLabels) {
  if (!Array.isArray(rawLabels)) return DEFAULT_LABELS.map((label) => ({ ...label }));
  const seen = new Set();
  const labels = rawLabels.map((raw, index) => {
    const source = raw && typeof raw === 'object' ? raw : {};
    const baseId = String(source.id || '').trim() || `label-${index + 1}`;
    let id = baseId; let suffix = 2;
    while (seen.has(id)) id = `${baseId}-${suffix++}`;
    seen.add(id);
    return { id, name: String(source.name || '').trim() || `Label ${index + 1}`, colorLight: normalizeHexColor(source.colorLight, '#3b82f6'), colorDark: normalizeHexColor(source.colorDark, '#2563eb') };
  });
  return labels.length ? labels : DEFAULT_LABELS.map((label) => ({ ...label }));
}

function displayListName(listName) {
  const normalized = String(listName || '').trim();
  const match = normalized.match(/^\d{3}-(.*?)(-[^-]{5}|-stock)$/);
  return match ? String(match[1] || '').trim() : normalized;
}

function normalizeWorkflowListIdentity(value) { return String(value || '').trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase(); }
function normalizeWorkflowListNames(values) {
  const seen = new Set(); const result = [];
  for (const value of Array.isArray(values) ? values : []) { const name = String(value || '').trim(); const identity = normalizeWorkflowListIdentity(name); if (name && !seen.has(identity)) { seen.add(identity); result.push(name); } }
  return result;
}
function normalizeWorkflowSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return { autoDetectCompletedLists: source.autoDetectCompletedLists !== false, completedListNames: normalizeWorkflowListNames(source.completedListNames || source.completedLists), ignoredCompletedListNames: normalizeWorkflowListNames(source.ignoredCompletedListNames) };
}
function isCompletedListByWorkflow(listName, workflowSettings) {
  const settings = normalizeWorkflowSettings(workflowSettings); const identity = normalizeWorkflowListIdentity(listName); if (!identity) return false;
  if (settings.completedListNames.some((value) => normalizeWorkflowListIdentity(value) === identity)) return true;
  if (settings.ignoredCompletedListNames.some((value) => normalizeWorkflowListIdentity(value) === identity)) return false;
  return settings.autoDetectCompletedLists && AUTO_COMPLETED_LIST_NAME_KEYS.includes(displayListName(listName).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim());
}

export { DEFAULT_LABELS, DEFAULT_WORKFLOW_SETTINGS, normalizeLabels, displayListName, normalizeWorkflowSettings, isCompletedListByWorkflow };
