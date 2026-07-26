function clean(value) { return String(value || '').replace(/\r\n?/g, '\n').trim() }

function normalizeTasks(tasks) {
  const seen = new Set()
  return (Array.isArray(tasks) ? tasks : []).map((item) => clean(typeof item === 'object' ? item.text || item.title || item.task : item)).map((item) => item.replace(/^[-*+]\s+/, '').replace(/^\[[ xX]\]\s+/, '')).filter((item) => item && !seen.has(item.toLowerCase()) && seen.add(item.toLowerCase()))
}

function normalizeAttachments(attachments) {
  const seen = new Set()
  return (Array.isArray(attachments) ? attachments : []).map((item) => {
    if (typeof item === 'string') return { type: 'url', url: clean(item) }
    return { type: item?.type || 'url', url: clean(item?.url || item?.href || item?.target), title: clean(item?.title || item?.name || item?.label) }
  }).filter((item) => /^https?:\/\//i.test(item.url) && !seen.has(item.url) && seen.add(item.url))
}

function normalizePreview(result = {}, action = {}) {
  const actionType = String(result.actionType || action.type || '')
  return {
    actionId: result.actionId || action.id || '',
    actionType,
    actionTarget: result.actionTarget || action.target || 'content',
    label: result.label || action.label || 'Smart Card Action',
    title: clean(result.title),
    body: clean(result.body),
    tasks: normalizeTasks(result.tasks),
    labels: (Array.isArray(result.labels) ? result.labels : []).map(clean).filter(Boolean),
    due: /^\d{4}-\d{2}-\d{2}$/.test(clean(result.due)) ? clean(result.due) : '',
    attachments: normalizeAttachments(result.attachments),
    answer: clean(result.answer),
    readOnly: actionType === 'answer' || actionType === 'question' || action.type === 'question',
  }
}

function contentForPreview(preview) {
  if (preview.body) return preview.body
  if (preview.actionType === 'summary') return preview.body
  if (preview.tasks.length) return preview.tasks.map((task) => `- [ ] ${task}`).join('\n')
  return ''
}

function appendMarkdown(current, addition) {
  const before = clean(current)
  const next = clean(addition)
  if (!next) return before
  return before ? `${before}\n\n${next}` : next
}

function applySmartActionPreview(state, result, options = {}) {
  const preview = normalizePreview(result, options.action || {})
  if (preview.readOnly) return { ...state }
  const next = { ...state, frontmatter: { ...(state.frontmatter || {}) }, linkedObjects: [...(state.linkedObjects || [])] }
  const target = preview.actionTarget
  if (preview.title && (preview.actionType === 'title' || target === 'title')) next.title = preview.title
  if (preview.due && (preview.actionType === 'due' || target === 'due')) next.frontmatter.due = preview.due
  if (preview.labels.length && (preview.actionType === 'labels' || target === 'labels')) {
    const ids = (options.availableLabels || []).filter((label) => preview.labels.some((value) => `${label.id}`.toLowerCase() === value.toLowerCase() || `${label.name}`.toLowerCase() === value.toLowerCase())).map((label) => label.id)
    next.frontmatter.labels = [...new Set([...(Array.isArray(state.frontmatter?.labels) ? state.frontmatter.labels : []), ...ids])]
  }
  const content = contentForPreview(preview)
  if (content && (preview.actionType === 'summary' || preview.actionType === 'tasks' || preview.actionType === 'paste' || preview.actionType === 'custom' || target === 'content')) next.body = appendMarkdown(state.body, content)
  if (preview.attachments.length && (preview.actionType === 'attachments' || target === 'attachments')) next.linkedObjects.push(...preview.attachments)
  return next
}

export { appendMarkdown, applySmartActionPreview, contentForPreview, normalizePreview, normalizeTasks, normalizeAttachments }
