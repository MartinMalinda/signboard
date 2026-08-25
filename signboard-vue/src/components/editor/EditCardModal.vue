<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEditorStore } from '../../stores/useEditorStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import Modal from '../../lib/components/Modal.vue'
import CardTitleField from './CardTitleField.vue'
import CardNotesEditor from './CardNotesEditor.vue'
import CardTimestamps from './CardTimestamps.vue'
import CardEditorActions from './CardEditorActions.vue'
import V2WorkDetails from './V2WorkDetails.vue'
import FeatherIcon from '../FeatherIcon.vue'

const editor = useEditorStore()
const boardData = useBoardDataStore()
const v2Enabled = computed(() => boardData.snapshot?.v2?.profile?.enabled === true)
const listPaths = ref<string[]>([])
const status = ref('')
const v2DetailsOpen = ref(false)
const notes = ref<InstanceType<typeof CardNotesEditor> | null>(null)
let externalSyncTimer: number | null = null

async function loadEditorExtras() {
  const root = editor.boardPathForCard(editor.cardPath)
  if (window.board.listLists && root) listPaths.value = (await window.board.listLists(root)).map((name) => `${root}${name}`)
}

async function openCard(path: string, options: { focusNotes?: boolean; stack?: boolean } = {}) {
  const opened = options.stack ? await editor.openStacked(path, options) : await editor.open(path, options)
  if (opened) await loadEditorExtras()
}

async function close() {
  await editor.close()
  if (editor.isOpen) await loadEditorExtras()
}
async function closeAll() { await editor.closeAll() }
function openV2Details() { v2DetailsOpen.value = true }
function closeV2Details() { v2DetailsOpen.value = false }

async function refreshFromExternalChange(reconcileMissing = true) {
  const changed = await editor.refreshFromDiskIfClean({ reconcileMissing })
  if (changed) notes.value?.setExternalBody(editor.body)
  return changed
}

async function move(path: string) {
  const moved = await editor.moveToList(path)
  if (moved) { status.value = 'Moved card.'; await loadEditorExtras() }
  return moved
}

async function archive() { await editor.archive() }

async function copyMarkdown() {
  if (await editor.copyMarkdown()) status.value = 'Copied Markdown file.'
}

async function copyPath() {
  if (await editor.copyPath()) status.value = 'Copied card path.'
}

async function moveAdjacent(direction: -1 | 1) {
  const currentIndex = listPaths.value.findIndex((path) => editor.cardPath.startsWith(`${path}/`))
  const target = listPaths.value[currentIndex + direction]
  if (target) await move(target)
}

async function archiveActive() { await archive() }

async function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files
  if (!files?.length || !editor.cardPath || !window.chooser.linkDroppedObjects) return
  event.preventDefault(); event.stopPropagation()
  const result = await window.chooser.linkDroppedObjects(editor.cardPath, files)
  if (result?.frontmatter) editor.frontmatter = result.frontmatter
  if (result?.ok) status.value = 'Linked dropped files.'
}

defineExpose({ openCard, closeCard: closeAll, closeCardStack: close, refreshFromExternalChange, moveAdjacent, archiveActive })

onMounted(() => {
  externalSyncTimer = window.setInterval(() => {
    if (editor.isOpen) editor.refreshFromDiskIfClean().then((changed) => { if (changed) notes.value?.setExternalBody(editor.body) }).catch(() => {})
  }, 1000)
})
onBeforeUnmount(() => { if (externalSyncTimer !== null) window.clearInterval(externalSyncTimer) })
watch(() => editor.isOpen, (isOpen) => { if (!isOpen) v2DetailsOpen.value = false })
watch(() => editor.cardPath, () => { v2DetailsOpen.value = false })
</script>

<template>
  <Modal :is-open="editor.isOpen" :on-close="close" positioning="fixed" :overflow="true" :show-chrome="false" labelled-by="cardEditorTitle" :initial-focus="editor.focusNotes ? '#cardEditorNotes' : '#cardEditorTitle'">
    <div class="cardEditorHeader">
      <CardTitleField :value="editor.title" :placeholder="editor.displayTitle" :on-change="editor.setTitle" />
      <div class="cardEditorHeaderActions">
        <button v-if="editor.stackDepth" id="cardEditorBack" type="button" title="Back to previous card" aria-label="Back to previous card" @click="close"><FeatherIcon name="arrow-left" /></button>
        <CardEditorActions :on-archive="archive" :on-copy="copyMarkdown" :on-copy-path="copyPath" />
        <button id="cardEditorClose" type="button" title="Close" aria-label="Close card editor" aria-keyshortcuts="Escape" @click="close"><FeatherIcon name="x" /></button>
      </div>
    </div>
    <div class="card-editor-modal-content" @dragover.prevent @drop.prevent="void handleDrop($event)">
      <CardNotesEditor ref="notes" :on-open-card="openCard" :on-open-v2-details="openV2Details" :v2-enabled="v2Enabled" :list-paths="listPaths" :on-move="move" />
      <CardTimestamps :timestamps="editor.timestamps" />
      <input id="cardEditorCardPath" type="hidden" :value="editor.cardPath" />
      <input id="cardEditorCardMetadata" type="hidden" :value="JSON.stringify(editor.frontmatter)" />
      <input id="cardEditorCardDueDate" type="hidden" :value="editor.frontmatter.due || ''" />
      <p v-if="status || editor.saveError" class="card-editor-status" role="status">{{ status || 'Unable to save card.' }}</p>
    </div>
  </Modal>
  <Modal id="cardEditorV2DetailsModal" :is-open="v2DetailsOpen" :on-close="closeV2Details" positioning="fixed" size="large" :overflow="true" :z-index="1100" :show-chrome="false" aria-label="Detailed V2 work fields" initial-focus="#cardEditorV2DetailsClose">
    <div class="v2-editor-details-overlay">
      <div class="v2-editor-details-overlay-header">
        <button id="cardEditorV2DetailsClose" type="button" title="Close detailed V2 work fields" aria-label="Close detailed V2 work fields" @click="closeV2Details"><FeatherIcon name="x" /></button>
      </div>
      <V2WorkDetails v-if="v2Enabled" :list-paths="listPaths" :on-move="move" />
    </div>
  </Modal>
</template>
