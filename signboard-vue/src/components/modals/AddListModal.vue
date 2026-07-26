<script setup lang="ts">
import { ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import { buildListPath, insertAfter } from '../../../lib/cardCreation.js'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useUiStore } from '../../stores/useUiStore'

const props = defineProps<{ isOpen: boolean; afterPath?: string; onClose: () => void; onCreated?: (path: string) => void }>()
const boards = useBoardsStore(); const data = useBoardDataStore(); const ui = useUiStore(); const name = ref(''); const saving = ref(false)
async function submit() {
  if (saving.value || !name.value.trim() || !boards.activeBoardPath) return
  saving.value = true
  try {
    const existing = window.board.listLists ? await window.board.listLists(boards.activeBoardPath) : data.lists.map((list) => list.listName)
    const path = await buildListPath(boards.activeBoardPath, name.value, existing.filter((item) => item !== 'XXX-Archive').length)
    await window.board.createList(path)
    const order = insertAfter(data.lists.map((list) => list.listPath), path, props.afterPath)
    if (window.board.reorderLists && order.length > 1) await window.board.reorderLists(order)
    await data.reconcileAfterMutation(boards.activeBoardPath); ui.announceStatus(`Created ${name.value.trim()}.`); props.onCreated?.(path); name.value = ''
  } catch (error) { console.error('Unable to create list.', error); ui.announceStatus('List could not be created.') }
  finally { saving.value = false }
}
</script>
<template>
  <Modal id="modalAddList" :is-open="isOpen" :on-close="onClose" positioning="fixed" :show-chrome="false" labelled-by="addListHeading" initial-focus="#userInputListName">
    <form class="modal-content" @submit.prevent="submit"><h2 id="addListHeading">Add list</h2><label for="userInputListName">List name</label><input id="userInputListName" v-model="name" type="text" autocomplete="off"><div class="modal-actions"><button id="btnAddList" type="submit" :disabled="saving || !name.trim()">{{ saving ? 'Creating…' : 'Add list' }}</button><button type="button" @click="onClose">Cancel</button></div></form>
  </Modal>
</template>
