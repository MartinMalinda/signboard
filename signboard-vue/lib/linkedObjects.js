// Linked-object helpers used by the canonical Vue renderer.
function getLinkedObjectUtilityStringList(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  const normalized = String(value || '').trim();
  return normalized ? [normalized] : [];
}

function getLinkedObjectUtilityWikiTarget(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^!?\[\[([^\]]+)\]\]$/);
  if (!match) {
    return '';
  }

  const inner = String(match[1] || '').trim();
  const pipeIndex = inner.indexOf('|');
  const targetWithAnchor = (pipeIndex >= 0 ? inner.slice(0, pipeIndex) : inner).trim();
  const target = targetWithAnchor.split('#')[0].replace(/\\/g, '/').replace(/^\/+/, '').trim();
  return target || raw;
}

function getLinkedObjectUtilityUrlKey(value) {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return '';
  }

  try {
    const parsedUrl = new URL(candidate);
    return ['http:', 'https:'].includes(parsedUrl.protocol)
      ? `url:${parsedUrl.href}`
      : '';
  } catch {
    return '';
  }
}

function getLinkedObjectUtilityStructuredKey(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  const type = String(value.type || '').trim();
  if (!type) {
    return '';
  }

  if (type === 'file' || type === 'folder') {
    const targetPath = String(value.path || '').trim();
    return targetPath ? `${type}:${targetPath}` : '';
  }

  if (type === 'url') {
    return getLinkedObjectUtilityUrlKey(value.url) || `url:${String(value.url || '').trim()}`;
  }

  if (type === 'app-link' || type === 'signboard-link') {
    const targetUrl = String(value.url || value.target || '').trim();
    return targetUrl ? `${type}:${targetUrl}` : '';
  }

  if (type === 'obsidian-note') {
    const notePath = String(value.path || '').trim();
    const target = String(value.target || value.raw || '').trim();
    return notePath
      ? `obsidian-note:${notePath}`
      : (target ? `obsidian-target:${target}` : '');
  }

  const fallbackTarget = String(value.target || value.url || value.path || value.title || '').trim();
  return fallbackTarget ? `${type}:${fallbackTarget}` : '';
}

function getFrontmatterLinkedObjectCount(frontmatter = {}) {
  const metadata = frontmatter && typeof frontmatter === 'object' ? frontmatter : {};
  const seen = new Set();
  let count = 0;

  const addObjectKey = (key, aliases = []) => {
    const normalizedKey = String(key || '').trim();
    const normalizedAliases = (Array.isArray(aliases) ? aliases : [])
      .map((alias) => String(alias || '').trim())
      .filter(Boolean);
    const allKeys = [normalizedKey, ...normalizedAliases].filter(Boolean);
    if (allKeys.length === 0 || allKeys.some((candidateKey) => seen.has(candidateKey))) {
      return;
    }

    for (const candidateKey of allKeys) {
      seen.add(candidateKey);
    }
    count += 1;
  };

  const structuredObjects = Array.isArray(metadata.linked_objects) ? metadata.linked_objects : [];
  for (const linkedObject of structuredObjects) {
    const key = getLinkedObjectUtilityStructuredKey(linkedObject);
    const aliases = [];

    if (linkedObject && typeof linkedObject === 'object' && !Array.isArray(linkedObject)) {
      const type = String(linkedObject.type || '').trim();
      const target = String(linkedObject.target || linkedObject.raw || '').trim();
      if (type === 'obsidian-note' && target) {
        aliases.push(`obsidian-target:${target}`);
      }
    }

    addObjectKey(key, aliases);
  }

  for (const relatedValue of getLinkedObjectUtilityStringList(metadata.related)) {
    const wikiTarget = getLinkedObjectUtilityWikiTarget(relatedValue);
    if (wikiTarget) {
      addObjectKey(`obsidian-target:${relatedValue}`);
      continue;
    }

    addObjectKey(getLinkedObjectUtilityUrlKey(relatedValue));
  }

  return count;
}

function parseRelatedObsidianNote(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^!?\[\[([^\]]+)\]\]$/);
  if (!match) return null;
  const inner = String(match[1] || '').trim();
  const pipe = inner.indexOf('|');
  const targetWithAnchor = (pipe >= 0 ? inner.slice(0, pipe) : inner).trim();
  const target = targetWithAnchor.split('#')[0].replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!target) return null;
  const name = target.split('/').filter(Boolean).pop()?.replace(/\.md$/i, '') || target;
  return { raw, target, title: (pipe >= 0 ? inner.slice(pipe + 1) : '').trim() || name };
}

function normalizeLinkedObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const type = String(value.type || '').trim();
  if (!type) return null;
  const title = String(value.title || value.label || '').trim();
  if (type === 'file' || type === 'folder') {
    const path = String(value.path || '').trim();
    return path ? { type, title: title || path.split(/[\\/]/).filter(Boolean).pop() || path, path } : null;
  }
  if (type === 'url') {
    const url = String(value.url || '').trim();
    return url ? { type, title: title || url, url, ...(value.faviconPath ? { faviconPath: String(value.faviconPath) } : {}) } : null;
  }
  if (type === 'app-link' || type === 'signboard-link') {
    const url = String(value.url || value.target || '').trim();
    return url ? { type, title: title || (type === 'signboard-link' ? 'Signboard link' : url), url } : null;
  }
  if (type === 'obsidian-note') {
    const target = String(value.target || value.raw || '').trim();
    const raw = String(value.raw || target).trim();
    const path = String(value.path || '').trim();
    const parsed = parseRelatedObsidianNote(target || raw);
    return (target || path) ? {
      type, title: title || parsed?.title || path.split(/[\\/]/).filter(Boolean).pop()?.replace(/\.md$/i, '') || 'Obsidian note', target, raw, path,
    } : null;
  }
  const target = String(value.target || value.url || value.path || value.title || '').trim();
  return target ? { ...value, type, title: title || target } : null;
}

