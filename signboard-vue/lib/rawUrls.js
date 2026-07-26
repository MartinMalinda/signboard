const RAW_URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>'"`]+/gi

function trimUrlCandidate(value) {
  let candidate = String(value || '').trim()
  while (candidate && /[),.;:!?]$/.test(candidate)) candidate = candidate.slice(0, -1)
  while (candidate.endsWith(')') && (candidate.match(/\(/g) || []).length < (candidate.match(/\)/g) || []).length) candidate = candidate.slice(0, -1)
  return candidate
}

function normalizeRawUrl(value) {
  const candidate = trimUrlCandidate(value)
  if (!candidate) return ''
  const href = /^www\./i.test(candidate) ? `https://${candidate}` : candidate
  try {
    const parsed = new URL(href)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch { return '' }
}

function findRawUrls(source) {
  const text = String(source || '')
  const matches = []
  RAW_URL_PATTERN.lastIndex = 0
  let match = RAW_URL_PATTERN.exec(text)
  while (match) {
    const raw = match[0]
    const textValue = trimUrlCandidate(raw)
    const url = normalizeRawUrl(textValue)
    if (url) matches.push({ text: textValue, url, start: match.index, end: match.index + textValue.length })
    match = RAW_URL_PATTERN.exec(text)
  }
  RAW_URL_PATTERN.lastIndex = 0
  return matches
}

function markRawUrls(text) {
  const source = String(text || '')
  const matches = findRawUrls(source)
  if (!matches.length) return [{ type: 'text', value: source }]
  const parts = []
  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) parts.push({ type: 'text', value: source.slice(cursor, match.start) })
    parts.push({ type: 'url', value: match.text, url: match.url, start: match.start, end: match.end })
    cursor = match.end
  }
  if (cursor < source.length) parts.push({ type: 'text', value: source.slice(cursor) })
  return parts
}

export { findRawUrls, markRawUrls, normalizeRawUrl, trimUrlCandidate }
