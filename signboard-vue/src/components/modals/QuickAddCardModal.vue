<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import { buildCardPath } from '../../../lib/cardCreation.js'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useUiStore } from '../../stores/useUiStore'
import type { BoardLabel, V2BoardProfile } from '../../types'

const props = defineProps<{ isOpen: boolean; onClose: () => void; onCreated: (path: string, options?: { openAfterCreate?: boolean }) => void }>()
const boards = useBoardsStore(); const data = useBoardDataStore(); const ui = useUiStore()
const boardPath = ref(''); const listPath = ref(''); const lists = ref<string[]>([]); const name = ref(''); const selectedLabels = ref<string[]>([]); const saving = ref(false); const v2Profile = ref<V2BoardProfile>({}); const workOpen = ref(false); const kind = ref('task'); const workType = ref('product'); const priorityClass = ref('P2'); const effortPoints = ref(''); let wasOpen = false
const labels = computed<BoardLabel[]>(() => boardPath.value === boards.activeBoardPath ? data.snapshot?.boardSettings?.labels || [] : [])
const effectiveV2Profile = computed(() => (boardPath.value === boards.activeBoardPath && data.snapshot?.v2?.profile) || v2Profile.value)
const v2Enabled = computed(() => effectiveV2Profile.value.enabled === true)
const v2Defaults = computed(() => effectiveV2Profile.value.cardDefaults || {})

async function loadLists(root: string) { lists.value = window.board.listLists ? await window.board.listLists(root) : await window.board.listDirectories(root); const parts = listPath.value.split('/').filter(Boolean); if (!lists.value.includes(parts[parts.length - 1] || '')) listPath.value = lists.value.find((item) => item !== 'XXX-Archive') || lists.value[0] || ''; const settings = window.board.readBoardSettings ? await window.board.readBoardSettings(root) : null; v2Profile.value = (settings?.v2 || (root === boards.activeBoardPath ? data.snapshot?.v2?.profile : undefined) || {}) as V2BoardProfile; applyV2Defaults() }
function reset() { boardPath.value = boards.activeBoardPath || boards.openBoardPaths[0] || ''; listPath.value = ''; name.value = ''; selectedLabels.value = []; workOpen.value = false; v2Profile.value = (boardPath.value === boards.activeBoardPath ? data.snapshot?.v2?.profile : undefined) || {}; applyV2Defaults() }
function applyV2Defaults() { kind.value = String(v2Defaults.value.kind || 'task'); workType.value = String(v2Defaults.value.workType || 'product'); priorityClass.value = String(v2Defaults.value.priorityClass || 'P2'); effortPoints.value = '' }
async function openState() { reset(); if (boardPath.value) await loadLists(boardPath.value) }
async function chooseBoard() { await loadLists(boardPath.value) }
function creationFrontmatter() { const frontmatter: Record<string, unknown> = selectedLabels.value.length ? { labels: selectedLabels.value } : {}; if (v2Enabled.value) { const metadata: Record<string, unknown> = { contract_version: 1, kind: kind.value, work_type: workType.value, priority_class: priorityClass.value }; if (effortPoints.value) metadata.estimate = { effort_points: Number(effortPoints.value) }; frontmatter.signboard_v2 = metadata }; return Object.keys(frontmatter).length ? frontmatter : undefined }
async function submit(openAfterCreate = false) {
  if (saving.value || !name.value.trim() || !boardPath.value || !listPath.value) return
  saving.value = true
  try {
    const targetList = `${boardPath.value.replace(/\/$/, '')}/${listPath.value}`
    const count = window.board.countCards ? await window.board.countCards(targetList) : (window.board.listCards ? (await window.board.listCards(targetList)).length : 0)
    const path = await buildCardPath(targetList, name.value, count)
    await window.board.createCard(path, name.value.trim(), { frontmatter: creationFrontmatter() })
    if (boardPath.value !== boards.activeBoardPath) await boards.activateBoard(boardPath.value)
    ui.announceStatus(`Created ${name.value.trim()}.`); props.onCreated(path, { openAfterCreate }); name.value = ''; selectedLabels.value = []; applyV2Defaults(); workOpen.value = false
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
      <button v-if="v2Enabled" id="quickAddWorkDetailsToggle" class="creation-work-details-toggle" type="button" :aria-expanded="workOpen" aria-controls="quickAddWorkDetails" @click="workOpen = !workOpen">{{ workOpen ? 'Hide' : 'Show' }} Work details</button>
      <fieldset v-if="v2Enabled && workOpen" id="quickAddWorkDetails" class="creation-work-details"><legend>Work details <span>Optional</span></legend><label>Kind<select v-model="kind"><option value="task">Task</option><option value="discovery">Discovery</option><option value="epic">Epic</option><option value="incident">Incident</option></select></label><label>Work type<select v-model="workType"><option value="product">Product</option><option value="ux">UX</option><option value="engineering_health">Engineering health</option><option value="discovery">Discovery</option><option value="documentation">Documentation</option></select></label><label>Priority<select v-model="priorityClass"><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select></label><label>Effort points<input v-model="effortPoints" type="number" min="1" max="99" step="1" placeholder="Unset"></label></fieldset>
      <p class="modal-hint new-card-modal-helper"><kbd>Shift</kbd><span aria-hidden="true">+</span><kbd>Enter</kbd> creates and opens the card.</p>
      <div class="modal-actions"><button id="btnAddCardToList" type="submit" :disabled="saving || !name.trim() || !listPath">{{ saving ? 'Creating…' : 'Add card' }}</button><button type="button" @click="onClose">Cancel</button></div>
    </form>
  </Modal>
</template>