function linkedObjectKey(value) {
  const object = normalizeLinkedObject(value);
  if (!object) return '';
  if (object.type === 'file' || object.type === 'folder') return `${object.type}:${object.path}`;
  if (object.type === 'url') return getLinkedObjectUtilityUrlKey(object.url) || `url:${object.url}`;
  if (object.type === 'app-link' || object.type === 'signboard-link') return `${object.type}:${object.url}`;
  if (object.type === 'obsidian-note') return `obsidian-note:${object.path || object.target || object.raw}`;
  return `${object.type}:${object.target || object.url || object.path || object.title}`;
}

function normalizeCardLinkedObjects(frontmatter = {}) {
  const source = frontmatter && typeof frontmatter === 'object' ? frontmatter : {};
  const result = [];
  const seen = new Set();
  const add = (value) => {
    const object = normalizeLinkedObject(value);
    const key = linkedObjectKey(object);
    if (!object || !key || seen.has(key)) return;
    if (object.type === 'obsidian-note') {
      const candidate = String(parseRelatedObsidianNote(object.target || object.raw)?.target || object.path || object.target || object.raw || '').replace(/\\/g, '/').toLowerCase();
      const alreadyRelated = result.some((existing) => {
        if (existing.type !== 'obsidian-note') return false;
        const current = String(parseRelatedObsidianNote(existing.target || existing.raw)?.target || existing.path || existing.target || existing.raw || '').replace(/\\/g, '/').toLowerCase();
        return candidate && current && (candidate === current || candidate.endsWith(`/${current}`) || current.endsWith(`/${candidate}`));
      });
      if (alreadyRelated) return;
    }
    seen.add(key);
    result.push(object);
  };
  const structured = Array.isArray(source.linked_objects) ? source.linked_objects : [];
  structured.forEach(add);
  for (const related of getLinkedObjectUtilityStringList(source.related)) {
    const note = parseRelatedObsidianNote(related);
    if (note) add({ type: 'obsidian-note', title: note.title, target: note.raw, raw: note.raw });
    else {
      const urlKey = getLinkedObjectUtilityUrlKey(related);
      if (urlKey) add({ type: 'url', title: new URL(related).hostname, url: new URL(related).href });
    }
  }
  return result;
}

function addLinkedObject(existing, next) {
  const values = normalizeCardLinkedObjects({ linked_objects: existing });
  const object = normalizeLinkedObject(next);
  if (!object) return values;
  const key = linkedObjectKey(object);
  return [...values.filter((candidate) => linkedObjectKey(candidate) !== key), object];
}

function removeLinkedObject(frontmatter = {}, target) {
  const key = linkedObjectKey(target);
  const source = frontmatter && typeof frontmatter === 'object' ? frontmatter : {};
  const linkedObjects = normalizeCardLinkedObjects(source).filter((candidate) => linkedObjectKey(candidate) !== key);
  const related = getLinkedObjectUtilityStringList(source.related).filter((value) => {
    if (target?.type === 'obsidian-note') return value !== target.target && value !== target.raw;
    if (target?.type === 'url') return value !== target.url;
    return true;
  });
  return { linked_objects: linkedObjects.length ? linkedObjects : undefined, related: related.length ? related : undefined };
}

function getLinkedObjectCountLabel(count) {
  const normalizedCount = Math.max(0, Number(count) || 0);
  return `${normalizedCount} linked object${normalizedCount === 1 ? '' : 's'}`;
}

function createLinkedObjectsMetadataBadge(count, className = '') {
  const normalizedCount = Math.max(0, Number(count) || 0);
  if (normalizedCount <= 0 || typeof document === 'undefined') {
    return null;
  }

  const badge = document.createElement('span');
  badge.className = `linked-objects-badge ${className}`.trim();
  const label = getLinkedObjectCountLabel(normalizedCount);
  badge.title = label;
  badge.setAttribute('aria-label', label);
  badge.setAttribute('data-sb-tooltip', label);

  const icon = document.createElement('span');
  icon.className = 'linked-objects-badge-icon';
  icon.setAttribute('aria-hidden', 'true');
  const featherSource = typeof window !== 'undefined' && window.feather
    ? window.feather
    : (typeof feather !== 'undefined' ? feather : null);
  if (featherSource && featherSource.icons && featherSource.icons.paperclip) {
    icon.innerHTML = featherSource.icons.paperclip.toSvg();
  }
  badge.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'linked-objects-badge-text';
  text.textContent = String(normalizedCount);
  badge.appendChild(text);

  return badge;
}

export {
  addLinkedObject,
  getFrontmatterLinkedObjectCount,
  getLinkedObjectCountLabel,
  linkedObjectKey,
  normalizeCardLinkedObjects,
  normalizeLinkedObject,
  parseRelatedObsidianNote,
  removeLinkedObject,
};
