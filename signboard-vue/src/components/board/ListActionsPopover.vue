<script setup lang="ts">
import { computed } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useUiStore } from '../../stores/useUiStore'
import { getShortcutAriaKeyshortcuts, getShortcutHintText } from '../../../lib/shortcutLabels.js'

const props = defineProps<{ isOpen: boolean; opener: HTMLElement | null; listPath: string; listName: string; cardCount: number; onClose: () => void; onAddCard?: (path: string) => void; onChanged?: () => void }>()
const boards = useBoardsStore(); const data = useBoardDataStore(); const ui = useUiStore()
const canMoveLeft = computed(() => data.lists.findIndex((list) => list.listPath === props.listPath) > 0)
const canMoveRight = computed(() => { const index = data.lists.findIndex((list) => list.listPath === props.listPath); return index >= 0 && index < data.lists.length - 1 })

function boardRoot() { return boards.activeBoardPath }

async function move(offset: number) {
  const root = boardRoot(); if (!root || !window.board.reorderLists) return
  const paths = data.lists.map((list) => list.listPath); const index = paths.indexOf(props.listPath); const target = index + offset
  if (index < 0 || target < 0 || target >= paths.length) return
  ;[paths[index], paths[target]] = [paths[target] || '', paths[index] || '']
  await window.board.reorderLists(paths); props.onClose(); await data.reconcileAfterMutation(root); ui.announceStatus(`Moved ${props.listName}.`); props.onChanged?.()
}

async function archiveCards() {
  if (!window.board.archiveCard || !window.board.listCards) return
  if (typeof window.confirm === 'function' && !window.confirm(`Archive all cards in ${props.listName}?`)) return
  for (const card of await window.board.listCards(props.listPath)) await window.board.archiveCard(`${props.listPath.replace(/\/$/, '')}/${card}`)
  props.onClose(); await data.reconcileAfterMutation(boardRoot()); ui.announceStatus(`Archived cards in ${props.listName}.`); props.onChanged?.()
}

async function archiveList() {
  if (!window.board.archiveList) return
  if (typeof window.confirm === 'function' && !window.confirm(`Archive list ${props.listName}?`)) return
  await window.board.archiveList(props.listPath); props.onClose(); await data.reconcileAfterMutation(boardRoot()); ui.announceStatus(`Archived ${props.listName}.`); props.onChanged?.()
}
</script>

<template>
  <AppPopover v-if="isOpen" id="listActionsPopover" :is-open="isOpen" :opener="opener" :on-close="onClose" :aria-label="`${listName} actions`" class-name="list-actions-popover">
    <button class="list-actions-option" type="button" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('addCard')" @click="onClose(); onAddCard?.(listPath)"><FeatherIcon name="plus" /><span class="list-actions-option-label">Add new card</span><span class="menu-shortcut-hint list-actions-option-shortcut">{{ getShortcutHintText('addCard') }}</span></button>
    <button class="list-actions-option" type="button" :disabled="!canMoveLeft" @click="move(-1)"><FeatherIcon name="chevron-left" /><span class="list-actions-option-label">Move list left</span></button>
    <button class="list-actions-option" type="button" :disabled="!canMoveRight" @click="move(1)"><FeatherIcon name="chevron-right" /><span class="list-actions-option-label">Move list right</span></button>
    <button class="list-actions-option" type="button" :disabled="cardCount === 0" @click="archiveCards"><FeatherIcon name="archive" /><span class="list-actions-option-label">Archive cards in list</span></button>
    <button class="list-actions-option list-actions-option-destructive" type="button" @click="archiveList"><FeatherIcon name="trash-2" /><span class="list-actions-option-label">Archive this list</span></button>
  </AppPopover>
</template>
