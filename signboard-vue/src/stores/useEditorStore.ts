import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createSerializedSaveQueue } from '../../lib/cardSaveQueue.js'
import type { CardRead, LinkedObject } from '../types'
import { useStaticModalStore } from './useStaticModalStore'
import { normalizeCardLinkedObjects, removeLinkedObject as removeLinkedObjectMetadata } from '../../lib/linkedObjects.js'
import { applySmartActionPreview, normalizePreview } from '../../lib/smartActions.js'
import { useLabelsStore } from './useLabelsStore'
import { useSettingsStore } from './useSettingsStore'

type Frontmatter = Record<string, unknown>

function cloneFrontmatter(value: Frontmatter) {
  return JSON.parse(JSON.stringify(value || {})) as Frontmatter
}

function stateKey(title: string, body: string, frontmatter: Frontmatter) {
  return JSON.stringify({ title, body, frontmatter })
}

function listPathForCard(cardPath: string) {
  const normalized = String(cardPath || '').replace(/\\/g, '/')
  return normalized.slice(0, normalized.lastIndexOf('/'))
}

function boardPathForCard(cardPath: string) {
  const listPath = listPathForCard(cardPath)
  return listPath.slice(0, listPath.lastIndexOf('/') + 1)
}

function makeDuplicatePath(cardPath: string) {
  const name = String(cardPath).split('/').pop() || '000-card.md'
  const suffix = Math.random().toString(36).slice(2, 7)
  const nextName = `999${name.slice(3, -8)}${suffix}.md`
  return `${cardPath.slice(0, -name.length)}${nextName}`
}

