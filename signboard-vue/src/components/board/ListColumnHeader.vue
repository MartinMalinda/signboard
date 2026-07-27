<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { BoardListSnapshot } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'
import ListActionsPopover from './ListActionsPopover.vue'
import { sanitizeFileName } from '../../../lib/santizeFileName.js'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useUiStore } from '../../stores/useUiStore'
import { getLegacyListNameParts } from '../../../lib/listNaming.js'

const props = defineProps<{ id: string; list: BoardListSnapshot; displayName: string; onAddCard?: (path: string) => void; onListChanged?: () => void }>()
const boards = useBoardsStore(); const data = useBoardDataStore(); const ui = useUiStore()
const title = ref<HTMLInputElement | null>(null); const opener = ref<HTMLElement | null>(null); const isOpen = ref(false); const isEditing = ref(false); const draftTitle = ref(props.displayName); let original = props.displayName; let isRenaming = false
const archiveCount = computed(() => props.list.cards.length)

watch(() => props.displayName, (nextName) => {
  if (isEditing.value) return
  draftTitle.value = nextName
  original = nextName
})

function focusTitle() { void nextTick(() => title.value?.focus()) }
async function rename() {
  if (isRenaming) return
  isRenaming = true
  try {
    const text = draftTitle.value.trim() || original
    if (!text || text === original) { draftTitle.value = original; return }
    const oldPath = props.list.listPath; const legacy = getLegacyListNameParts(props.list.listName)
    const clean = await sanitizeFileName(text)
    const nextDirectoryName = legacy ? `${legacy[1]}${clean}${legacy[3]}` : clean
    const nextPath = `${oldPath.slice(0, oldPath.lastIndexOf('/') + 1)}${nextDirectoryName}`
    if (nextPath !== oldPath) { await window.board.moveList(oldPath, nextPath); original = text; await data.reconcileAfterMutation(boards.activeBoardPath); ui.announceStatus(`Renamed ${text}.`); props.onListChanged?.() }
  } catch { draftTitle.value = original; ui.announceStatus('List name could not be saved.') }
  finally { isRenaming = false }
}
function toggleActions() { isOpen.value = !isOpen.value; if (isOpen.value) opener.value = document.activeElement as HTMLElement }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Enter') { event.preventDefault(); title.value?.blur() } else if (event.key === 'Escape') { draftTitle.value = original; title.value?.blur(); event.preventDefault() } }
</script>

<template>
  <div class="list-header">
    <div class="list-header-title">
      <input :id="id" ref="title" v-model="draftTitle" class="list-name" type="text" :size="Math.max(draftTitle.length + 1, 4)" aria-label="List name" :data-listpath="list.listPath" autocomplete="off" spellcheck="false" @pointerdown.stop @focus="isEditing = true; original = draftTitle.trim() || displayName" @blur="isEditing = false; void rename()" @keydown="onKeydown">
      <span class="list-card-count" :aria-label="`${list.cards.length} card${list.cards.length === 1 ? '' : 's'}`">{{ list.cards.length }}</span>
    </div>
    <div class="list-header-actions">
      <button ref="opener" class="list-actions-button" type="button" aria-label="List actions" :aria-expanded="isOpen" @pointerdown.stop @click="toggleActions"><FeatherIcon name="more-horizontal" /></button>
      <button class="list-add-card-button" type="button" :title="`Add card to ${displayName}`" :aria-label="`Add card to ${displayName}`" @pointerdown.stop @click.stop="onAddCard?.(list.listPath)"><FeatherIcon name="plus" /></button>
    </div>
    <ListActionsPopover :is-open="isOpen" :opener="opener" :list-path="list.listPath" :list-name="displayName" :card-count="archiveCount" :on-close="() => { isOpen = false; focusTitle() }" :on-add-card="onAddCard" :on-changed="onListChanged" />
  </div>
</template>
