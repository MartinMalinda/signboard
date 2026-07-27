<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import { buildCardPath } from '../../../lib/cardCreation.js'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useUiStore } from '../../stores/useUiStore'
import type { BoardLabel } from '../../types'

const props = defineProps<{ isOpen: boolean; onClose: () => void; onCreated: (path: string, options?: { openAfterCreate?: boolean }) => void }>()
const boards = useBoardsStore(); const data = useBoardDataStore(); const ui = useUiStore()
const boardPath = ref(''); const listPath = ref(''); const lists = ref<string[]>([]); const name = ref(''); const selectedLabels = ref<string[]>([]); const saving = ref(false); let wasOpen = false
const labels = computed<BoardLabel[]>(() => boardPath.value === boards.activeBoardPath ? data.snapshot?.boardSettings?.labels || [] : [])

async function loadLists(root: string) { lists.value = window.board.listLists ? await window.board.listLists(root) : await window.board.listDirectories(root); const parts = listPath.value.split('/').filter(Boolean); if (!lists.value.includes(parts[parts.length - 1] || '')) listPath.value = lists.value.find((item) => item !== 'XXX-Archive') || lists.value[0] || '' }
function reset() { boardPath.value = boards.activeBoardPath || boards.openBoardPaths[0] || ''; listPath.value = ''; name.value = ''; selectedLabels.value = [] }
async function openState() { reset(); if (boardPath.value) await loadLists(boardPath.value) }
async function chooseBoard() { await loadLists(boardPath.value) }
async function submit(openAfterCreate = false) {
  if (saving.value || !name.value.trim() || !boardPath.value || !listPath.value) return
  saving.value = true
  try {
    const targetList = `${boardPath.value.replace(/\/$/, '')}/${listPath.value}`
    const count = window.board.countCards ? await window.board.countCards(targetList) : (window.board.listCards ? (await window.board.listCards(targetList)).length : 0)
    const path = await buildCardPath(targetList, name.value, count)
    await window.board.createCard(path, name.value.trim(), { frontmatter: selectedLabels.value.length ? { labels: selectedLabels.value } : undefined })
    if (boardPath.value !== boards.activeBoardPath) await boards.activateBoard(boardPath.value)
    ui.announceStatus(`Created ${name.value.trim()}.`); props.onCreated(path, { openAfterCreate }); name.value = ''; selectedLabels.value = []
  } catch (error) { console.error('Unable to quick-add card.', error); ui.announceStatus('Card could not be created.') }
  finally { saving.value = false }
}
function keydown(event: KeyboardEvent) { if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); void submit(true) } }
onMounted(() => { if (props.isOpen) { wasOpen = true; void openState() } })
onUpdated(() => { if (props.isOpen && !wasOpen) { wasOpen = true; void openState() } else if (!props.isOpen) wasOpen = false })
</script>
<template>
  <Modal id="modalAddCardToList" modal-class="quick-add-card-modal" :is-open="isOpen" :on-close="onClose" positioning="fixed" :show-chrome="false" labelled-by="quickAddHeading" initial-focus="#userInputCardName">
    <form class="modal-content quick-add-card-form" @submit.prevent="submit()">
      <h2 id="quickAddHeading">Quick add card</h2>
      <div class="quick-add-field">
        <label for="userInputBoardPath">Board</label>
        <select id="userInputBoardPath" v-model="boardPath" @change="chooseBoard">
          <option v-for="root in boards.openBoardPaths" :key="root" :value="root">{{ root.replace(/\/$/, '').split('/').slice(-1)[0] }}</option>
        </select>
      </div>
      <div class="quick-add-field">
        <label for="userInputListPath">List</label>
        <select id="userInputListPath" v-model="listPath">
          <option v-for="list in lists.filter((item) => item !== 'XXX-Archive')" :key="list" :value="list">{{ list.replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, '') }}</option>
        </select>
      </div>
      <div class="quick-add-field">
        <label for="userInputCardName">Card name</label>
        <input id="userInputCardName" v-model="name" type="text" autocomplete="off" @keydown="keydown">
      </div>
      <fieldset v-if="labels.length" class="quick-add-labels">
        <legend>Labels <span>Optional</span></legend>
        <div class="quick-add-label-options">
          <label v-for="label in labels" :key="label.id" class="quick-add-label-option" :class="{ 'is-selected': selectedLabels.includes(label.id) }">
            <input v-model="selectedLabels" type="checkbox" :value="label.id">
            <span>{{ label.name }}</span>
          </label>
        </div>
      </fieldset>
      <p class="modal-hint new-card-modal-helper"><kbd>Shift</kbd><span aria-hidden="true">+</span><kbd>Enter</kbd> creates and opens the card.</p>
      <div class="modal-actions"><button id="btnAddCardToList" type="submit" :disabled="saving || !name.trim() || !listPath">{{ saving ? 'Creating…' : 'Add card' }}</button><button type="button" @click="onClose">Cancel</button></div>
    </form>
  </Modal>
</template>
