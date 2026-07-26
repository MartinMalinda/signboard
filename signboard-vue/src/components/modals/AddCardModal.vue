<script setup lang="ts">
import { computed, ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import { buildCardPath } from '../../../lib/cardCreation.js'
import { useUiStore } from '../../stores/useUiStore'
import type { BoardLabel } from '../../types'

const props = defineProps<{ isOpen: boolean; listPath: string; labels: BoardLabel[]; onClose: () => void; onCreated: (path: string, options?: { openAfterCreate?: boolean }) => void }>()
const ui = useUiStore(); const name = ref(''); const selectedLabels = ref<string[]>([]); const saving = ref(false)
const heading = computed(() => { const parts = props.listPath.split('/').filter(Boolean); return `Add card to ${parts[parts.length - 1] || 'list'}` })
function reset() { name.value = ''; selectedLabels.value = [] }
async function submit(openAfterCreate = false) {
  if (saving.value || !props.listPath || !name.value.trim() || !window.board.createCard) return
  saving.value = true
  try {
    const count = window.board.countCards ? await window.board.countCards(props.listPath) : (window.board.listCards ? (await window.board.listCards(props.listPath)).length : 0)
    const path = await buildCardPath(props.listPath, name.value, count)
    await window.board.createCard(path, name.value.trim(), { frontmatter: selectedLabels.value.length ? { labels: selectedLabels.value } : undefined })
    ui.announceStatus(`Created ${name.value.trim()}.`); reset(); props.onCreated(path, { openAfterCreate })
  } catch (error) { console.error('Unable to create card.', error); ui.announceStatus('Card could not be created.') }
  finally { saving.value = false }
}
function keydown(event: KeyboardEvent) { if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); void submit(true) } }
</script>
<template>
  <Modal id="modalAddCard" :is-open="isOpen" :on-close="onClose" positioning="fixed" :show-chrome="false" labelled-by="addCardHeading" initial-focus="#userInputCardName">
    <form class="modal-content" @submit.prevent="submit()">
      <h2 id="addCardHeading">{{ heading }}</h2>
      <label for="userInputCardName">Card name</label><input id="userInputCardName" v-model="name" type="text" autocomplete="off" @keydown="keydown">
      <fieldset v-if="labels.length"><legend>Labels</legend><label v-for="label in labels" :key="label.id"><input v-model="selectedLabels" type="checkbox" :value="label.id"> {{ label.name }}</label></fieldset>
      <p class="modal-hint">Shift + Enter creates and opens the card.</p>
      <div class="modal-actions"><button id="btnAddCard" type="submit" :disabled="saving || !name.trim()">{{ saving ? 'Creating…' : 'Add card' }}</button><button type="button" @click="onClose">Cancel</button></div>
    </form>
  </Modal>
</template>
