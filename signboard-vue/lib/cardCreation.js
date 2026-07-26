import { rand5, sanitizeFileName } from './santizeFileName.js';

function normalizeRoot(value) {
  const path = String(value || '').replace(/\\/g, '/').trim();
  return path ? (path.endsWith('/') ? path : `${path}/`) : '';
}

function listRoot(listPath) {
  const normalized = normalizeRoot(listPath).replace(/\/$/, '');
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '' : `${normalized.slice(0, index)}/`;
}

async function buildCardPath(listPath, cardName, cardCount) {
  const base = `${String(cardName || '').trim().slice(0, 25).toLowerCase().replace(/\s+/g, '-')}-${await rand5()}.md`;
  return `${normalizeRoot(listPath)}${String(Number(cardCount || 0) + 1).padStart(3, '0')}-${await sanitizeFileName(base)}`;
}

async function buildListPath(boardRoot, listName, listCount) {
  const base = `${String(listName || '').trim().slice(0, 25)}-${await rand5()}`;
  return `${normalizeRoot(boardRoot)}${String(Number(listCount || 0)).padStart(3, '0')}-${await sanitizeFileName(base)}`;
}

function insertAfter(items, item, after) {
  const next = items.filter((value) => value !== item);
  const index = after ? next.indexOf(after) : -1;
  next.splice(index < 0 ? next.length : index + 1, 0, item);
  return next;
}

export { normalizeRoot, listRoot, buildCardPath, buildListPath, insertAfter };