export const useEditorStore = defineStore('editor', () => {
  const isOpen = ref(false)
  const loading = ref(false)
  const cardPath = ref('')
  const title = ref('')
  const body = ref('')
  const frontmatter = ref<Frontmatter>({})
  const timestamps = ref<CardRead['timestamps']>()
  const diskKey = ref('')
  const saveError = ref<unknown>(null)
  const focusNotes = ref(false)
  const saveGeneration = ref(0)
  const saveQueue = createSerializedSaveQueue({
    delay: 300,
    save: async (payload: { generation: number; path: string; title: string; body: string; frontmatter: Frontmatter }) => {
      if (payload.generation !== saveGeneration.value || payload.path !== cardPath.value) return
      const normalized = await window.board.normalizeFrontmatter({ ...payload.frontmatter, title: payload.title.trim() })
      await window.board.writeCard(payload.path, { frontmatter: normalized, body: payload.body })
      if (payload.generation !== saveGeneration.value || payload.path !== cardPath.value) return
      frontmatter.value = cloneFrontmatter(normalized)
      diskKey.value = stateKey(String(normalized.title || '').trim(), payload.body, normalized)
      saveError.value = null
    },
    onError: (error: unknown) => { saveError.value = error },
  })

  const isDirty = computed(() => stateKey(title.value, body.value, frontmatter.value) !== diskKey.value)
  const isSaving = computed(() => saveQueue.pending)
  const linkedObjects = computed(() => normalizeCardLinkedObjects(frontmatter.value))

  function currentPayload() {
    return { generation: saveGeneration.value, path: cardPath.value, title: title.value, body: body.value, frontmatter: cloneFrontmatter(frontmatter.value) }
  }

  function queueSave() {
    if (!isOpen.value || !cardPath.value) return
    saveQueue.enqueue(currentPayload())
  }

  async function open(path: string, options: { focusNotes?: boolean } = {}) {
    const nextPath = String(path || '').trim()
    if (!nextPath) return false
    if (isOpen.value) await close()
    loading.value = true
    saveGeneration.value += 1
    try {
      const card = await window.board.readCard(nextPath)
      cardPath.value = nextPath
      frontmatter.value = cloneFrontmatter(card.frontmatter)
      title.value = String(card.frontmatter?.title || '')
      body.value = String(card.body || '')
      timestamps.value = card.timestamps
      diskKey.value = stateKey(title.value, body.value, frontmatter.value)
      saveError.value = null
      focusNotes.value = Boolean(options.focusNotes)
      isOpen.value = true
      return true
    } catch (error) {
      saveError.value = error
      return false
    } finally { loading.value = false }
  }

  async function flush() { await saveQueue.flush() }

  async function close() {
    if (!isOpen.value) return
    await flush()
    saveQueue.cancel()
    saveGeneration.value += 1
    isOpen.value = false
    cardPath.value = ''
    focusNotes.value = false
  }

  function setTitle(value: string) { title.value = value; queueSave() }
  function setBody(value: string) { body.value = value; queueSave() }

  async function setDate(kind: 'start' | 'due', value: string) {
    const next = { ...frontmatter.value }
    if (value) next[kind] = value
    else delete next[kind]
    frontmatter.value = next
    queueSave()
    await flush()
  }

  async function setLabels(ids: string[]) {
    const next = { ...frontmatter.value }
    const normalized = [...new Set(ids.map(String).map((id) => id.trim()).filter(Boolean))]
    if (normalized.length) next.labels = normalized
    else delete next.labels
    frontmatter.value = next
    queueSave()
    await flush()
  }

  async function refreshFromDiskIfClean() {
    if (!isOpen.value || isDirty.value || saveQueue.pending) return false
    const path = cardPath.value
    const card = await window.board.readCard(path)
    const nextKey = stateKey(String(card.frontmatter?.title || ''), String(card.body || ''), card.frontmatter || {})
    if (nextKey === diskKey.value) return false
    title.value = String(card.frontmatter?.title || '')
    body.value = String(card.body || '')
    frontmatter.value = cloneFrontmatter(card.frontmatter)
    timestamps.value = card.timestamps
    diskKey.value = nextKey
    return true
  }

  async function moveToList(targetListPath: string) {
    if (!cardPath.value || !window.board.moveCardToTop) return false
    await flush()
    const result = await window.board.moveCardToTop(cardPath.value, targetListPath)
    const nextPath = result?.cardPath || ''
    if (!nextPath) return false
    cardPath.value = nextPath
    diskKey.value = stateKey(title.value, body.value, frontmatter.value)
    return true
  }

  async function archive() {
    if (!cardPath.value || !window.board.archiveCard) return false
    await flush()
    await window.board.archiveCard(cardPath.value)
    await close()
    return true
  }

  async function duplicate() {
    if (!cardPath.value) return ''
    await flush()
    const source = await window.board.readCard(cardPath.value)
    const nextPath = makeDuplicatePath(cardPath.value)
    const createdAt = new Date().toISOString()
    const nextFrontmatter = await window.board.normalizeFrontmatter({
      ...source.frontmatter,
      title: `Copy of ${source.frontmatter?.title || 'Untitled'}`,
      createdAt,
      activity: [{ type: 'created', at: createdAt }],
    })
    delete nextFrontmatter.archive
    await window.board.writeCard(nextPath, { frontmatter: nextFrontmatter, body: source.body })
    return nextPath
  }

  async function openWith(action: 'default' | 'reveal' | 'obsidian' | 'copy-signboard' | 'copy-obsidian') {
    const path = cardPath.value
    if (!path) return
    if (action === 'default') return window.board.openCardDefault?.(path)
    if (action === 'reveal') return window.board.openCard?.(path)
    const result = action === 'obsidian'
      ? await window.board.openCardInObsidian?.(path)
      : action === 'copy-signboard'
        ? await window.board.copyCardSignboardUri?.(path)
        : await window.board.copyCardObsidianUri?.(path)
    if (result && typeof result === 'object' && 'error' in result && result.error === 'NOT_IN_OBSIDIAN_VAULT') useStaticModalStore().showObsidianVaultRequired('This feature only works when the current board folder is stored inside an Obsidian vault.')
    return result
  }

  function applyFrontmatterResult(result: { frontmatter?: Frontmatter } | null | undefined) {
    if (result?.frontmatter) {
      frontmatter.value = cloneFrontmatter(result.frontmatter)
      diskKey.value = stateKey(title.value, body.value, frontmatter.value)
    }
  }

  async function addLinkedObject(input: LinkedObject) {
    if (!cardPath.value || !window.board.addLinkedObject) return null
    try {
      const result = await window.board.addLinkedObject(cardPath.value, input)
      applyFrontmatterResult(result)
      return result
    } catch (error) { saveError.value = error; return null }
  }

  async function removeLinkedObject(object: LinkedObject) {
    if (!cardPath.value || !window.board.updateFrontmatter) return false
    const partial = removeLinkedObjectMetadata(frontmatter.value, object)
    const next = await window.board.updateFrontmatter(cardPath.value, partial)
    applyFrontmatterResult({ frontmatter: next })
    return true
  }

  async function openLinkedObject(object: LinkedObject) {
    if (!cardPath.value || !window.board.openLinkedObject) return null
    const result = await window.board.openLinkedObject(cardPath.value, object)
    if (result?.error === 'NOT_IN_OBSIDIAN_VAULT') useStaticModalStore().showObsidianVaultRequired('This feature only works when the current board folder is stored inside an Obsidian vault.')
    return result
  }

  async function recreateLinkedNote(object: LinkedObject) {
    if (!cardPath.value || !window.board.recreateLinkedObsidianNote) return null
    const result = await window.board.recreateLinkedObsidianNote(boardPathForCard(cardPath.value), cardPath.value, object)
    if (result?.error === 'NOT_IN_OBSIDIAN_VAULT') useStaticModalStore().showObsidianVaultRequired('This feature only works when the current board folder is stored inside an Obsidian vault.')
    applyFrontmatterResult(result)
    return result
  }

  async function relinkLinkedNote(object: LinkedObject, next: LinkedObject) {
    if (!cardPath.value || !window.board.relinkLinkedObsidianNote) return null
    const result = await window.board.relinkLinkedObsidianNote(boardPathForCard(cardPath.value), cardPath.value, object, next)
    if (result?.error === 'NOT_IN_OBSIDIAN_VAULT') useStaticModalStore().showObsidianVaultRequired('This feature only works when the current board folder is stored inside an Obsidian vault.')
    applyFrontmatterResult(result)
    return result
  }

  async function createLinkedNote() {
    if (!cardPath.value || !window.board.createLinkedObsidianNote) return null
    const result = await window.board.createLinkedObsidianNote(boardPathForCard(cardPath.value), cardPath.value)
    if (result?.error === 'NOT_IN_OBSIDIAN_VAULT' || result?.inVault === false) useStaticModalStore().showObsidianVaultRequired('This feature only works when the current board folder is stored inside an Obsidian vault.')
    applyFrontmatterResult(result)
    return result
  }

  async function runSmartAction(action: Record<string, unknown>, options: { prompt?: string; target?: string; pasteText?: string } = {}) {
    if (!cardPath.value || !window.electronAPI.runSmartCardAction) return null
    const result = await window.electronAPI.runSmartCardAction({
      actionId: action.id,
      prompt: options.prompt || '', target: options.target || '', pasteText: options.pasteText || '',
      context: { title: title.value, body: body.value, frontmatter: cloneFrontmatter(frontmatter.value), cardPath: cardPath.value },
    })
    return result?.ok === false ? result : normalizePreview(result || {}, action)
  }

  async function applySmartAction(result: Record<string, unknown>, action: Record<string, unknown>) {
    if (!cardPath.value) return false
    const labels = useLabelsStore().labels
    const preview = normalizePreview(result, action)
    const next = applySmartActionPreview({ title: title.value, body: body.value, frontmatter: frontmatter.value, linkedObjects: [] }, result, { action, availableLabels: labels }) as { title: string; body: string; frontmatter: Frontmatter }
    if (preview.readOnly) return false
    if (next.title !== title.value) setTitle(next.title)
    if (next.body !== body.value) setBody(next.body)
    const partial: Frontmatter = {}
    if (next.frontmatter.due !== frontmatter.value.due) partial.due = next.frontmatter.due || undefined
    if (next.frontmatter.labels) partial.labels = next.frontmatter.labels
    if (Object.keys(partial).length) { frontmatter.value = { ...frontmatter.value, ...partial }; queueSave() }
    await flush()
    for (const attachment of preview.attachments) await addLinkedObject(attachment)
    return true
  }

  return { isOpen, loading, cardPath, title, body, frontmatter, timestamps, focusNotes, isDirty, isSaving, saveError, linkedObjects,
    listPathForCard, boardPathForCard, open, close, flush, setTitle, setBody, setDate, setLabels,
    refreshFromDiskIfClean, moveToList, archive, duplicate, openWith, queueSave,
    addLinkedObject, removeLinkedObject, openLinkedObject, recreateLinkedNote, relinkLinkedNote, createLinkedNote, runSmartAction, applySmartAction }
})
