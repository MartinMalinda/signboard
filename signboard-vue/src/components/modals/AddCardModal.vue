<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import LabelCheckboxList from './LabelCheckboxList.vue'
import { buildCardPath } from '../../../lib/cardCreation.js'
import { displayListName } from '../../../lib/boardLabels.js'
import { useUiStore } from '../../stores/useUiStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import type { BoardLabel } from '../../types'

const props = defineProps<{ isOpen: boolean; listPath: string; labels: BoardLabel[]; onClose: () => void; onCreated: (path: string, options?: { openAfterCreate?: boolean }) => void }>()
const ui = useUiStore(); const data = useBoardDataStore(); const name = ref(''); const selectedLabels = ref<string[]>([]); const saving = ref(false); const workOpen = ref(false); const kind = ref('task'); const priorityClass = ref('P2'); const effortPoints = ref('')
const v2Profile = computed(() => data.snapshot?.v2?.profile || data.snapshot?.boardSettings?.v2 || {})
const v2Enabled = computed(() => v2Profile.value.enabled === true)
const v2Defaults = computed(() => v2Profile.value.cardDefaults || {})
const heading = computed(() => { const parts = props.listPath.split('/').filter(Boolean); return `Add card to ${displayListName(parts[parts.length - 1] || 'list') || 'list'}` })
function reset() { name.value = ''; selectedLabels.value = [] }
function resetWorkDetails() { kind.value = String(v2Defaults.value.kind || 'task'); priorityClass.value = String(v2Defaults.value.priorityClass || 'P2'); effortPoints.value = ''; workOpen.value = false }
function creationFrontmatter() {
  const frontmatter: Record<string, unknown> = selectedLabels.value.length ? { labels: [...selectedLabels.value] } : {}
  if (v2Enabled.value) {
    const metadata: Record<string, unknown> = { contract_version: 1, kind: kind.value, priority_class: priorityClass.value }
    if (effortPoints.value) metadata.estimate = { effort_points: Number(effortPoints.value) }
    frontmatter.signboard_v2 = metadata
  }
  return Object.keys(frontmatter).length ? frontmatter : undefined
}
async function submit(openAfterCreate = false) {
  if (saving.value || !props.listPath || !name.value.trim() || !window.board.createCard) return
  saving.value = true
  try {
    const count = window.board.countCards ? await window.board.countCards(props.listPath) : (window.board.listCards ? (await window.board.listCards(props.listPath)).length : 0)
    const path = await buildCardPath(props.listPath, name.value, count)
    await window.board.createCard(path, '', { frontmatter: creationFrontmatter() })
    ui.announceStatus(`Created ${name.value.trim()}.`); reset(); resetWorkDetails(); props.onCreated(path, { openAfterCreate })
  } catch (error) { console.error('Unable to create card.', error); ui.announceStatus('Card could not be created.') }
  finally { saving.value = false }
}
function keydown(event: KeyboardEvent) { if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); void submit(true) } }
watch(() => props.isOpen, (isOpen) => { if (isOpen) { reset(); resetWorkDetails() } })
onMounted(() => { if (props.isOpen) { reset(); resetWorkDetails() } })
</script>
<template>
  <Modal id="modalAddCard" :is-open="isOpen" :on-close="onClose" positioning="fixed" :overflow="true" :show-chrome="false" labelled-by="addCardHeading" initial-focus="#userInputCardName">
    <form class="modal-content" @submit.prevent="submit()">
      <h2 id="addCardHeading">{{ heading }}</h2>
      <label for="userInputCardName">Card name</label><input id="userInputCardName" v-model="name" type="text" autocomplete="off" @keydown="keydown"><p class="modal-hint">This seeds the filename. The title is optional and can be set after creation.</p>
      <fieldset v-if="labels.length" class="quick-add-labels">
        <legend>Labels <span>Optional</span></legend>
        <LabelCheckboxList v-model="selectedLabels" :labels="labels" />
      </fieldset>
      <button v-if="v2Enabled" id="addCardWorkDetailsToggle" class="creation-work-details-toggle" type="button" :aria-expanded="workOpen" aria-controls="addCardWorkDetails" @click="workOpen = !workOpen">{{ workOpen ? 'Hide' : 'Show' }} Work details</button>
      <fieldset v-if="v2Enabled && workOpen" id="addCardWorkDetails" class="creation-work-details"><legend>Work details <span>Optional</span></legend><label>Kind<select v-model="kind"><option value="task">Task</option><option value="discovery">Discovery</option><option value="epic">Epic</option><option value="incident">Incident</option></select></label><label>Priority<select v-model="priorityClass"><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select></label><label>Effort points<input v-model="effortPoints" type="number" min="1" max="99" step="1" placeholder="Unset"></label></fieldset>
      <p class="modal-hint">Shift + Enter creates and opens the card.</p>
      <div class="modal-actions"><button id="btnAddCard" type="submit" :disabled="saving || !name.trim()">{{ saving ? 'Creating…' : 'Add card' }}</button><button type="button" @click="onClose">Cancel</button></div>
    </form>
  </Modal>
</template>
