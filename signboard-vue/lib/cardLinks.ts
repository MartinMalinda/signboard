function parseUrl(value: string) {
  try {
    return new URL(String(value || '').trim())
  } catch {
    return null
  }
}

export function isSignboardCardLink(value: string) {
  const parsed = parseUrl(value)
  return parsed?.protocol === 'signboard:' && (parsed.hostname || parsed.pathname.replace(/^\/+/, '')) === 'open-card'
}

export function isRelativeCardLink(value: string) {
  const raw = String(value || '').trim()
  if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return false
  const path = raw.split(/[?#]/, 1)[0] || ''
  return /\.md$/i.test(path)
}

export function isCardLink(value: string) {
  return isSignboardCardLink(value) || isRelativeCardLink(value)
}

export function resolveRelativeCardLink(value: string, currentCardPath: string) {
  if (!isRelativeCardLink(value) || !currentCardPath) return ''

  const rawPath = decodeURIComponent(String(value).trim().split(/[?#]/, 1)[0] || '').replace(/\\/g, '/')
  const currentPath = String(currentCardPath).replace(/\\/g, '/')
  const base = currentPath.slice(0, currentPath.lastIndexOf('/'))
  const parts = `${base}/${rawPath}`.split('/')
  const normalized: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') normalized.pop()
    else normalized.push(part)
  }

  const resolved = `/${normalized.join('/')}`
  return currentPath.startsWith('/') ? resolved : resolved.slice(1)
}
