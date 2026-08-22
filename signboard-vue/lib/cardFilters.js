// Card-filter helpers used by the canonical Vue renderer.
import { parseTaskListItems } from './taskList.js';
import { isCompletedListByWorkflow } from './boardLabels.js';
import { getCardDisplayTitle } from './cardTitle.js';

const DATE_FILTERS = Object.freeze({ none: '', today: 'today', overdue: 'overdue', next7: 'next:7', next14: 'next:14', next30: 'next:30' });
const DATE_FILTER_LABELS = Object.freeze({ [DATE_FILTERS.today]: 'Today', [DATE_FILTERS.overdue]: 'Overdue', [DATE_FILTERS.next7]: 'Next 7 days', [DATE_FILTERS.next14]: 'Next 14 days', [DATE_FILTERS.next30]: 'Next 30 days' });

function normalizeDateFilter(value) { const normalized = String(value || '').trim().toLowerCase(); return Object.values(DATE_FILTERS).includes(normalized) ? normalized : DATE_FILTERS.none; }
function normalizeIsoDate(value) { const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!match) return ''; const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])); return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? match[0] : ''; }
function todayIso(now = new Date()) { return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'); }
function addDays(iso, days) { const [year, month, day] = iso.split('-').map(Number); const date = new Date(year, month - 1, day); date.setDate(date.getDate() + days); return todayIso(date); }
function labelIdsForCard(card) { const labels = card?.frontmatter?.labels; return Array.isArray(labels) ? labels.map(String) : []; }
function actionableTaskDates(card) {
  const items = Array.isArray(card?.taskItems) && card.taskItems.length ? card.taskItems : parseTaskListItems(card?.body || '');
  const starts = Array.isArray(card?.incompleteTaskStartDates) ? card.incompleteTaskStartDates : items.filter((item) => !item.isCompleted).map((item) => item.start);
  const dues = Array.isArray(card?.incompleteTaskDueDates) ? card.incompleteTaskDueDates : items.filter((item) => !item.isCompleted).map((item) => item.due);
  return [...new Set([...starts, ...dues].map(normalizeIsoDate).filter(Boolean))];
}
function cardDates(card) { return [...new Set([card?.frontmatter?.start, card?.frontmatter?.due, ...actionableTaskDates(card)].map(normalizeIsoDate).filter(Boolean))]; }
function matchesDateFilter(card, dateFilter, options = {}) {
  const filter = normalizeDateFilter(dateFilter); if (!filter) return true; if (options.isCompletedList) return false;
  const dates = cardDates(card); if (!dates.length) return false; const today = options.today || todayIso();
  if (filter === DATE_FILTERS.today) return dates.includes(today);
  if (filter === DATE_FILTERS.overdue) return dates.some((date) => date < today);
  const days = Number(filter.split(':')[1]); const end = addDays(today, days); return dates.some((date) => date >= today && date <= end);
}
function matchesSearch(card, query) { const tokens = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean); if (!tokens.length) return true; const title = card?.displayTitle || getCardDisplayTitle(card?.frontmatter?.title, card?.cardName || card?.cardPath); const haystack = `${String(title || '')}\n${String(card?.frontmatter?.title || '')}\n${String(card?.cardName || '')}\n${String(card?.body || '')}`.toLowerCase(); return tokens.every((token) => haystack.includes(token)); }
function matchesLabels(card, selectedLabelIds) { const selected = (Array.isArray(selectedLabelIds) ? selectedLabelIds : []).map(String).filter(Boolean); return !selected.length || labelIdsForCard(card).some((id) => selected.includes(id)); }
function cardMatchesFilters(card, options = {}) { const isCompletedList = options.isCompletedList === true || isCompletedListByWorkflow(options.listName, options.workflowSettings); return matchesLabels(card, options.selectedLabelIds) && matchesDateFilter(card, options.dateFilter, { ...options, isCompletedList }); }
function getActiveFilterCount(options = {}) { return (normalizeDateFilter(options.dateFilter) ? 1 : 0) + (Array.isArray(options.selectedLabelIds) ? options.selectedLabelIds.length : 0); }

export { DATE_FILTERS, DATE_FILTER_LABELS, normalizeDateFilter, normalizeIsoDate, todayIso, actionableTaskDates, cardDates, matchesDateFilter, matchesSearch, matchesLabels, cardMatchesFilters, getActiveFilterCount };
