import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getBoardDisplayName, normalizeBoardPath, useBoardsStore } from './useBoardsStore'
import { useBoardDataStore } from './useBoardDataStore'
import { matchesSearch } from '../../lib/cardFilters.js'
import { getListDisplayName } from '../../lib/listNaming.js'
import { getCardDisplayTitle } from '../../lib/cardTitle.js'

type BoardOption = {
  kind: 'board'
  path: string
  label: string
  isCurrent: boolean
}

type CardOption = {
  kind: 'card'
  path: string
  cardPath: string
  label: string
  listLabel: string
  excerptParts: Array<{ text: string; isMatch: boolean }>
  isCurrent: true
}

type SwitcherOption = BoardOption | CardOption

function cardSearchScore(card: { cardName?: unknown; frontmatter?: { title?: unknown }; body?: unknown }, query: string) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const title = getCardDisplayTitle(card.frontmatter?.title, card.cardName).toLowerCase()
  const body = String(card.body || '').toLowerCase()
  const titleTokenMatches = tokens.filter((token) => title.includes(token)).length
  const bodyTokenMatches = tokens.filter((token) => body.includes(token)).length

  // Prefer cards whose titles identify the search intent; keep body-only matches available below them.
  return (title.includes(normalizedQuery) ? 10000 : 0)
    + titleTokenMatches * 100
    + (body.includes(normalizedQuery) ? 10 : 0)
    + bodyTokenMatches
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightExcerpt(text: string, query: string) {
  const tokens = [...new Set(String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean))]
    .sort((left, right) => right.length - left.length)
  if (!text || !tokens.length) return text ? [{ text, isMatch: false }] : []

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi')
  const parts: Array<{ text: string; isMatch: boolean }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = matcher.exec(text))) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), isMatch: false })
    parts.push({ text: match[0], isMatch: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isMatch: false })
  return parts
}

function cardExcerptParts(card: { body?: unknown }, query: string) {
  const body = String(card.body || '').replace(/\s+/g, ' ').trim()
  if (!body) return []

  const normalizedQuery = String(query || '').trim().toLowerCase()
  const lowerBody = body.toLowerCase()
  const phraseIndex = lowerBody.indexOf(normalizedQuery)
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const tokenMatch = tokens
    .map((token) => ({ token, index: lowerBody.indexOf(token) }))
    .filter(({ index }) => index >= 0)
    .sort((left, right) => left.index - right.index)[0]
  const matchIndex = phraseIndex >= 0 ? phraseIndex : tokenMatch?.index ?? 0
  const contextLength = 52
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(body.length, matchIndex + Math.max(normalizedQuery.length, tokenMatch?.token.length || 0) + contextLength)
  const parts = highlightExcerpt(body.slice(start, end), query)
  if (start > 0) parts.unshift({ text: '…', isMatch: false })
  if (end < body.length) parts.push({ text: '…', isMatch: false })
  return parts
}

export const useBoardSwitcherStore = defineStore('boardSwitcher', () => {
  const boards = useBoardsStore()
  const boardData = useBoardDataStore()
  const isOpen = ref(false)
  const query = ref('')
  const activeIndex = ref(-1)
  const switching = ref(false)

  const options = computed<BoardOption[]>(() => boards.openBoardPaths.map((path) => ({
    kind: 'board',
    path: normalizeBoardPath(path),
    label: getBoardDisplayName(path),
    isCurrent: normalizeBoardPath(path) === normalizeBoardPath(boards.activeBoardPath),
  })))
  const filteredBoardOptions = computed(() => {
    const tokens = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!tokens.length) return options.value
    return options.value.filter((option) => tokens.every((token) => option.label.toLowerCase().includes(token)))
  })
  const cardOptions = computed<CardOption[]>(() => {
    if (!query.value.trim() || !boardData.snapshot || normalizeBoardPath(boardData.snapshot.boardRoot) !== normalizeBoardPath(boards.activeBoardPath)) return []
    const matches = boardData.lists.flatMap((list) => list.cards
      .map((card) => ({ card, list }))
      .filter(({ card }) => matchesSearch(card, query.value)))
    return matches
      .map((entry, index) => ({ ...entry, index }))
      .sort((left, right) => cardSearchScore(right.card, query.value) - cardSearchScore(left.card, query.value) || left.index - right.index)
      .map(({ card, list }) => ({
        kind: 'card' as const,
        path: card.cardPath,
        cardPath: card.cardPath,
        label: card.displayTitle || getCardDisplayTitle(card.frontmatter?.title, card.cardName),
        listLabel: getListDisplayName(list.listName),
        excerptParts: cardExcerptParts(card, query.value),
        isCurrent: true as const,
      }))
  })
  const filteredOptions = computed<SwitcherOption[]>(() => [...filteredBoardOptions.value, ...cardOptions.value])

  function defaultIndex() {
    const index = filteredOptions.value.findIndex((option) => !option.isCurrent)
    return index >= 0 ? index : filteredOptions.value.length ? 0 : -1
  }

  function normalizeIndex() {
    if (activeIndex.value < 0 || activeIndex.value >= filteredOptions.value.length) activeIndex.value = defaultIndex()
  }

  function open() {
    query.value = ''
    activeIndex.value = defaultIndex()
    isOpen.value = true
    return true
  }

  function close() {
    isOpen.value = false
    query.value = ''
    activeIndex.value = -1
  }

  function toggle() { if (isOpen.value) close(); else open() }

  function setQuery(value: string) {
    query.value = value
    activeIndex.value = defaultIndex()
  }

  function move(delta: number) {
    normalizeIndex()
    const count = filteredOptions.value.length
    if (!count) return
    activeIndex.value = (activeIndex.value + delta + count) % count
  }

  function moveTo(index: number) {
    const count = filteredOptions.value.length
    if (!count) { activeIndex.value = -1; return }
    activeIndex.value = Math.max(0, Math.min(count - 1, index))
  }

  function selectedOption() {
    normalizeIndex()
    return filteredOptions.value[activeIndex.value] || null
  }

  async function select(option: SwitcherOption, onSwitch?: (path: string) => Promise<boolean>, onOpenCard?: (path: string) => Promise<void>) {
    if (option.kind === 'card') {
      if (switching.value) return false
      switching.value = true
      try {
        close()
        await onOpenCard?.(option.cardPath)
        return true
      } finally {
        switching.value = false
      }
    }
    if (!option || switching.value) return false
    const boardOption = filteredOptions.value.find((candidate): candidate is BoardOption => candidate.kind === 'board' && candidate.path === option.path)
    if (!boardOption) return false
    if (boardOption.isCurrent) { close(); return true }
    switching.value = true
    try {
      const switched = onSwitch ? await onSwitch(boardOption.path) : await boards.activateBoard(boardOption.path)
      if (switched) close()
      return switched
    } finally {
      switching.value = false
    }
  }

  async function closeBoard(path: string) {
    await boards.closeBoard(path)
    normalizeIndex()
  }

  return { isOpen, query, activeIndex, switching, options, filteredOptions, cardOptions, open, close, toggle, setQuery, move, moveTo, selectedOption, select, closeBoard }
})
