// THIS CAN BE REMOVED WHEN Vue cutover makes this the canonical module; keep in sync with app/board/archiveBrowser.js until then.

export const ARCHIVE_TABS = Object.freeze({ cards: 'cards', lists: 'lists' })

export function archiveDisplayNameForList(directoryName) {
  const normalized = String(directoryName || '').trim()
  const structured = normalized.match(/^(\d{3}-)(.*?)(-[^-]{5}|-stock)$/)
  if (structured) return String(structured[2] || '').trim() || 'Untitled'
  return normalized.replace(/^\d+-/, '') || 'Untitled'
}

export function sanitizeArchiveRestoreListName(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Untitled'
}

export function buildArchiveRestoreListDirectoryName(originalDirectoryName, requestedDisplayName) {
  const original = String(originalDirectoryName || '').trim()
  const structured = original.match(/^(\d{3}-)(.*?)(-[^-]{5}|-stock)$/)
  if (structured) return `${structured[1]}${sanitizeArchiveRestoreListName(requestedDisplayName || structured[2])}${structured[3]}`
  return sanitizeArchiveRestoreListName(requestedDisplayName || original)
}

export function archiveEntrySearchText(entry) {
  if (!entry || typeof entry !== 'object') return ''
  const source = entry.kind === 'list'
    ? [entry.listDisplayName, entry.listDirectoryName, entry.originalListDisplayName, entry.originalListDirectoryName]
    : [entry.title, entry.cardId, entry.originalListDisplayName, entry.originalListDirectoryName, ...(Array.isArray(entry.labelNames) ? entry.labelNames : [])]
  return source.filter(Boolean).join(' ').toLowerCase()
}

export function sortArchiveEntries(entries, sortKey = 'archived-desc', tab = ARCHIVE_TABS.cards) {
  const items = Array.isArray(entries) ? entries.slice() : []
  const dateValue = (entry) => {
    const parsed = Date.parse(String(entry?.archivedAt || ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  const nameValue = (entry) => String(tab === ARCHIVE_TABS.lists ? (entry?.listDisplayName || entry?.listDirectoryName) : entry?.title || '')
  items.sort((left, right) => {
    if (sortKey === 'title-asc' || sortKey === 'name-asc') return nameValue(left).localeCompare(nameValue(right), undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
    const dateDelta = sortKey === 'archived-asc' ? dateValue(left) - dateValue(right) : dateValue(right) - dateValue(left)
    return dateDelta || nameValue(left).localeCompare(nameValue(right), undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
  })
  return items
}

export function filterArchiveEntries(entries, query = '', sortKey = 'archived-desc', tab = ARCHIVE_TABS.cards) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  const filtered = (Array.isArray(entries) ? entries : []).filter((entry) => !normalizedQuery || archiveEntrySearchText(entry).includes(normalizedQuery))
  return sortArchiveEntries(filtered, sortKey, tab)
}
