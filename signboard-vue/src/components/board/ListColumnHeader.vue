<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { BoardListSnapshot } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'
import ListActionsPopover from './ListActionsPopover.vue'
import { sanitizeFileName } from '../../../lib/santizeFileName.js'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useUiStore } from '../../stores/useUiStore'

const props = defineProps<{ id: string; list: BoardListSnapshot; displayName: string; onAddCard?: (path: string) => void; onListChanged?: () => void }>()
const boards = useBoardsStore(); const data = useBoardDataStore(); const ui = useUiStore()
const title = ref<HTMLInputElement | null>(null); const opener = ref<HTMLElement | null>(null); const isOpen = ref(false); let original = props.displayName; let isRenaming = false
const archiveCount = computed(() => props.list.cards.length)

function focusTitle() { void nextTick(() => title.value?.focus()) }
async function rename() {
  if (isRenaming) return
  isRenaming = true
  try {
    const text = title.value?.value.trim() || original
    if (!text || text === original) { if (title.value) title.value.value = original; return }
    const oldPath = props.list.listPath; const prefix = oldPath.match(/(\d{3}-)/)?.[1] || ''
    const suffix = props.list.listName.match(/-(?:stock|[^-]{5})$/)?.[0] || ''
    const clean = await sanitizeFileName(text)
    const nextPath = `${oldPath.slice(0, oldPath.lastIndexOf('/') + 1)}${prefix}${clean}${suffix}`
    if (nextPath !== oldPath) { await window.board.moveList(oldPath, nextPath); original = text; await data.reconcileAfterMutation(boards.activeBoardPath); ui.announceStatus(`Renamed ${text}.`); props.onListChanged?.() }
  } catch { if (title.value) title.value.value = original; ui.announceStatus('List name could not be saved.') }
  finally { isRenaming = false }
}
function toggleActions() { isOpen.value = !isOpen.value; if (isOpen.value) opener.value = document.activeElement as HTMLElement }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Enter') { event.preventDefault(); void rename() } else if (event.key === 'Escape') { if (title.value) title.value.value = original; title.value?.blur(); event.preventDefault() } }
</script>

<template>
  <div class="list-header">
    <input :id="id" ref="title" class="list-name" type="text" :value="displayName" aria-label="List name" :data-listpath="list.listPath" autocomplete="off" spellcheck="false" @pointerdown.stop @focus="original = title?.value.trim() || displayName" @blur="rename" @keydown="onKeydown">
    <span class="list-card-count" :aria-label="`${list.cards.length} card${list.cards.length === 1 ? '' : 's'}`">{{ list.cards.length }}</span>
    <button ref="opener" class="list-actions-button" type="button" aria-label="List actions" :aria-expanded="isOpen" @pointerdown.stop @click="toggleActions"><FeatherIcon name="more-horizontal" /></button>
    <ListActionsPopover :is-open="isOpen" :opener="opener" :list-path="list.listPath" :list-name="displayName" :card-count="archiveCount" :on-close="() => { isOpen = false; focusTitle() }" :on-add-card="onAddCard" :on-changed="onListChanged" />
  </div>
</template>
