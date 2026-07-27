const LEGACY_LIST_NAME_PATTERN = /^(\d{3}-)(.*?)(-[^-]{5}|-stock)$/

export function getListDisplayName(directoryName) {
  const normalized = String(directoryName || '').trim()
  if (!normalized) return 'Untitled'
  if (normalized === 'XXX-Archive') return 'Archive'

  const legacy = normalized.match(LEGACY_LIST_NAME_PATTERN)
  if (legacy) return String(legacy[2] || '').trim() || 'Untitled'
  return normalized.replace(/^\d+-/, '') || 'Untitled'
}

export function getLegacyListNameParts(directoryName) {
  return String(directoryName || '').trim().match(LEGACY_LIST_NAME_PATTERN)
}
