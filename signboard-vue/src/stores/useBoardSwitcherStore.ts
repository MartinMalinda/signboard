import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getBoardDisplayName, normalizeBoardPath, useBoardsStore } from './useBoardsStore'

export const useBoardSwitcherStore = defineStore('boardSwitcher', () => {
  const boards = useBoardsStore()
  const isOpen = ref(false)
  const query = ref('')
  const activeIndex = ref(-1)
  const switching = ref(false)

  const options = computed(() => boards.openBoardPaths.map((path) => ({
    path: normalizeBoardPath(path),
    label: getBoardDisplayName(path),
    isCurrent: normalizeBoardPath(path) === normalizeBoardPath(boards.activeBoardPath),
  })))
  const filteredOptions = computed(() => {
    const tokens = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!tokens.length) return options.value
    return options.value.filter((option) => tokens.every((token) => option.label.toLowerCase().includes(token)))
  })

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

  async function select(path: string, onSwitch?: (path: string) => Promise<boolean>) {
    const option = filteredOptions.value.find((candidate) => candidate.path === path)
    if (!option || switching.value) return false
    if (option.isCurrent) { close(); return true }
    switching.value = true
    try {
      const switched = onSwitch ? await onSwitch(option.path) : await boards.activateBoard(option.path)
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

  return { isOpen, query, activeIndex, switching, options, filteredOptions, open, close, toggle, setQuery, move, moveTo, selectedOption, select, closeBoard }
})
