import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BoardListSnapshot, BoardSnapshot } from '../types'
import { useLabelsStore } from './useLabelsStore'
import { useViewStore } from './useViewStore'

function comparableBoardRoot(value: unknown) {
  return String(value || '').replace(/\\/g, '/').replace(/\/+$/, '').trim()
}

export const useBoardDataStore = defineStore('boardData', () => {
  const snapshot = ref<BoardSnapshot | null>(null)
  const error = ref<unknown>(null)
  let loadToken = 0

  async function loadBoard(boardRoot: string, options: { preserveSnapshot?: boolean } = {}) {
    const token = ++loadToken
    const normalizedRoot = String(boardRoot || '').trim()
    if (!normalizedRoot) {
      snapshot.value = null
      error.value = null
      useLabelsStore().clear()
      useViewStore().prepareBoard('')
      return
    }

    const preservingCurrentSnapshot = options.preserveSnapshot === true
      && comparableBoardRoot(snapshot.value?.boardRoot) === comparableBoardRoot(normalizedRoot)
    if (!preservingCurrentSnapshot) snapshot.value = null
    error.value = null
    useLabelsStore().prepareBoard(normalizedRoot)
    useViewStore().prepareBoard(normalizedRoot)
    try {
      const nextSnapshot = await window.board.readBoardSnapshot(normalizedRoot, {
        includeBoardSettings: true,
        includeTimestamps: true,
        includeTaskItems: true,
        includeV2: true,
      })
      if (token !== loadToken) return
      snapshot.value = nextSnapshot
      useLabelsStore().loadFromBoardSettings(nextSnapshot.boardSettings, normalizedRoot)
      useViewStore().syncBoardProfile(normalizedRoot, Boolean(nextSnapshot.v2?.profile?.enabled))
    } catch (nextError) {
      if (token !== loadToken) return
      snapshot.value = null
      error.value = nextError
    }
  }

  async function reconcileAfterMutation(boardRoot: string) {
    await loadBoard(boardRoot, { preserveSnapshot: true })
  }

  function clearBoard() {
    loadToken += 1
    snapshot.value = null
    useLabelsStore().clear()
    useViewStore().prepareBoard('')
    error.value = null
  }

  return {
    snapshot,
    error,
    boardName: computed(() => snapshot.value?.boardName || ''),
    lists: computed<BoardListSnapshot[]>(() => snapshot.value?.lists || []),
    hasBoard: computed(() => Boolean(snapshot.value)),
    isMissingBoard: computed(() => Boolean(error.value)),
    loadBoard,
    reconcileAfterMutation,
    clearBoard,
  }
})
